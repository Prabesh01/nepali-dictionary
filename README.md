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

### Generate sitemap and robots.txt
- `python scripts/sitemap-generator.py`
- Input: scripts/sabdakosh.csv. Output: public/sitemap-*.xml & public/robots.txt

### Running it locally
- Crete sqlite database from schema: `sqlite3 scripts/dictionary.db < scripts/schema.sql`
- `npm install`
- `npm run build`
- Run flask server: `python scripts/api-server.py`
- Visit http://127.0.0.1:5000/

### Deploy to Cloudflare worker
_One Time:_
- npm install -D wrangler
- npx wrangler login
- npx wrangler d1 create dictionary-db (Put the database id in wrangler.toml)

_For every schema chagnges:_
- Get rid of few stuffs that cloudflare wouldn't like:
  - sed -i 's/INSERT INTO/INSERT OR IGNORE INTO/g' scripts/schema.sql
  - grep -v -i "^PRAGMA\|^BEGIN\|^COMMIT" scripts/schema.sql > scripts/schema-d1.sql
- npx wrangler d1 execute dictionary-db --remote --file=./scripts/schema-d1.sql

_For every frontend changes:_
- npm install
- npm run build

_For every cf/worker.js or wrangler.toml changes:_
- Test: npx wrangler dev
- Deploy: npx wrangler deploy
- View Logs: npx wrangler tail npdictionary
