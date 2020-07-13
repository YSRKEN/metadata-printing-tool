import { MetaInfo } from "constant/model";

// デフォルトのメタ情報
export const DEFAULT_META_INFO: MetaInfo = {
  cameraMaker: '?',
  cameraModel: '?',
  lensName: '?',
  exposureTime: {numerator: 1, denominator: 1},
  fNumber: {numerator: 1, denominator: 1},
  iSOSpeedRatings: 100
};

// 分数型
export interface Fraction {
  numerator: number;    // 分子
  denominator: number;  // 分母
};

// エンディアンの形式
export type Endian = 'BE' | 'LE';

// タグの種類
export type IfdType = 'BYTE' | 'ASCII' | 'SHORT' | 'LONG' | 'RATIONAL' | 'UNDEFINED' | 'SLONG' | 'SRATIONAL' | '';

// テキストの表示位置
export type TextPosition = 'lb' | 'rb' | 'rt' | 'lt';

// テキストの色
export type TextColor = 'w' | 'b';
