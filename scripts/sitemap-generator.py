import csv, os
from urllib.parse import quote
from datetime import date

basepath =  os.path.dirname(os.path.abspath(__file__))

CSV_PATH = f"{basepath}/sabdakosh.csv"
OUTPUT_DIR = f"{os.path.dirname(basepath)}/public"
BASE_URL = "https://npdictionary.prax.to"
MAX_URLS_PER_FILE = 40000

def slugify(word):
    return quote(word, safe='')

def main():
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        words = [row["word"] for row in reader]

    today = date.today().isoformat()
    chunks = [words[i:i + MAX_URLS_PER_FILE] for i in range(0, len(words), MAX_URLS_PER_FILE)]
    sitemap_files = []

    for idx, chunk in enumerate(chunks):
        filename = "sitemap.xml" if len(chunks) == 1 else f"sitemap-{idx + 1}.xml"
        sitemap_files.append(filename)
        with open(os.path.join(OUTPUT_DIR, filename), "w", encoding="utf-8") as out:
            out.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
            if idx == 0:
                out.write(f'  <url><loc>{BASE_URL}/</loc><changefreq>weekly</changefreq></url>\n')
            for word in chunk:
                out.write(f'  <url><loc>{BASE_URL}/word/{slugify(word)}</loc><lastmod>{today}</lastmod></url>\n')
            out.write('</urlset>\n')

    if len(sitemap_files) > 1:
        with open(os.path.join(OUTPUT_DIR, "sitemap-index.xml"), "w", encoding="utf-8") as out:
            out.write('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
            for fn in sitemap_files:
                out.write(f'  <sitemap><loc>{BASE_URL}/{fn}</loc></sitemap>\n')
            out.write('</sitemapindex>\n')
        robots_target = "sitemap-index.xml"
    else:
        robots_target = sitemap_files[0]

    with open(os.path.join(OUTPUT_DIR, "robots.txt"), "w", encoding="utf-8") as out:
        out.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}/{robots_target}\n")

    print(f"Generated {len(sitemap_files)} sitemap file(s) for {len(words)} words.")

if __name__ == "__main__":
    main()
