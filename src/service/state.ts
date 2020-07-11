import { useState, createContext } from "react";

// Actionの種類
type ActionType = 'setTextPosition' | 'setTextColor';

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
  textPosition: TextPosition;
  textColor: TextColor;
  dispatch: (action: Action) => void;
}

// アプリケーションの状態を返す
export const useApplicationState = (): ApplicationState => {
  const [textPosition, setTextPosition] = useState<TextPosition>('lb');
  const [textColor, setTextColor] = useState<TextColor>('w');

  const dispatch = async (action: Action) => {
    try {
      switch (action.type) {
        case 'setTextPosition':
          setTextPosition(action.message as TextPosition);
          break;
        case 'setTextColor':
          setTextColor(action.message as TextColor);
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
    dispatch
  };
};

export const ApplicationContext = createContext({} as ApplicationState);
