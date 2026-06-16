import "./Meanings.scss";
import { meaningsT } from "../../helpers/typeDefinitions";
import Separator from "../utilities/Separator";
import React from "react";
import MeaningsNyms from "./MeaningsNyms";
import MeaningsExample from "./MeaningsExample";

const Meanings: React.FC<meaningsT> = function ({ meanings }) {
  const { partOfSpeech, etymology, definitions } = meanings;

  const definitionJSX = definitions.map((v, i) => (
    <li key={i}>
      <span dangerouslySetInnerHTML={{ __html: v.definition }} />
      {v.examples && v.examples.length > 0 && <MeaningsExample example={v.examples[0]} />}
    </li>
  ));

  return (
    <div className="meanings">
      <div className="type-separator-container">
        <h3>
          {partOfSpeech}
          {etymology && <span className="etymology"> {etymology}</span>}
        </h3>
        <Separator isHorizontal={true} size={"100%"} margin={"4.4rem 0"} />
      </div>

      <div className="defintions">
        <ul>{definitionJSX}</ul>
      </div>
    </div>
  );
};

export default Meanings;
