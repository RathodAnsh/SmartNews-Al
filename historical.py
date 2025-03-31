from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
# Configure CORS to allow all origins for development
CORS(app, resources={r"/*": {"origins": "*"}})

# Load pretrained model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load dataset and embeddings
try:
    ds = pd.read_csv("processed_news (1).csv")
    news_embeddings = np.load("news_embeddings (1).npy", allow_pickle=True).astype('float32')
    
    # Normalize embeddings and build FAISS index
    faiss.normalize_L2(news_embeddings)
    faiss_index = faiss.IndexFlatIP(news_embeddings.shape[1])
    faiss_index.add(news_embeddings)
    print(f"✅ FAISS index created with {faiss_index.ntotal} entries.")
    
except Exception as e:
    print(f"❌ Error loading data: {str(e)}")
    ds = pd.DataFrame()
    news_embeddings = None
    faiss_index = None

def hybrid_search(query, top_k=5):
    """Perform hybrid search combining keyword and semantic search"""
    if not isinstance(ds, pd.DataFrame) or ds.empty:
        return pd.DataFrame()
    
    # Convert query to lowercase for case-insensitive search
    query_lower = query.lower()
    
    # 1. First try keyword search in combined_text
    keyword_results = ds[ds['combined_text'].str.lower().str.contains(query_lower, na=False)]
    
    if not keyword_results.empty:
        # If keyword results found, use semantic search to re-rank them
        keyword_indices = keyword_results.index.values
        keyword_embeddings = news_embeddings[keyword_indices]
        
        # Create temporary FAISS index for keyword results
        temp_index = faiss.IndexFlatIP(keyword_embeddings.shape[1])
        temp_index.add(keyword_embeddings)
        
        # Semantic search on filtered results
        query_embedding = model.encode([query], convert_to_numpy=True).astype('float32')
        faiss.normalize_L2(query_embedding)
        distances, indices = temp_index.search(query_embedding, min(top_k, len(keyword_indices)))
        
        # Get the actual indices from original dataset
        valid_indices = keyword_indices[np.clip(indices[0], 0, len(keyword_indices)-1)]
        results = ds.iloc[valid_indices]
    else:
        # Fallback to pure semantic search if no keyword matches
        query_embedding = model.encode([query], convert_to_numpy=True).astype('float32')
        faiss.normalize_L2(query_embedding)
        distances, indices = faiss_index.search(query_embedding, top_k)
        valid_indices = np.clip(indices[0], 0, len(ds)-1)
        results = ds.iloc[valid_indices]
    
    return results

@app.route('/search', methods=['GET'])  # Keep this as /search (not /api/search)
def search_news():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    try:
        # Get search results
        results = hybrid_search(query, top_k=12)  # Return up to 12 results
        
        if results.empty:
            return jsonify({"results": []})
        
        # Format the results with all required fields
        output = results[[
            'title', 'text', 'publishedDate', 'url', 
            'source_name', 'combined_text_sentiment'
        ]].copy()
        
        # Clean and format data
        output['text'] = output['text'].fillna('No description available').astype(str).str.replace(r'\[\+\d+ chars\]', '', regex=True).str[:300]
        output['title'] = output['title'].fillna('No title available').astype(str).str[:100]
        output['source_name'] = output['source_name'].fillna('Unknown').astype(str)
        output['combined_text_sentiment'] = output['combined_text_sentiment'].fillna('Neutral').astype(str)
        output['publishedDate'] = output['publishedDate'].fillna('Unknown date').astype(str)
        
        # Convert to list of dictionaries
        results_list = output.to_dict(orient='records')
        
        return jsonify({
            "results": results_list,
            "status": "success"
        })
        
    except Exception as e:
        app.logger.error(f"Search error for query '{query}': {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "status": "error"
        }), 500

@app.route('/')
def home():
    return "Smart News Historical Search API is running!"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)