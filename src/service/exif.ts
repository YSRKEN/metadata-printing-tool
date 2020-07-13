import { MetaInfo, IFD } from "constant/model";
import { DEFAULT_META_INFO, Endian, Fraction } from "constant/other";
import { findBinary } from "service/utility";

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
 * 指定した配列について、指定した範囲をASCII型と仮定して読み取る
 * @param arr1 配列
 * @param start 開始位置
 * @param length 長さ
 * @return 値
 */
const getAsciiValue = (arr1: Uint8Array, start: number, length: number) => {
  let output = '';
  for (let ci = 0; ci < length; ci += 1) {
    output += String.fromCharCode(arr1[start + ci]);
  }
  output = output.replace(/\0/g, '');
  return output;
};

/**
 * IFD形式を読み取り、データを一覧にして返す
 * @param arr1 もとのバイナリデータ
 * @param startIndex IFDデータの開始位置
 * @param exifBasePointer Exifデータの基準位置
 * @param endian エンディアン
 * @returns IFD形式のデータ一覧
 */
const getIfdData = (arr1: Uint8Array, startIndex: number, exifBasePointer: number, endian: Endian) => {
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
        const startPointer = ifdCount <= 4 ? p + 8 : exifBasePointer + ifdValue;
        output.push({id: ifdId, type: 'BYTE', value: arr1.slice(startPointer, startPointer + ifdCount)});
        break;
      case 2:
        if (ifdCount <= 4) {
          output.push({id: ifdId, type: 'ASCII', value: getAsciiValue(arr1, p + 8, ifdCount)});
        } else {
          output.push({id: ifdId, type: 'ASCII', value: getAsciiValue(arr1, exifBasePointer + ifdValue, ifdCount)});
        }
        break;
      case 3: {
        const startPointer = ifdCount <= 2 ? p + 8 : exifBasePointer + ifdValue;
        const temp: number[] = [];
        for (let j = startPointer; j < startPointer + ifdCount * 2; j += 2) {
          temp.push(getShortValue(arr1.slice(j, j + 2), endian));
        }
        output.push({id: ifdId, type: 'SHORT', value: temp});
        break;
      }
      case 4: {
        const startPointer = ifdCount <= 1 ? p + 8 : exifBasePointer + ifdValue;
        const temp: number[] = [];
        for (let j = startPointer; j < startPointer + ifdCount * 4; j += 4) {
          temp.push(getIntValue(arr1.slice(j, j + 4), endian));
        }
        output.push({id: ifdId, type: 'LONG', value: temp});
        break;
      }
      case 5: {
        const temp: Fraction[] = [];
        const startPointer = exifBasePointer + ifdValue;
        for (let j = startPointer; j < startPointer + ifdCount * 8; j += 8) {
          temp.push({
            numerator: getIntValue(arr1.slice(j, j + 4), endian),
            denominator: getIntValue(arr1.slice(j + 4, j + 8), endian)
          });
        }
        output.push({id: ifdId, type: 'RATIONAL', value: temp});
        break;
      }
      case 7: {
        const startPointer = ifdCount <= 4 ? p + 8 : exifBasePointer + ifdValue;
        output.push({id: ifdId, type: 'UNDEFINED', value: arr1.slice(startPointer, startPointer + ifdCount)});
        break;
      }
      case 9: {
        const startPointer = ifdCount <= 1 ? p + 8 : exifBasePointer + ifdValue;
        const temp: number[] = [];
        for (let j = startPointer; j < startPointer + ifdCount * 4; j += 4) {
          temp.push(getIntValue(arr1.slice(j, j + 4), endian));
        }
        output.push({id: ifdId, type: 'SLONG', value: temp});
        break;
      }
      case 10: {
        const temp: Fraction[] = [];
        const startPointer = exifBasePointer + ifdValue;
        for (let j = startPointer; j < startPointer + ifdCount * 8; j += 8) {
          temp.push({
            numerator: getIntValue(arr1.slice(j, j + 4), endian),
            denominator: getIntValue(arr1.slice(j + 4, j + 8), endian)
          });
        }
        output.push({id: ifdId, type: 'SRATIONAL', value: temp});
        break;
      }
      default:
        output.push({id: -1, type: '', value: []});
        break;
    }
  }
  return output;
};

/**
 * IFDのデータ一覧から、指定したタグIDのものを抽出して値を返す
 * @param ifdData IFDのデータ一覧
 * @param id タグID
 * @param defaultValue 見つからなかった際のデフォルト値
 * @return 値
 */
const findIfd = <T>(ifdData: IFD[], id: number, defaultValue: T) => {
  const temp = ifdData.filter(ifd=> ifd.id === id);
  if (temp.length > 0) {
    return (temp[0].value as any) as T;
  } else {
    return defaultValue;
  }
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
  const exifBasePointer = filePointer + 10;
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
  const zerothIfdData = getIfdData(imageBinary, filePointer, exifBasePointer, endian);
  let allIfdData = [...zerothIfdData];

  // 1st IFDを読み取る
  const temp = filePointer + 2 + 12 * zerothIfdData.length;
  const firstIfdPointer = getIntValue(imageBinary.slice(temp, temp + 4), endian) + exifBasePointer;
  const firstIfdData = getIfdData(imageBinary, firstIfdPointer, exifBasePointer, endian);
  allIfdData = [...allIfdData, ...firstIfdData];

  // Exif IFDを読み取る
  const exifIfd = zerothIfdData.filter(ifd => ifd.id === 34665);
  if (exifIfd.length > 0) {
    const exifIfdPointer = (exifIfd[0].value as number[])[0] + exifBasePointer;
    const exifIfdData = getIfdData(imageBinary, exifIfdPointer, exifBasePointer, endian);
    allIfdData = [...allIfdData, ...exifIfdData];
  }

  // IFDの一覧から、カメラメーカー名・カメラモデル名・露光時間・F値・ISO感度を抽出する
  const cameraMaker = findIfd(allIfdData, 271, DEFAULT_META_INFO.cameraMaker);
  const cameraModel = findIfd(allIfdData, 272, DEFAULT_META_INFO.cameraModel);
  let lensName = findIfd(allIfdData, 42036, DEFAULT_META_INFO.lensName);
  const exposureTimeTemp = findIfd(allIfdData, 33434, []);
  const exposureTime = exposureTimeTemp.length > 0 ? exposureTimeTemp[0] : DEFAULT_META_INFO.exposureTime;
  const fNumberTemp = findIfd(allIfdData, 33437, []);
  const fNumber = fNumberTemp.length > 0 ? fNumberTemp[0] : DEFAULT_META_INFO.fNumber;
  const iSOSpeedRatings = findIfd(allIfdData, 34855, DEFAULT_META_INFO.iSOSpeedRatings);

  // これではレンズ名を取得できない場合の処理
  // ※Canon・FUJIFILM・OLYMPUS・SIGMA・SONYにはこの処理が不要
  // ※Nikon・Panasonic・PENTAXにはこの処理が必要
  switch (cameraMaker) {
    case 'Panasonic': {
      // メーカーノートを取得
      const makerNote = findIfd(allIfdData, 37500, Uint8Array.from([]));
      if (makerNote.length === 0) {
        break;
      }

      // メーカーノートを解析
      const makerNoteStartIndex = findBinary(imageBinary, makerNote);
      if (makerNoteStartIndex < 0) {
        break;
      }
      const makerNoteIfdData = getIfdData(imageBinary, makerNoteStartIndex + 12, exifBasePointer, endian);

      // データを取り出す
      lensName = findIfd(makerNoteIfdData, 0x51, DEFAULT_META_INFO.lensName);
      break;
    }
  }

  return {
    cameraMaker,
    cameraModel,
    lensName,
    exposureTime,
    fNumber,
    iSOSpeedRatings
  };
};
