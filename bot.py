from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import requests
from newspaper import Article
from bs4 import BeautifulSoup
from gtts import gTTS
import threading
from io import BytesIO

# ✅ Load environment variables
load_dotenv()

# ✅ Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ Error: GEMINI_API_KEY is missing! Set it in the .env file.")

genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__, template_folder='templates')

# ✅ Enable CORS with specific origin and credentials
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5500"}}, supports_credentials=True)

# ✅ Function to extract news content from URL
def extract_news_content(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        if article.text.strip():
            return article.text
    except Exception as e:
        print(f"Newspaper3k failed: {e}, trying BeautifulSoup...")

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        content = "\n".join([p.get_text() for p in paragraphs])
        if content.strip():
            return content
    except Exception as e:
        print(f"BeautifulSoup failed: {e}")

    return None

# ✅ Function to process user query with Gemini AI
def chat_with_gemini(user_query, news_content):
    model = genai.GenerativeModel("gemini-1.5-pro")

    prompt = f"""
    You are a highly intelligent chatbot.
    
    Here is a news article:
    {news_content}
    
    A user has asked: "{user_query}".
    
    Respond accurately based on the news. If the content is unclear, search Google for a better understanding and then answer.
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print("🚨 Gemini API Error:", e)
        return "I'm unable to process your request right now. Please try again later."

# ✅ Function to detect language for TTS
def detect_language(text):
    if any(char in text for char in "अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह"):
        return "hi"  # Hindi
    if any(char in text for char in "अआइईउऊऋएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहळ"):
        return "mr"  # Marathi
    return "en"  # Default to English

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.get_json()
        text = data.get('text', '')
        if not text.strip():
            return jsonify({"status": "error", "message": "Text is empty"}), 400

        # Detect language
        lang = detect_language(text)
        print(f"Detected language: {lang}, Text: {text}")

        # Adjust text for better readability by adding pauses at punctuation
        adjusted_text = text.replace('.', '. ').replace(',', ', ').replace('!', '! ').replace('?', '? ')

        # Generate speech using gTTS with medium speed (not slow)
        tts = gTTS(text=adjusted_text, lang=lang, slow=False)
        audio_stream = BytesIO()
        tts.write_to_fp(audio_stream)
        audio_stream.seek(0)

        # Stream the audio response
        return send_file(audio_stream, mimetype="audio/mpeg")
    except Exception as e:
        print(f"Error in /speak endpoint: {e}")
        return jsonify({"status": "error", "message": "Failed to generate speech"}), 500

@app.route('/stop_speech', methods=['POST'])
def stop_speech():
    # No-op for gTTS as it does not support stopping mid-playback
    return jsonify({"status": "success"}), 200

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chatbot/query', methods=['POST', 'OPTIONS'])
def handle_query():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "success"})
        response.headers.add("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        query = data.get('query')
        news_url = data.get('news_url')

        # Validate query and news_url
        if not query:
            return jsonify({"error": "Query parameter is required"}), 400
        if not news_url or not news_url.strip():
            return jsonify({"error": "News URL is required and cannot be empty"}), 400

        # Extract news content
        news_content = extract_news_content(news_url)
        if not news_content:
            return jsonify({"error": "Failed to extract news content"}), 400

        # Get AI response
        bot_response = chat_with_gemini(query, news_content)

        print("Bot response:", bot_response)  # Debugging

        return jsonify({"response": bot_response, "status": "success"})

    except Exception as e:
        print("Internal server error", str(e))
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
