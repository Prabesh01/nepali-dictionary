import React from "react";
import { getSlice } from "../../helpers/functions";

interface PropsT {
  invalid: boolean | string;
}

const Invalid: React.FC<PropsT> = function ({ invalid }) {
  const { currentFont } = getSlice();

  if (!invalid) return null;

  return <p style={{ fontFamily: currentFont.cssValue }}>{invalid}</p>;
};

export default Invalid;
