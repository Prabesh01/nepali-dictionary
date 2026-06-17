import "./Footer.scss";
import { getSlice } from "../helpers/functions";

const Footer = function () {
  const { currentFont } = getSlice();

  return (
    <footer className="footer" style={{ fontFamily: currentFont.cssValue }}>
      <a href="https://github.com/Prabesh01/nepali-dictionary" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
      <span>•</span>
      स्रोत - <a href="https://play.google.com/store/apps/details?id=np.com.naya.sabdakosh&hl=en" target="_blank" rel="noopener noreferrer">
        नेपाल प्रज्ञा–प्रतिष्ठान</a>
    </footer>
  );
};

export default Footer;
