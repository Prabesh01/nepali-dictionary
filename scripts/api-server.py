from flask import Flask, jsonify, send_from_directory
import sqlite3
import json
import os
import re

basepath =  os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=f'{os.path.dirname(basepath)}/dist', static_url_path='')

DB_PATH = f'{basepath}/dictionary.db'
app_name="Dictionary"

def get_word_from_db(word,api=True):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if not api:
        cursor.execute('SELECT variants, plain_meaning FROM dictionary WHERE word = ?', (word,))
    else:
        cursor.execute('SELECT html_meaning, suggestions, abbr FROM dictionary WHERE word = ?', (word,))

    result = cursor.fetchone()
    conn.close()
    return result

def strip_html_tags(html):
    """Remove HTML tags from text"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', html)

def generate_word_html(word,result):
    """Generate HTML with SEO meta tags for a word"""
    variants, plain_meaning = result
    variant_list = [v.strip() for v in variants.split(',')]

    description = plain_meaning[:160]  # Limit to 160 chars
    if len(plain_meaning) > 160:
        description = description.rsplit(' ', 1)[0] + '…'

    # Read base HTML
    html_path = os.path.join(app.static_folder, 'index.html')
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Inject meta tags
    title = f"{word} - {app_name}"
    json_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": word,
        "alternateName": variant_list,
        "description": plain_meaning,
    }) # .replace('</', '<\\/')  

    meta_tags = f'''<title>{word} ({variants}) - {app_name}</title>
    <meta name="description" content="{description}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <script type="application/ld+json">{json_ld}</script>'''

    content_for_crawler = (
        f"<h1>{word}</h1>"
        f"<p>Also known as: {' / '.join(variant_list)}</p>"
        f"<div>{plain_meaning}</div>"
    )

    # Replace title tag and inject after
    html = re.sub(r'<title>.*?</title>', lambda m: meta_tags, html)

    html = re.sub(
        r'<main id="root"></main>', 
        f'<main id="root">{content_for_crawler}</main>', 
        html
    )

    return html

@app.route('/api/word/<word>')
def get_word(word):
    word = word.replace('_', ' ')
    result = get_word_from_db(word,api=True)

    if not result:
        return jsonify({"title": "भेटिएन ", "message": f"'{word}' फेला पार्न सकिएन - यसलाई भन्छ ४०४ हुनु।", "resolution": "अरु नै केही हानेर हेरौँ, चल्छ होला । "}), 404

    html_meaning, suggestions, abbr = result
    meanings = json.loads(html_meaning) if html_meaning else []
    similar = suggestions.split(', ') if suggestions else []

    if word.endswith('.'):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        search_pattern = f"%,{word},%"
        abbr_words_query = cursor.execute('SELECT word FROM dictionary WHERE abbr LIKE ? ORDER BY RANDOM() LIMIT 50', (search_pattern,))
        abbr_words = abbr_words_query.fetchall()
        similar = [row[0] for row in abbr_words]

        word = f"{abbr} ({word})"

    return jsonify([{
        "word": word,
        "meanings": meanings,
        "similar": similar
    }])

@app.route('/word/<path:word>')
def serve_word_ssr(word):
    """SSR route for /word/<word> with SEO meta tags"""
    # Decode and clean word
    word = word.replace('_', ' ')
    result = get_word_from_db(word,api=False)

    if not result:
        # Word not found, serve regular SPA
        return send_from_directory(app.static_folder, 'index.html')

    return generate_word_html(word,result)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't catch /word/ routes here
    if path.startswith('word/'):
        return serve_word_ssr(path[5:])

    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
