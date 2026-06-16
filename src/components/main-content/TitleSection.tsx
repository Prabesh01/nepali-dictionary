import "./TitleSection.scss";
import React from "react";

interface propsT {
  word: string;
}

const TitleSection: React.FC<propsT> = function (props) {
  const { word } = props;

  let style: { fontSize: string } = { fontSize: "6.4rem" };

  // Give words with a lot of characters smaller font sizes dynamically
  if (word.length >= 17) {
    style = {
      fontSize: `${110 / word.length}rem`,
    };
  }

  return (
    <div className="title-container">
      <div className="title-pronounciation-container">
        <h1 className="title" style={style}>
          {word}
        </h1>
      </div>
    </div>
  );
};

export default TitleSection;
