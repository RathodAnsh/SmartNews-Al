from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from newspaper import Article
from transformers import pipeline, AutoTokenizer
from gtts import gTTS
import re
import logging
import os
import uuid
import io
from concurrent.futures import ThreadPoolExecutor
import csv

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load Summarization Model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

# Configure Logging
logging.basicConfig(level=logging.INFO)

def clean_text(text):
    """Removes ads, footers, navigation links, and unwanted text from extracted content."""
    unwanted_patterns = [
        r"Subscribe to continue reading",
        r"Sign up for our newsletter.*",
        r"Read more at .*",
        r"Visit [\w\.\-/]+ for more.*",
        r"Click here to .*",
        r"Follow us on .*",
        r"Advertisement.*",
        r"© \d{4} .*",  # Copyright info
        r"Published by .*",  # Publishing house info
        r"Share this article.*",
        r"Related articles.*",
        r"Comments.*",
        r"Tags:.*",
        r"By [\w\s]+",  # Author name
        r"Photo by .*",  # Photo credits
        r"Image source: .*",  # Image source
        r"Subscribe now.*",  # Subscription prompts
        r"Get unlimited access.*",  # Subscription prompts
        r"Twitter:.*",  # Twitter embeds
        r"Tweet:.*",  # Twitter embeds
        r"Facebook:.*",  # Facebook embeds
        r"Instagram:.*",  # Instagram embeds
        r"LinkedIn:.*",  # LinkedIn embeds
        r"Recommended for you.*",  # Recommended content
        r"Sponsored by .*",  # Sponsored content
        r"Pop-up.*",  # Pop-ups
        r"Close this pop-up.*",  # Pop-ups
        r"Available to .* users only",  # Location restrictions
        r"FOLLOW LIVE:.*",  # Live updates
        r"CLICK HERE.*",  # Click prompts
        r"Sign in to continue reading.*",  # Sign-in prompts
    ]
    
    for pattern in unwanted_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    return re.sub(r'\s+', ' ', text).strip()  # Normalize spacing

def get_main_content(url):
    """Fetch and extract main news content from the article URL using newspaper3k and BeautifulSoup as fallback."""
    try:
        # Try extracting content using newspaper3k
        article = Article(url)
        article.download()
        article.parse()
        if article.text and len(article.text.split()) > 30:
            logging.info(f"Extracted content using newspaper3k: {article.text[:500]}...")
            return clean_text(article.text), None  # Return cleaned content

    except Exception as e:
        logging.warning(f"newspaper3k extraction failed: {str(e)}. Falling back to BeautifulSoup.")

    # If newspaper3k fails, use BeautifulSoup as a backup
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Check for content not available messages
        if "content is not available in your location" in soup.get_text().lower():
            return None, "Content is not available in your location."

        # Remove unwanted tags
        for tag in soup(['script', 'style', 'header', 'footer', 'aside', 'nav', 'form', 'noscript', 'iframe', 'meta', 'link']):
            tag.decompose()

        # Extract title for context checking
        title = soup.find('title')
        title_text = title.get_text(strip=True) if title else "Untitled"

        # Try different extraction methods
        content = ""

        # Method 1: Extract from <article> tag
        article_tag = soup.find('article')
        if article_tag:
            paragraphs = article_tag.find_all('p')
            content = ' '.join(p.get_text() for p in paragraphs)

        # Method 2: Find divs containing news content
        if not content:
            content_divs = soup.find_all('div', class_=lambda x: x and any(term in x.lower() for term in ['article', 'story', 'content', 'post', 'text']))
            if content_divs:
                main_div = max(content_divs, key=lambda x: len(x.get_text()))
                paragraphs = main_div.find_all('p')
                content = ' '.join(p.get_text() for p in paragraphs)

        # Method 3: Find the largest div with paragraphs
        if not content:
            all_divs = soup.find_all('div')
            if all_divs:
                main_div = max(all_divs, key=lambda x: len(x.find_all('p')))
                paragraphs = main_div.find_all('p')
                content = ' '.join(p.get_text() for p in paragraphs)

        if not content:
            return None, "Could not extract article content"

        # Clean extracted content
        cleaned_content = clean_text(content)

        # Ensure content is relevant
        if len(cleaned_content.split()) < 30:  # Minimum length check
            return None, "Extracted content is too short for summarization"

        logging.info(f"Extracted content using BeautifulSoup: {cleaned_content[:500]}...")  # Log first 500 characters

        return cleaned_content, None

    except requests.exceptions.RequestException as e:
        logging.error(f"Request error: {str(e)}")
        return None, f"Failed to fetch article: {str(e)}"
    except Exception as e:
        logging.error(f"Extraction error: {str(e)}")
        return None, f"Error processing article: {str(e)}"

def summarize_text(text):
    """Summarize text while handling large inputs efficiently and quickly."""
    max_token_length = 1024

    # Tokenize the text once to avoid redundant tokenization
    tokens = tokenizer(text, return_tensors="pt", truncation=False)['input_ids'][0]
    token_chunks = []
    current_chunk = []

    # Efficiently split tokens into chunks
    for token in tokens:
        current_chunk.append(token)
        if len(current_chunk) >= max_token_length:
            token_chunks.append(current_chunk)
            current_chunk = []

    if current_chunk:
        token_chunks.append(current_chunk)

    # Decode token chunks back to text
    text_chunks = [tokenizer.decode(chunk, skip_special_tokens=True) for chunk in token_chunks]

    # Summarize each chunk in parallel
    def summarize_chunk(chunk):
        return summarizer(
            chunk,
            max_length=150,
            min_length=75,
            do_sample=False
        )[0]["summary_text"]

    with ThreadPoolExecutor() as executor:
        summaries = list(executor.map(summarize_chunk, text_chunks))

    # Combine the summaries into a final summary
    final_summary = ' '.join(summaries)
    logging.info(f"Generated summary: {final_summary}")  # Log the generated summary

    return final_summary

# def save_to_csv(url, original_content, generated_summary):
#     """Save URL, original content, and generated summary to a CSV file."""
#     csv_file_path = "summarization_results.csv"  # Path to the CSV file

#     try:
#         # Check if the CSV file already exists
#         file_exists = os.path.isfile(csv_file_path)

#         # Open the CSV file in append mode
#         with open(csv_file_path, mode='a', newline='', encoding='utf-8') as csv_file:
#             fieldnames = ['url', 'original_content', 'generated_summary']
#             writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

#             # Write the header only if the file is new
#             if not file_exists:
#                 writer.writeheader()

#             # Write the new data
#             writer.writerow({
#                 'url': url,
#                 'original_content': original_content,
#                 'generated_summary': generated_summary
#             })

#         logging.info(f"Data saved to CSV: {csv_file_path}")

#     except Exception as e:
#         logging.error(f"Error saving to CSV: {str(e)}")

@app.route("/summarize", methods=["POST"])
def summarize():
    """API endpoint to fetch and summarize a news article."""
    try:
        data = request.get_json()
        if not data or "url" not in data:
            logging.error("URL is required")
            return jsonify({"error": "URL is required"}), 400

        url = data["url"]
        content, error = get_main_content(url)

        if error:
            logging.error(f"Content extraction failed: {error}")
            return jsonify({"error": error}), 400

        summary = summarize_text(content)

        #  # Save the original content and summary to a CSV file
        # save_to_csv(url, content, summary)
        
        return jsonify({"summary": summary})

    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/generate-audio", methods=["POST"])
def generate_audio():
    """API endpoint to stream audio for the summary text."""
    try:
        data = request.get_json()
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text is empty"}), 400

        # Detect language
        lang = detect_language(text)
        logging.info(f"Detected language: {lang}, Text: {text}")

        # Adjust text for better readability
        adjusted_text = text.replace('.', '. ').replace(',', ', ').replace('!', '! ').replace('?', '? ')

        # Generate audio using GTTS with medium speed (slow=False)
        tts = gTTS(text=adjusted_text, lang=lang, slow=False)
        audio_stream = io.BytesIO()
        tts.write_to_fp(audio_stream)
        audio_stream.seek(0)

        # Log that the reading process has started
        logging.info("Reading process started with medium speed.")

        # Stream the audio directly to the client
        return Response(audio_stream, mimetype="audio/mpeg")

    except Exception as e:
        logging.error(f"Error generating audio: {str(e)}")
        return jsonify({"error": "Failed to generate audio"}), 500

def detect_language(text):
    """Detect the language of the given text."""
    if any(char in text for char in "अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह"):
        return "hi"  # Hindi
    if any(char in text for char in "अआइईउऊऋएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहळ"):
        return "mr"  # Marathi
    return "en"  # Default to English

# Ensure the static/audio directory exists
if not os.path.exists("static/audio"):
    os.makedirs("static/audio")

if __name__ == "__main__":
    app.run(port=5001, debug=True)