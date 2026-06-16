import "./App.scss";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import MainContent from "./components/MainContent";
import NotFound from "./components/main-content/Error/NotFound";
import { useEffect, useState } from "react";
import { getSlice, getData } from "./helpers/functions";
import { DictDataError, DictionaryData } from "./helpers/typeDefinitions";
import LightMode from "./components/navbar/theme-switch/LightMode";
import { sliceT } from "./store/slices/mainSlice";
import Loading from "./components/Loading";
import { useLocation } from "react-router-dom";

const App = function () {
  const location = useLocation();
  const currentWord: string = decodeURIComponent(location.pathname.slice(1)).replaceAll("_", " ");
  const { currentFont, nightMode }: sliceT = getSlice();
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<DictionaryData[] | DictDataError>();

  useEffect(() => {
    if (!currentWord) return;
    setLoading(true);
    getData(currentWord)
      .then((v) => {
        setApiData(v);
        if (!v || v.title) return (document.title = `Dictionary | Home`);
        document.title = `Dictionary | ${v[0].word}`;
      })
      .then(() => {
        window.scrollTo(0, 0);
        setTimeout(() => setLoading(false), 100);
      });
  }, [currentWord]);

  const font = currentFont?.cssValue;

  let contentOrError: any = "";

  if (apiData && Array.isArray(apiData)) {
    contentOrError = <MainContent data={apiData[0]} font={font} />;
  } else if (apiData) {
    contentOrError = <NotFound data={apiData} />;
  }

  return (
    <div className={`app ${nightMode ? "" : "light"}`}>
      <LightMode switch={nightMode} />
      <Navbar />
      <SearchBar />
      {loading ? <Loading /> : contentOrError}
    </div>
  );
};

export default App;
