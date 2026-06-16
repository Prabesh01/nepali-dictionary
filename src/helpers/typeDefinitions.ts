import { sliceT } from "../store/slices/mainSlice";

export interface DictionaryData {
  word: string;
  similar?: string[];
  meanings: {
    partOfSpeech: string;
    etymology?: string;
    definitions: {
      definition: string;
      examples?: string[];
    }[];
    similar?: string[];
  }[];
}

export interface DictDataError {
  title: string;
  message: string;
  resolution: string;
}

export interface meaningsT {
  meanings: {
    partOfSpeech: string;
    etymology?: string;
    definitions: {
      definition: string;
      examples?: string[];
    }[];
    similar?: string[];
  };
}

export interface FontT {
  id: number;
  name: string;
  cssValue: string;
}

export interface selectT {
  main: sliceT;
}
