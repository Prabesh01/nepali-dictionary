import "./Meanings.scss";
import { meaningsT } from "../../helpers/typeDefinitions";
import Separator from "../utilities/Separator";
import React, { useRef, useEffect } from "react";
import MeaningsNyms from "./MeaningsNyms";
import MeaningsExample from "./MeaningsExample";
import { useNavigate } from "react-router-dom";
import { formatForUrl } from "../../helpers/functions";

const Meanings: React.FC<meaningsT> = function ({ meanings }) {
  const { partOfSpeech, etymology, definitions } = meanings;
  const definitionsRef = useRef<HTMLDivElement>(null);
  const etymologyRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && (target.classList.contains('crosslink') || target.classList.contains('abbr-link'))) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          navigate(href);
        }
      }
    };

    const div = definitionsRef.current;
    const span = etymologyRef.current;

    if (div) {
      div.addEventListener('click', handleClick);
    }
    if (span) {
      span.addEventListener('click', handleClick);
    }

    return () => {
      if (div) div.removeEventListener('click', handleClick);
      if (span) span.removeEventListener('click', handleClick);
    };
  }, [navigate, etymology]);

  const linkAbbreviations = (text: string) => {
    return text.replace(/[ऀ-ॿ\w]+\./g, (match) => {
      const urlWord = encodeURIComponent(match.trim().replaceAll(" ", "_"));
      return `<a href="/word/${urlWord}" class="abbr-link">${match}</a>`;
    });
  };

  const linkAbbreviationsInDefinitions = (text: string) => {
    return text.replace(/\(([ऀ-ॿ\w]+\.)\)/g, (match, abbr) => {
      const urlWord = encodeURIComponent(abbr.trim().replaceAll(" ", "_"));
      return `(<a href="/word/${urlWord}" class="abbr-link">${abbr}</a>)`;
    });
  };

  const processedEtymology = etymology ? linkAbbreviations(etymology) : null;
  const processedPartOfSpeech = linkAbbreviations(partOfSpeech);

  const definitionJSX = definitions.map((v, i) => (
    <li key={i}>
      <span dangerouslySetInnerHTML={{ __html: linkAbbreviationsInDefinitions(v.definition) }} />
      {v.examples && v.examples.length > 0 && <MeaningsExample example={v.examples[0]} />}
    </li>
  ));

  return (
    <div className="meanings">
      <div className="type-separator-container">
        <h3>
          <span dangerouslySetInnerHTML={{ __html: processedPartOfSpeech }} />
          {processedEtymology && <span className="etymology" ref={etymologyRef} dangerouslySetInnerHTML={{ __html: processedEtymology }} />}
        </h3>
        <Separator isHorizontal={true} size={"100%"} margin={"4.4rem 0"} />
      </div>

      <div className="defintions" ref={definitionsRef}>
        <ul>{definitionJSX}</ul>
      </div>
    </div>
  );
};

export default Meanings;
