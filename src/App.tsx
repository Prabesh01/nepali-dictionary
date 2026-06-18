import "./App.scss";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import MainContent from "./components/MainContent";
import NotFound from "./components/main-content/Error/NotFound";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import { getSlice, getData } from "./helpers/functions";
import { DictDataError, DictionaryData } from "./helpers/typeDefinitions";
import LightMode from "./components/navbar/theme-switch/LightMode";
import { sliceT } from "./store/slices/mainSlice";
import Loading from "./components/Loading";
import { useLocation } from "react-router-dom";
import AbbreviationsIndex from "./components/AbbreviationsIndex";

const App = function () {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentWord: string = pathParts[0] === 'word' && pathParts[1]
    ? decodeURIComponent(pathParts[1]).replaceAll("_", " ")
    : "";
  const { currentFont, nightMode }: sliceT = getSlice();
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<DictionaryData[] | DictDataError>();

  useEffect(() => {
    if (!currentWord) {
      setApiData(undefined);
      setLoading(false);
      document.title = `नेपाली शब्दकोश`;
      return;
    }
    setLoading(true);
    getData(currentWord)
      .then((v) => {
        setApiData(v);
        if (!v || v.title) return (document.title = `नेपाली शब्दकोश`);
        document.title = `${v[0].word} - नेपाली शब्दकोश`;
      })
      .then(() => {
        window.scrollTo(0, 0);
        setTimeout(() => setLoading(false), 100);
      });
  }, [currentWord]);

  const font = currentFont?.cssValue;

  let contentOrError: any = "";

  if (apiData && Array.isArray(apiData)) {
    contentOrError = <MainContent data={apiData[0]} font={font} currentWord={currentWord} />;
  } else if (apiData) {
    contentOrError = <NotFound data={apiData} />;
  } else if (!currentWord) {
    contentOrError = <AbbreviationsIndex font={font} />;
  }

  return (
    <div className={`app ${nightMode ? "" : "light"}`}>
      <LightMode switch={nightMode} />
      <div className="app-content">
        <Navbar />
        <SearchBar />
        {loading ? <Loading /> : contentOrError}
      </div>
      <Footer />
    </div>
  );
};

export default App;
