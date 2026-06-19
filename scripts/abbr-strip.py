import sqlite3
import json
import os

basepath =  os.path.dirname(os.path.abspath(__file__))

DB_PATH = f'{basepath}/dictionary.db' 
JSON_IN_PATH = f'{os.path.dirname(basepath)}/public/abbr-all.json'
JSON_OUT_PATH = f'{os.path.dirname(basepath)}/public/abbr.json'

def get_unique_db_abbrs(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT abbr FROM dictionary WHERE abbr IS NOT NULL AND abbr != ''")
    
    unique_abbrs = set()
    for row in cursor.fetchall():
        abbr_string = row[0]
        
        parts = [p.strip() for p in abbr_string.split(',')]
        
        for part in parts:
            if part: 
                unique_abbrs.add(part)
                
    conn.close()
    return unique_abbrs

def clean_abbr_json():
    print("Extracting unique abbreviations from database...")
    db_abbrs = get_unique_db_abbrs(DB_PATH)
    db_abbrs.remove("उदा.")
    db_abbrs.remove("हे.")
    print(f"Found {len(db_abbrs)} unique abbreviations in the DB.")

    if not os.path.exists(JSON_IN_PATH):
        print(f"Error: Could not find {JSON_IN_PATH}")
        return

    with open(JSON_IN_PATH, 'r', encoding='utf-8') as f:
        abbr_data = json.load(f)

    filtered_data = {}
    removed = 0

    print("\nFiltering JSON...")
    for key, value in abbr_data.items():
        search_target = f"{value.strip()}."

        # Check if it exists in our DB set
        if search_target in db_abbrs:
            filtered_data[key] = value
        else:
            removed += 1
            print(f"  [-] Removed: '{key}': '{value}' (Target '{search_target}' not in DB)")

    # Write the cleaned data to the new file
    with open(JSON_OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(filtered_data, f, ensure_ascii=False, indent=4)

    print(f"\nDone! Kept {len(filtered_data)} items. Removed {removed} items.")
    print(f"Saved cleanly to {JSON_OUT_PATH}")

if __name__ == "__main__":
    clean_abbr_json()
