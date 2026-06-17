# Nepali Dictionary Web App

[Live Website](https://npdictionary.prax.to/)

### Reqirements
- sqlite3
- npm
- `pip install git+https://github.com/Prabesh01/nepali-unicode-converter tqdm flask rapidfuzz beautifulsoup4`

### Generate Required Files

#### Generate variants json for quick search in SPA frontend
- `python scripts/words-list-generator.py`
- Input: scripts/sabdakosh.csv. Output: public/dictionary-map.json

### Generate db schema for Server-side API calls and SEO metadata rendering
- `python scripts/dictionary-db-generator.py` (takes 10-20 mins)
- Input: scripts/sabdakosh.csv. Output: scripts/schema.sql

### Usage

#### Running it locally
- Crete sqlite database from schema: `sqlite3 scripts/dictionary.db < scripts/schema.sql`
- `npm install`
- `npm run build`
- Run flask server: `python scripts/api-server.py`
- Visit http://127.0.0.1:5000/
