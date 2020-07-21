import { useState, createContext, useEffect } from "react";
import { getMetaInfo } from "service/exif";
import { fractionToString, createRenderedImage, loadSetting, saveSetting } from "service/utility";
import { TextPosition, TextColor } from "constant/other";

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
  | 'setISOSpeedRatings'
  | 'setUserName'
  | 'refreshRenderedImage'
  | 'setJpegModeFlg';

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
  jpegModeFlg: boolean;       // ここがtrueなら、imageSourceがPNG形式ではなくJPEG形式になる
  userName: string;           // 撮影者名(Photo by XXXと印字される)
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
  const [loadingActionFlg, setLoadingActionFlg] = useState(false);
  const [jpegModeFlg, setJpegModeFlg] = useState(false);
  const [userName, setUserName] = useState(loadSetting('userName', ''));

  // 再描画用関数
  const redrawImage = () => {
    setLoadingFlg(true);
    createRenderedImage(
      rawImageSource,
      cameraMaker,
      cameraModel,
      lensName,
      exposureTime,
      fNumber,
      iSOSpeedRatings,
      userName,
      textPosition,
      textColor,
      jpegModeFlg
    ).then(data => {
      setImageSource(data);
      setLoadingFlg(false);
    }).catch((e: Error) => {
      console.error(e);
      setLoadingFlg(false);
    });
  };

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
      setFNumber(`F${fractionToString(metaInfo.fNumber, 'f')}`);
      setISOSpeedRatings(`ISO${metaInfo.iSOSpeedRatings}`);

      // 再描画のための準備
      setLoadingActionFlg(true);
    }
    setLoadingFlg(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawImageSource]);

  // 表示する画像を更新する
  useEffect(() => {
    redrawImage();
    setLoadingActionFlg(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textPosition, textColor, loadingActionFlg, jpegModeFlg]);

  // 撮影者名は記憶する
  useEffect(() => saveSetting('userName', userName), [userName]);

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
        // 名前を変更する
        case 'setUserName':
          setUserName(action.message);
          break;
        // 手動で画像を更新する
        case 'refreshRenderedImage':
          redrawImage();
          break;
        // 保存モードの切替え
        case'setJpegModeFlg':
        setJpegModeFlg(!jpegModeFlg);
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
    jpegModeFlg,
    userName,
    dispatch
  };
};

export const ApplicationContext = createContext({} as ApplicationState);
