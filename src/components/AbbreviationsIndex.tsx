import "./AbbreviationsIndex.scss";
import abbreviations from "../../public/abbr.json";
import { Link } from "react-router-dom";
import { formatForUrl } from "../helpers/functions";

type propsT = {
  font: string;
};

const AbbreviationsIndex: React.FC<propsT> = ({ font }) => {
  const entries = Object.entries(abbreviations);
  const style = { fontFamily: font };

  return (
    <div className="abbreviations-index" style={style}>
      <h2>सङ्केतसूची</h2>
      <div className="abbr-grid">
        {entries.map(([full, abbr]) => (
          <Link to={"/word/" + formatForUrl(abbr) + "."} key={abbr}>
            <div className="abbr-item">
              <span className="abbr-short">{abbr}</span>
              <span className="abbr-full">{full}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AbbreviationsIndex;
