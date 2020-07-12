import { MetaInfo, IFD } from "constant/model";
import { DEFAULT_META_INFO, Endian } from "constant/other";

/**
 * 配列同士を比較する
 * @param arr1 配列1
 * @param arr2 配列2
 * @returns 同一の値を保持していたらtrue
 */
const equals = (arr1: Uint8Array, arr2: number[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i += 1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};

/**
 * 指定した配列について、先頭2バイトをSHORT型と仮定して読み取る
 * @param arr1 配列
 * @param endian エンディアン
 * @returns 値
 */
const getShortValue = (arr1: Uint8Array, endian: Endian) => {
  if (endian === 'LE') {
    return arr1[1] * 256 + arr1[0];
  } else {
    return arr1[0] * 256 + arr1[1];
  }
};

/**
 * 指定した配列について、先頭4バイトをINT型と仮定して読み取る
 * @param arr1 配列
 * @param endian エンディアン
 * @returns 値
 */
const getIntValue = (arr1: Uint8Array, endian: string) => {
  if (endian === 'LE') {
    return arr1[3] * 16777216 + arr1[2] * 65536 + arr1[1] * 256 + arr1[0];
  } else {
    return arr1[0] * 16777216 + arr1[1] * 65536 + arr1[2] * 256 + arr1[3];
  }
};

/**
 * IFD形式を読み取り、データを一覧にして返す
 * @param arr1 もとのバイナリデータ
 * @param startIndex IFDデータの開始位置
 * @param endian エンディアン
 * 
 */
const getIfdData = (arr1: Uint8Array, startIndex: number, endian: Endian) => {
  // タグの個数を取得
  const ifdCount = getShortValue(arr1.slice(startIndex, startIndex + 2), endian);

  // 1つづつ読み取る
  const output: IFD[] = [];
  for (let i = 0; i < ifdCount; i += 1) {
    const p = startIndex + 2 + 12 * i;
    const ifdId = getShortValue(arr1.slice(p, p + 2), endian);
    const ifdCount = getIntValue(arr1.slice(p + 4, p + 8), endian);
    const ifdValue = getIntValue(arr1.slice(p + 8, p + 12), endian);
    switch (getShortValue(arr1.slice(p + 2, p + 4), endian)) {
      case 1:
        output.push({id: ifdId, type: 'BYTE', value: []});
        break;
      case 2:
        output.push({id: ifdId, type: 'ASCII', value: ''});
        break;
      case 3:
        output.push({id: ifdId, type: 'SHORT', value: []});
        break;
      case 4:
        output.push({id: ifdId, type: 'LONG', value: []});
        break;
      case 5:
        output.push({id: ifdId, type: 'RATIONAL', value: []});
        break;
      case 7:
        output.push({id: ifdId, type: 'UNDEFINED', value: []});
        break;
      case 9:
        output.push({id: ifdId, type: 'SLONG', value: []});
        break;
      case 10:
        output.push({id: ifdId, type: 'SRATIONAL', value: []});
        break;
      default:
        break;
    }
  }
  return output;
};

/**
 * JPEGデータを読み込み、メタ情報を返す
 * @param imageBinary JPEGファイルのバイナリ
 * @returns メタ情報
 */
export const getMetaInfo = (imageBinary: Uint8Array): MetaInfo => {
  // JPEGデータでなければ弾く
  if (imageBinary.length < 8) {
    return DEFAULT_META_INFO;
  }
  if (!equals(imageBinary.slice(0, 2), [0xFF, 0xD8])) {
    return DEFAULT_META_INFO;
  }

  // Exifが存在するはずの、APP1セグメントまでシークする
  let filePointer = 2;  // この2は、SOIマーカーの長さ
  while (filePointer < imageBinary.length - 6) {  // この6は、EOIマーカー長＋セグメントの最短長
    if (imageBinary[filePointer] !== 0xFF) {
      return DEFAULT_META_INFO;
    }
    if (imageBinary[filePointer + 1] === 0xE1) {
      // APP1マーカーを検知したのでループを抜ける
      break;
    }
    const segmentSize = getShortValue(imageBinary.slice(filePointer + 2, filePointer + 4), 'BE');
    filePointer += segmentSize + 2;
    break;
  }

  // APP1セグメントにExifデータが存在しない場合は弾く
  const segmentSize = getShortValue(imageBinary.slice(filePointer + 2, filePointer + 4), 'BE');
  if (segmentSize < 6 + 2 + 2 + 4 + 2) {
    // それぞれ、Exif識別コード、Tiffエンディアン指定、Tiff識別コード、0th IFDへのポインタ、ITFのタグ数のバイト長
    return DEFAULT_META_INFO;
  }
  if (!equals(imageBinary.slice(filePointer + 4, filePointer + 10), [0x45, 0x78, 0x69, 0x66, 0x00, 0x00])) {
    // Exif識別コードが無ければ弾く
    return DEFAULT_META_INFO;
  }
  const endianBinary = imageBinary.slice(filePointer + 10, filePointer + 12);
  let endian: Endian = 'LE';
  if (equals(endianBinary, [0x49, 0x49])) {
    endian = 'LE';
  } else if (equals(endianBinary, [0x4D, 0x4D])) {
    endian = 'BE';
  } else {
    // Tiffエンディアン指定が無ければ弾く
    return DEFAULT_META_INFO;
  }
  if (getShortValue(imageBinary.slice(filePointer + 12, filePointer + 14), endian) !== 0x2A) {
    // Tiff識別コードが無ければ弾く
    return DEFAULT_META_INFO;
  }
  const zerothIfdPointer = getIntValue(imageBinary.slice(filePointer + 14, filePointer + 18), endian);
  filePointer += zerothIfdPointer + 6 + 2 + 2;  // それぞれExif識別コード・APP1サイズ・APP1マーカーのバイト長

  // 0th IFDを読み取る
  const zerothIfdData = getIfdData(imageBinary, filePointer, endian);
  console.log(zerothIfdData);
  return {
    cameraMaker: 'x',
    cameraModel: 'y'
  };
};
