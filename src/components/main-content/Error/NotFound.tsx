import "./NotFound.scss";
import React from "react";
import { DictDataError } from "../../../helpers/typeDefinitions";
import { getCurrentWord, getSlice } from "../../../helpers/functions";

interface propsT {
  data: DictDataError;
}

const NotFound: React.FC<propsT> = function ({ data }) {
  const currentWord = getCurrentWord();
  const { currentFont } = getSlice();
  const { title, message, resolution } = data;

  return (
    <div className="not-found" style={{ fontFamily: currentFont.cssValue }}>
      <span>😕</span>
      <h5>{title}</h5>
      <h6>{`${message} ${resolution}`}</h6>
    </div>
  );
};

export default NotFound;
