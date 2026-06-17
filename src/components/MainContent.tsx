import "./MainContent.scss";
import { DictionaryData } from "../helpers/typeDefinitions";
import React from "react";
import TitleSection from "./main-content/TitleSection";
import Meanings from "./main-content/Meanings";
import MeaningsNyms from "./main-content/MeaningsNyms";
import Separator from "./utilities/Separator";

type propsT = {
  data: DictionaryData;
  font: string;
};

const MainContent: React.FC<propsT> = function ({ data, font }) {
  const style = {
    fontFamily: font,
  };

  const meaningsJSX = data.meanings.map((value, i) => (
    <Meanings key={i} meanings={value} />
  ));

  const allSimilar: string[] = [];

  // Check root-level similar
  if (data.similar && data.similar.length > 0) {
    allSimilar.push(...data.similar);
  }

  // Also check meaning-level similar
  data.meanings.forEach(m => {
    if (m.similar && m.similar.length > 0) {
      allSimilar.push(...m.similar);
    }
  });

  return (
    <div className="main-content" style={style}>
      <TitleSection word={data.word} />
      {meaningsJSX}
      {allSimilar.length > 0 && (
        <>
          <Separator size={"100%"} isHorizontal={true} />
          <MeaningsNyms name={"यस्तै अरू"} list={allSimilar} />
        </>
      )}
    </div>
  );
};

export default MainContent;
