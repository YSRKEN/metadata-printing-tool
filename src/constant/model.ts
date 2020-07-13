import { IfdType, Fraction } from "constant/other";

// 画像のメタ情報
export interface MetaInfo {
  cameraMaker: string;      // カメラメーカー
  cameraModel: string;      // カメラ名
  lensName: string;         // レンズ名
  exposureTime: Fraction;   // 露光時間
  fNumber: Fraction;        // F値
  iSOSpeedRatings: number;  // ISO感度
};

// IFD
export interface IFD {
  id: number;     //タグのID
  type: IfdType;  // 値の種類
  value: number[] | string | Fraction[] | Uint8Array;  // 値
};
