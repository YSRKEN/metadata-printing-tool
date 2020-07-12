import { IfdType } from "constant/other";

// 画像のメタ情報
export interface MetaInfo {
  cameraMaker: string;
  cameraModel: string;
};

// IFD
export interface IFD {
  id: number;     //タグのID
  type: IfdType;  // 値の種類
  value: number[] | string | [number, number][] | Uint8Array;  // 値
};
