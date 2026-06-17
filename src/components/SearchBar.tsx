import "./SearchBar.scss";
import searchIcon from "../assets/images/icon-search.svg";
import React, { useEffect, useRef, useState } from "react";
import {
  getSlice,
  specialCharsCheck,
} from "../helpers/functions";
import useGoTo from "../hooks/useGoTo";
import Invalid from "./search-bar/Invalid";
import RecentSearches from "./search-bar/RecentSearches";
import { useLocation } from "react-router-dom";

const RECENT_SEARCHES_KEY = "recentSearches";

const SearchBar = function () {
  const searchRef = useRef<HTMLInputElement>(null);
  const { currentFont } = getSlice();
  const goto = useGoTo();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentWord = pathParts[0] === 'word' && pathParts[1]
    ? decodeURIComponent(pathParts[1]).replaceAll("_", " ")
    : "";
  const [invalid, setInvalid] = useState<boolean | string>(false);
  const [inputValue, setInputValue] = useState<string>(currentWord);
  const [dictionaryMap, setDictionaryMap] = useState<Record<string, string[]>>({});
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (currentWord) {
      setRecentSearches(prev => {
        const updated = [currentWord, ...prev.filter(w => w !== currentWord)].slice(0, 8);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentWord]);

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  useEffect(() => {
    fetch('/dictionary-map.json')
      .then(res => res.json())
      .then((dict: Record<string, string[]>) => {
        setDictionaryMap(dict);
        setAllKeys(Object.keys(dict));
      });
  }, []);

  if (searchRef.current) searchRef.current.focus();

  const invalidMsg = "Invalid charater...";

  const findStartIndex = (query: string): number => {
    let low = 0;
    let high = allKeys.length - 1;
    let result = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (allKeys[mid] >= query) {
        result = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return result;
  };

  const searchBinaryAutocomplete = (userInput: string): string[] => {
    const query = userInput.trim().toLowerCase();
    if (!query) return [];

    const matchedNepaliWords = new Set<string>();
    const MAX_DISPLAY = 40;

    const startIndex = findStartIndex(query);

    for (let i = startIndex; i < allKeys.length; i++) {
      const key = allKeys[i];

      if (key.startsWith(query)) {
        dictionaryMap[key].forEach(word => matchedNepaliWords.add(word));
        if (matchedNepaliWords.size >= MAX_DISPLAY) break;
      } else {
        break;
      }
    }
    return Array.from(matchedNepaliWords);
  };

  const handleSubmit = function (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!searchRef.current) return;

    const { value } = searchRef.current;

    if (!value) return setInvalid("Whoops, can't be empty...");

    if (matches.length === 1) {
      goto(matches[0]);
    } else if (matches.length > 1) {
      return;
    } else {
      goto(value);
    }
    setInvalid(false);
    setShowDropdown(false);
  };

  const handleChange = function () {
    if (!searchRef.current) return;

    const { value } = searchRef.current;

    if (specialCharsCheck(value)) return setInvalid(invalidMsg);

    setInputValue(value);
    setInvalid(false);

    if (!value.trim()) {
      setMatches([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      const results = searchBinaryAutocomplete(value);

      setMatches(results);

      if (results.length === 1) {
        setInputValue(results[0]);
        goto(results[0]);
        setShowDropdown(false);
      } else if (results.length > 1) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  };

  const handleSelectWord = (word: string) => {
    goto(word);
    setShowDropdown(false);
    setInputValue(word);
  };

  useEffect(() => {
    setInputValue(currentWord);
    setShowDropdown(false);
    setMatches([]);
  }, [currentWord]);

  return (
    <div className={`search-container`}>
      <form onSubmit={handleSubmit}>
        <input
          style={{ fontFamily: currentFont.cssValue }}
          ref={searchRef}
          onChange={handleChange}
          type="text"
          className={`search-bar ${invalid ? "invalid" : ""}`}
          placeholder="यहाँ टाइप गर्नुहोस् …"
          maxLength={50}
          value={inputValue}
        />
        <button>
          <img src={searchIcon} alt="Search Icon" />
        </button>
      </form>
      <Invalid invalid={invalid} />
      <RecentSearches recentSearches={recentSearches} onClear={handleClearRecent} />
      {showDropdown && matches.length > 0 && (
        <div className="autocomplete-dropdown">
          {matches.map((word, idx) => (
            <div
              key={idx}
              className="autocomplete-item"
              onClick={() => handleSelectWord(word)}
              style={{ fontFamily: currentFont.cssValue }}
            >
              {word}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
