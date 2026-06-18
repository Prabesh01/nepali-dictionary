import csv
import json
import os
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from tqdm import tqdm
# import difflib
from rapidfuzz import process as rf_process, fuzz as rf_fuzz
import re
from collections import defaultdict
from bs4 import BeautifulSoup

from nepali_unicode_converter import ReverseConverter, ReverseConverterV2

basepath =  os.path.dirname(os.path.abspath(__file__))

abbr_index = json.load(open(f'{os.path.dirname(basepath)}/public/abbr.json'))

def build_length_index(words_list):
    """Bucket words by length so similarity search never touches the full list."""
    idx = defaultdict(list)
    for w in words_list:
        idx[len(w)].append(w)
    return idx

# Worker initialization function to instantiate converters per-process safely
def init_worker(shared_words_list, shared_len_index, shared_abbr_index):
    global rev, rev2, smart_rev, smart_rev2, rev3, words_list, len_idx, abbr_index
    words_list = shared_words_list
    abbr_index = shared_abbr_index
    rev = ReverseConverter()
    rev2 = ReverseConverterV2()
    smart_rev = ReverseConverter(smart=True)
    smart_rev2 = ReverseConverterV2(smart=True)
    rev3 = ReverseConverterV2(smart=True,custom_mappings={'ba': 'व'})
    len_idx = shared_len_index

def get_variants(nepali_word):
    val_v1 = rev.convert(nepali_word).lower()
    val_v2 = rev2.convert(nepali_word).lower()
    val_v3 = smart_rev.convert(nepali_word).lower()
    val_v4 = smart_rev2.convert(nepali_word).lower()
    val_v5 = rev3.convert(nepali_word).lower()

    all_keys = [val_v1, val_v2, val_v3, val_v4, val_v5]
    unique_keys = set(str(k).strip().lower() for k in all_keys if k)

    return list(unique_keys)

def get_similar_words(target_word):
    radius = 2
    candidates = []
    target_len = len(target_word)

    while len(candidates) < 50 and radius <= 11:
        candidates = []
        for l in range(max(1, target_len - radius), target_len + radius + 1):
            candidates.extend(len_idx.get(l, []))
        radius += 2

    if not candidates:
        return []

    results = rf_process.extract(
            target_word, candidates, scorer=rf_fuzz.ratio, limit=10, score_cutoff=30
        )
    matches = [r[0] for r in results]

    # matches = difflib.get_close_matches(target_word, words_list, n=6, cutoff=0.3)
    return [m for m in matches if m != target_word]

def linkify_text(text):
    def match_word(match):
        word = match.group(0)

        if word in words_list:
            return f'<a href="/word/{word}" class="crosslink">{word}</a>'
        return word

    word_pattern = r'[^\s।,;?!()\[\]{}"\'<>\+]+'
    
    return re.sub(word_pattern, match_word, text)

def process_word(wmeaning):
    word,meaning=wmeaning

    meaning = re.sub(r'<span[^>]*>.*?</span>', '', meaning, count=1)
    meaning_cleaned = re.sub(r'^(<br/>)+', '', meaning, flags=re.DOTALL).strip()
    
    plain_meaning = BeautifulSoup(meaning_cleaned, 'html.parser').get_text()

    meanings=[]
    raw_pos = ""
    sub_blocks = re.split(r'<p▤>.*?</p>', meaning_cleaned, flags=re.DOTALL)

    found_abbrs = set()
    for block in sub_blocks:
        block = block.strip()
        if not block:
            continue

        etym_match = re.search(r'<a◰>(.*?)</a>', block, flags=re.DOTALL)
        etymology = etym_match.group(1).strip() if etym_match else None
        block = re.sub(r'<a◰>(.*?)</a>', '', block, flags=re.DOTALL)

        pos_match = re.search(r'<a◳>(.*?)</a>', block, flags=re.DOTALL)
        if pos_match:
            raw_pos = pos_match.group(1).strip()
            block = re.sub(r'<a◳>(.*?)</a>', '', block, flags=re.DOTALL)

        raw_definitions = re.findall(r'<p▦>(.*?)</p>', block, flags=re.DOTALL)

        clean_definitions = []

        for d in raw_definitions:
            examples = []
            
            example_match = re.search(r'<span▧>(.*?)</span>', d, flags=re.DOTALL)

            if example_match:
                raw_example_text = example_match.group(1).strip()
                
                clean_example = re.sub(r'^\(उदा\.\s*', '', raw_example_text).rstrip(')')
                
                examples = [ex.strip() for ex in re.split(r'(?<=[।?!])\s+', clean_example) if ex.strip()]

                d = re.sub(r'<br\s*/?>\s*<span▧>.*?</span>', '', d, flags=re.DOTALL)
                d = re.sub(r'<span▧>.*?</span>', '', d, flags=re.DOTALL)

            clean_def = re.sub(r'^\s*\d+\.\s+', '', d).strip()
            if clean_def.startswith("हे."): clean_def=clean_def[3:].strip()

            inline_abbrs=re.findall(r'\(([^()]*?\.)\)', clean_def)
            for inline_abbr in inline_abbrs: found_abbrs.add(inline_abbr)

            linked_def = linkify_text(clean_def)
            linked_examples = [linkify_text(ex) for ex in examples]

            clean_definition = { "definition": linked_def }
            if linked_examples: clean_definition["examples"] = linked_examples
            clean_definitions.append(clean_definition)

        if clean_definitions:
            if raw_pos:found_abbrs.add(raw_pos)
            entry = {
                "partOfSpeech": raw_pos,
                "definitions": clean_definitions
            }
            if etymology:
                abbrs=re.findall(r'[\u0900-\u097F\w]+\.', etymology)
                for a in abbrs: found_abbrs.add(a)
                entry["etymology"] = linkify_text(etymology)

            meanings.append(entry)

    similar_array = get_similar_words(word)
    suggestions_string = ", ".join(similar_array)
 
    variants = ", ".join(get_variants(word))
    
    variants_esc = variants.replace("'", "''")
    plain_esc = plain_meaning.replace('\n', ' ').replace("'", "''")
    sug_esc = suggestions_string.replace("'", "''")
    word_esc = word.replace("'", "''")
    html_esc = json.dumps(meanings, ensure_ascii=False).replace("'", "''")

    abbr_column_val = ""
    if found_abbrs:
        abbr_column_val = "," + ",".join(sorted(list(found_abbrs))) + ","

    ok= f"""
    INSERT INTO dictionary (word, variants, plain_meaning, html_meaning, suggestions, abbr)
    VALUES ('{word_esc}', '{variants_esc}', '{plain_esc}', '{html_esc}', '{sug_esc}', '{abbr_column_val}');
    """
    if word in abbr_index:
        ok+=f"""
        \n\n
        INSERT INTO dictionary (word, variants, plain_meaning, html_meaning, suggestions, abbr)
        VALUES ('{abbr_index[word]}.', '{variants_esc}', '{plain_esc}', '{html_esc}', '[]', '{word}');
        """
    return ok
    with open("schema.sql", "a", encoding="utf-8") as f:
        f.write(ok)


words_list=set()
if __name__ == '__main__':
    words_meanings = []

    # Read words into memory quickly
    print("Reading CSV file...")
    with open(f'{basepath}/sabdakosh.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None) # Skip header
        for row in reader:
            if row and row[1].strip() and row[-1].strip():
                words_meanings.append([row[1].strip(),row[-1].strip()])
                words_list.add(row[1].strip())

    total_words = len(words_meanings)
    print("Building length index for fast similarity lookup...")
    length_index = build_length_index(words_list)

    # Process words in parallel using available CPU cores
    num_workers = os.cpu_count()
    print(f"Starting db generation engine using {num_workers} CPU cores...")

    with open(f"{basepath}/schema.sql", "w", encoding="utf-8") as f:
        f.write("""
        PRAGMA synchronous = OFF;
        PRAGMA journal_mode = MEMORY;
        BEGIN TRANSACTION;

        DROP TABLE IF EXISTS dictionary;
        CREATE TABLE dictionary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL UNIQUE,
            variants TEXT,
            plain_meaning TEXT,
            html_meaning TEXT,
            suggestions TEXT,
            abbr TEXT
        );
        CREATE INDEX idx_dictionary_word ON dictionary (word);
        """)
        # f.write("\n".join(insert_queries))


    with ProcessPoolExecutor(max_workers=num_workers, initializer=init_worker, initargs=(words_list,length_index,abbr_index)) as executor:
        # map handles task distribution and maintains progress tracking context
        results = list(tqdm(
            executor.map(process_word, words_meanings, chunksize=1000),
            total=total_words,
            desc="Processing dictionary"
        ))

    init_worker(words_list,length_index,abbr_index)
    orphan_words = [w for w in abbr_index if w not in words_list]
    if orphan_words:
        print(f"--> Processng {len(orphan_words)} orphans abbrs: {orphan_words}")
        for word in orphan_words:
            abbr = abbr_index[word]

            variants_str = ", ".join(get_variants(word))
            plain_meaning = "+".join(word.split())
            definition = linkify_text(plain_meaning)

            meanings = [{
                "partOfSpeech": "",
                "definitions": [{"definition":definition}]
            }]
            html_meaning = json.dumps(meanings, ensure_ascii=False)

            ok= f"""
            INSERT INTO dictionary (word, variants, plain_meaning, html_meaning, suggestions, abbr)
            VALUES ('{abbr}.', '{variants_str}', '{plain_meaning}', '{html_meaning}', '', '{word}');
            """
            results.append(ok)

    with open(f"{basepath}/schema.sql", "a", encoding="utf-8") as f:
        f.write("\n".join(results))
        f.write("\nCOMMIT;\n")
