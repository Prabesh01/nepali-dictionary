import "./MeaningsExample.scss";
import React from "react";

type propsT = { example: string | void };

const MeaningsExample = function ({ example }: propsT) {
  if (!example) return null;

  return <p className="example" dangerouslySetInnerHTML={{ __html: example }} />;
};

export default MeaningsExample;
