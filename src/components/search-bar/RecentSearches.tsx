import "./RecentSearches.scss";
import { Link } from "react-router-dom";
import { formatForUrl, getSlice } from "../../helpers/functions";

type propsT = {
  recentSearches: string[];
  onClear: () => void;
};

const RecentSearches = function ({ recentSearches, onClear }: propsT) {
  const { currentFont } = getSlice();

  if (recentSearches.length === 0) return null;

  return (
    <div className="recent-searches" style={{ fontFamily: currentFont.cssValue }}>
      <button className="clear-btn" onClick={onClear} title="Clear recent searches">
        ×
      </button>
      <div className="recent-list">
        {recentSearches.map((word, i) => (
          <Link key={i} to={"/word/" + formatForUrl(word)} className="recent-tag">
            {word}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
