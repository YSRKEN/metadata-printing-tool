import { useState, createContext, useEffect } from "react";
import { getMetaInfo } from "service/exif";
import { fractionToString } from "service/utility";

// Actionの種類
type ActionType = 'setTextPosition'
  | 'setTextColor'
  | 'setImageSource'
  | 'setLoadingTrue'
  | 'setLoadingFalse'
  | 'setCameraMaker'
  | 'setCameraModel'
  | 'setLensName'
  | 'setExposureTime'
  | 'setFNumber'
  | 'setISOSpeedRatings';

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
  cameraMaker: string;        // カメラメーカー
  cameraModel: string;        // カメラの機種名
  lensName: string;           // レンズ名
  exposureTime: string;       // 露光時間
  fNumber: string;            // F値
  iSOSpeedRatings: string;    // ISO感度
  dispatch: (action: Action) => void;
}

// アプリケーションの状態を返す
export const useApplicationState = (): ApplicationState => {
  const [textPosition, setTextPosition] = useState<TextPosition>('lb');
  const [textColor, setTextColor] = useState<TextColor>('w');
  const [loadingFlg, setLoadingFlg] = useState(false);
  const [imageSource, setImageSource] = useState('');
  const [rawImageSource, setRawImageSource] = useState('');
  const [cameraMaker, setCameraMaker] = useState('');
  const [cameraModel, setCameraModel] = useState('');
  const [lensName, setLensName] = useState('');
  const [exposureTime, setExposureTime] = useState('');
  const [fNumber, setFNumber] = useState('');
  const [iSOSpeedRatings, setISOSpeedRatings] = useState('');

  // 画像が置き換わる度に、メタ情報を読み込みし直す
  useEffect(() => {
    setLoadingFlg(true);
    // Base64文字列からBinaryStringを作り、そこからUint8Arrayまで変換する
    const temp = rawImageSource.split(',');
    if (temp.length >= 2) {
      const imageBinary = Uint8Array.from(atob(temp[1]).split(''), e => e.charCodeAt(0));

      // Unit8Arrayを解析し、メタ情報を取り出す
      const metaInfo = getMetaInfo(imageBinary);

      // メタ情報をUI上にセットする
      setCameraMaker(metaInfo.cameraMaker);
      setCameraModel(metaInfo.cameraModel);
      setLensName(metaInfo.lensName);
      setExposureTime(fractionToString(metaInfo.exposureTime, 'exp'));
      setFNumber(fractionToString(metaInfo.fNumber, 'f'));
      setISOSpeedRatings(`ISO${metaInfo.iSOSpeedRatings}`);
    }
    setLoadingFlg(false);
  }, [rawImageSource]);

  // 表示する画像を更新する
  useEffect(() => {
    if (rawImageSource === '') {
      return;
    }
    setLoadingFlg(true);
    // 事前にCanvasを用意する
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context === null) {
      return;
    }

    // DataURL形式の画像を読み取り、Canvasにセットして作業する
    const image = new Image();
    image.onload = () => {
      // 事前の計算
      const fontSize = image.width > image.height ? image.height / 72 : image.width / 72;
      const font = `${fontSize}px sans-serif`;
      const fillStyle = textColor === 'w' ? 'rgb(186,192,178)' : 'rgb(69,63,77)';
      const insertedText = `${cameraMaker} ${cameraModel}, ${lensName}, ${exposureTime}, ${fNumber}, ${iSOSpeedRatings}`;

      // Canvasに画像を描画
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      // Canvasに文字を描画
      context.font = font;
      context.fillStyle = fillStyle;
      const rect = context.measureText(insertedText);
      switch (textPosition) {
        case 'lb':
          context.fillText(insertedText, fontSize, image.height - fontSize);
          break;
        case 'rb':
          context.fillText(insertedText, image.width - fontSize - rect.width, image.height - fontSize);
          break;
        case 'rt':
          context.fillText(insertedText, image.width - fontSize - rect.width, fontSize * 2);
          break;
        case 'lt':
          context.fillText(insertedText, fontSize, fontSize * 2);
          break;
      }
      setImageSource(canvas.toDataURL());
      setLoadingFlg(false);
    };
    image.src = rawImageSource;
  }, [rawImageSource, cameraMaker, cameraModel, lensName, exposureTime, fNumber, iSOSpeedRatings, textPosition, textColor]);

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
          setRawImageSource(action.message);
          break;
        // 読み込み中かどうかを切り替える
        case 'setLoadingTrue':
          setLoadingFlg(true);
          break;
        // 読み込み中かどうかを切り替える
        case 'setLoadingFalse':
          setLoadingFlg(false);
          break;
        // カメラメーカーを変更する
        case 'setCameraMaker':
          setCameraMaker(action.message);
          break;
        // カメラ名を変更する
        case 'setCameraModel':
          setCameraModel(action.message);
          break;
        // カメラメーカーを変更する
        case 'setLensName':
          setLensName(action.message);
          break;
        // 露光時間を変更する
        case 'setExposureTime':
          setExposureTime(action.message);
          break;
        // F値を変更する
        case 'setFNumber':
          setFNumber(action.message);
          break;
        // ISO感度を変更する
        case 'setISOSpeedRatings':
          setISOSpeedRatings(action.message);
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
    cameraMaker,
    cameraModel,
    lensName,
    exposureTime,
    fNumber,
    iSOSpeedRatings,
    dispatch
  };
};

export const ApplicationContext = createContext({} as ApplicationState);
