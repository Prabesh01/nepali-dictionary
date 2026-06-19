import "./MeaningsExample.scss";
import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { linkAbbreviations } from "../../helpers/abbrRegex";

type propsT = { example: string | void };

const MeaningsExample = function ({ example }: propsT) {
  const exampleRef = useRef<HTMLParagraphElement>(null);
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

    const p = exampleRef.current;
    if (p) {
      p.addEventListener('click', handleClick);
      return () => p.removeEventListener('click', handleClick);
    }
  }, [navigate]);

  if (!example) return null;

  const processedExample = linkAbbreviations(example);

  return <p ref={exampleRef} className="example" dangerouslySetInnerHTML={{ __html: processedExample }} />;
};

export default MeaningsExample;
