import "./Navbar.scss";
import logo from "../assets/images/logo.svg";
import FontSelector from "./navbar/FontSelector";
import Separator from "./utilities/Separator";
import ThemeSwitch from "./navbar/ThemeSwitch";
import { Link } from "react-router-dom";
import { getSlice } from "../helpers/functions";

const Navbar = function () {
  const { currentFont } = getSlice();

  return (
    <div className="navbar">
      <Link to="/" className="navbar-logo-link">
        <img src={logo} alt="Dictionary logo" />
        <span className="navbar-title" style={{ fontFamily: currentFont.cssValue }}>नेपाली शब्दकोश</span>
      </Link>
      <FontSelector />
      <Separator isHorizontal={false} size={"3.2rem"} />
      <ThemeSwitch />
    </div>
  );
};

export default Navbar;
