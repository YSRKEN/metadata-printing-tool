import { useState, createContext } from "react";

// Actionの種類
type ActionType = 'setTextPosition'
  | 'setTextColor'
  | 'setImageSource'
  | 'setLoadingTrue'
  | 'setLoadingFalse';

// テキストの表示位置
type TextPosition = 'lb' | 'rb' | 'rt' | 'lt';

// テキストの色
type TextColor = 'w' | 'b';

// Action
interface Action {
  type: ActionType;
  message: string;
}

// アプリケーションの状態
interface ApplicationState {
  textPosition: TextPosition; // テキストの表示位置
  textColor: TextColor;       // テキストの表示色
  imageSource: string;        // 表示される画像データ
  loadingFlg: boolean;        // 読み込み中ならtrue
  dispatch: (action: Action) => void;
}

// アプリケーションの状態を返す
export const useApplicationState = (): ApplicationState => {
  const [textPosition, setTextPosition] = useState<TextPosition>('lb');
  const [textColor, setTextColor] = useState<TextColor>('w');
  const [loadingFlg, setLoadingFlg] = useState(false);
  const [imageSource, setImageSource] = useState('');

  const dispatch = async (action: Action) => {
    try {
      switch (action.type) {
        // テキストの表示位置を変更する
        case 'setTextPosition':
          setTextPosition(action.message as TextPosition);
          break;
        // テキストの表示色を変更する
        case 'setTextColor':
          setTextColor(action.message as TextColor);
          break;
        // 画像データをセットする
        case 'setImageSource':
          setImageSource(action.message);
          break;
        // 読み込み中かどうかを切り替える
        case 'setLoadingTrue':
          setLoadingFlg(true);
          break;
        // 読み込み中かどうかを切り替える
        case 'setLoadingFalse':
          setLoadingFlg(false);
          break;
      }
    } catch (e) {
      const e2: Error = e;
      window.alert(e2.message);
      console.error(e);
    }
  };

  return {
    textPosition,
    textColor,
    imageSource,
    loadingFlg,
    dispatch
  };
};

export const ApplicationContext = createContext({} as ApplicationState);
