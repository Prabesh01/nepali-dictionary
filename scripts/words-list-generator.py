import csv
import json
import os
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from tqdm import tqdm

from nepali_unicode_converter import ReverseConverter, ReverseConverterV2

# Worker initialization function to instantiate converters per-process safely
def init_worker():
    global rev, rev2, smart_rev, smart_rev2, rev3
    rev = ReverseConverter()
    rev2 = ReverseConverterV2()
    smart_rev = ReverseConverter(smart=True)
    smart_rev2 = ReverseConverterV2(smart=True)
    rev3 = ReverseConverterV2(smart=True,custom_mappings={'ba': 'व'})

# Main processing unit for a single word
def process_word(nepali_word):
    # 1. Generate all 4 variants
    val_v1 = rev.convert(nepali_word)
    val_v2 = rev2.convert(nepali_word)
    val_v3 = smart_rev.convert(nepali_word)
    val_v4 = smart_rev2.convert(nepali_word) # v2-smart
    val_v5 = rev3.convert(nepali_word)

    all_keys = [nepali_word, val_v1, val_v2, val_v3, val_v4, val_v5]
    unique_keys = set(str(k).strip().lower() for k in all_keys if k)

    return list(unique_keys), nepali_word

if __name__ == '__main__':
    words_list = []

    # Read words into memory quickly
    print("Reading CSV file...")
    with open('sabdakosh.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None) # Skip header
        for row in reader:
            if row and row[1].strip():
                if len(row[1].strip().split())==1:
                    words_list.append(row[1].strip())

    total_words = len(words_list)
    optimized_dictionary = {}

    # Process words in parallel using available CPU cores
    num_workers = os.cpu_count()
    print(f"Starting compression engine using {num_workers} CPU cores...")

    with ProcessPoolExecutor(max_workers=num_workers, initializer=init_worker) as executor:
        # map handles task distribution and maintains progress tracking context
        results = list(tqdm(
            executor.map(process_word, words_list),
            total=total_words,
            desc="Processing dictionary"
        ))
        # optimized_dictionary.extend(results)

        for unique_keys, nepali_word in results:
            for key in unique_keys:
                if key not in optimized_dictionary:
                    optimized_dictionary[key] = []
            
                # Avoid adding the same Nepali word twice under the exact same key
                if nepali_word not in optimized_dictionary[key]:
                    optimized_dictionary[key].append(nepali_word)

    # Export
    print("Saving compressed JSON dataset...")
    with open('words.json', 'w', encoding='utf-8') as outfile:
        json.dump(optimized_dictionary, outfile, ensure_ascii=False, indent=2, sort_keys=True)
    print(f"\n✨ Successfully compressed {len(optimized_dictionary)} words!")
