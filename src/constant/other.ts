import { MetaInfo } from "constant/model";

// デフォルトのメタ情報
export const DEFAULT_META_INFO: MetaInfo = {
  cameraMaker: '?',
  cameraModel: '?'
};

// エンディアンの形式
export type Endian = 'BE' | 'LE';

// タグの種類
export type IfdType = 'BYTE' | 'ASCII' | 'SHORT' | 'LONG' | 'RATIONAL' | 'UNDEFINED' | 'SLONG' | 'SRATIONAL';
