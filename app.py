from flask import Flask, request, jsonify, send_from_directory
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os

app = Flask(__name__)

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
    except:
        return False

def crawl_url(base_url, max_depth=3):
    visited = set()
    results = []
    
    def crawler(url, depth=0):
        if depth >= max_depth or url in visited or len(visited) >= 100:
            return
        
        if not is_valid_url(url):
            return

        visited.add(url)
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            results.append({
                'url': url,
                'level': depth
            })
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for link in soup.find_all('a'):
                href = link.get('href')
                if href:
                    absolute_url = urljoin(url, href)
                    if urlparse(absolute_url).netloc == urlparse(base_url).netloc:
                        crawler(absolute_url, depth + 1)
                        
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
    
    crawler(base_url)
    return results

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/crawl', methods=['POST'])
def crawl():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    if not is_valid_url(url):
        return jsonify({'error': 'Invalid URL'}), 400
    
    try:
        results = crawl_url(url)
        return jsonify({'urls': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
