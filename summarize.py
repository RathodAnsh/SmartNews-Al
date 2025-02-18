from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
from transformers import pipeline
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

logging.basicConfig(level=logging.INFO)

def get_article_content(url):
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        full_text = " ".join([p.get_text() for p in paragraphs])
        return full_text if full_text else "Article content not found."
    except Exception as e:
        return f"Error fetching article: {str(e)}"

# API Endpoint to fetch article
@app.route("/fetch-article", methods=["GET"])
def fetch_article():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    article_text = get_article_content(url)
    return jsonify({"article": article_text})

# API Endpoint to summarize text
@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    text = data.get("text", "")

    if not text:
        logging.error("No text provided")
        return jsonify({"error": "No text provided"}), 400

    try:
        # Ensure the input is not too long
        max_input_length = 1024
        text = text[:max_input_length]

        # Adjust summarization parameters based on text length
        length_ratio = len(text) / max_input_length
        max_length = int(200 * length_ratio)  # Scale max_length based on text length
        min_length = int(100 * length_ratio)  # Scale min_length based on text length

        # Generate summary
        summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False, num_beams=4, early_stopping=True)
        logging.info("Summary generated successfully")
        return jsonify({"summary": summary[0]["summary_text"]})
    except Exception as e:
        logging.error(f"Error generating summary: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)