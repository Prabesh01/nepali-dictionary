import "./MeaningsNyms.scss";
import React from "react";
import { Link } from "react-router-dom";
import { formatForUrl } from "../../helpers/functions";

type propsT = {
  list: string[];
  name: string;
  showAsGrid?: boolean;
  hideHeader?: boolean;
};

const MeaningsNyms = function ({ name, list, showAsGrid = false, hideHeader = false }: propsT) {
  if (list.length < 1) return null;

  const JSX = list.map((v, i) => (
    <Link to={"/word/" + formatForUrl(v)} key={i}>
      <li>{v}</li>
    </Link>
  ));

  return (
    <div className={`nyms ${showAsGrid ? 'grid-layout' : ''}`}>
      {!showAsGrid && !hideHeader && <h4>{name}</h4>}
      {showAsGrid && !hideHeader ? (
        <div className="grid-header-container">
          <h3>{name}</h3>
        </div>
      ) : null}
      <ul>{JSX}</ul>
    </div>
  );
};

export default MeaningsNyms;
