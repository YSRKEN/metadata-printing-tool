import { Fraction, TextColor, TextPosition } from "constant/other";

/**
 * 小数点以下digit位まで丸める
 * @param x 元の値
 * @param digit 小数点以下
 * @returns 丸めた後の値
 */
export const roundX = (x: number, digit: number) => {
  let param = 1;
  for (let i = 0; i <= digit; i += 1) {
    param *= 10;
  }
  return Math.round(1.0 * x * param) / param;
};

/**
 * 分数を文字列化する
 * @param fraction 分数
 * @param type 'exp'で露光時間用、'f'でF値用の処理を実施
 * @returns 分数文字列
 */
export const fractionToString = (fraction: Fraction, type: 'exp' | 'f') => {
  switch (type) {
    case 'exp':
      if (fraction.numerator < fraction.denominator) {
        return `1/${roundX(1.0 * fraction.denominator / fraction.numerator, 1)}`;
      } else {
        return `${roundX(1.0 * fraction.numerator / fraction.denominator, 1)}`;
      }
    case 'f':
      return `${roundX(1.0 * fraction.numerator / fraction.denominator, 1)}`;
  }
};

/**
 * 元のデータから、検索したいデータを検索する
 * ソースコードの参考：https://algoful.com/Archive/Algorithm/BMSearch
 * @param baseData 元のデータ
 * @param patternData 検索したいデータ
 * @returns 元のデータにおける、検索したいデータのインデックス。見つからなかった場合は-1
 */
export const findBinary = (baseData: Uint8Array, patternData: Uint8Array) => {
  // BM法のスクラッチ実装
  const table: number[] = [];
  for (let i = 0x00; i <= 0xFF; i += 1) {
    table.push(patternData.length);
  }
  for (let i = 0; i < patternData.length; i += 1) {
    table[patternData[i]] = patternData.length - 1 - i;
  }

  let i = patternData.length - 1;
  while (i < baseData.length) {
    let p = patternData.length - 1;
    while (p >= 0 && i < baseData.length) {
      if (baseData[i] === patternData[p]) {
        i -= 1;
        p -= 1;
      } else {
        break;
      }
    }
    if (p < 0) {
      return i + 1;
    }
    const shift1 = table[patternData[p]];
    const shift2 = patternData.length - p;
    i += Math.max(shift1, shift2);
  }
  return -1;
};

/**
 * 文字を入れた後の画像を生成する
 * @param rawImageSource 元の画像
 * @param cameraMaker カメラメーカー
 * @param cameraModel カメラ名
 * @param lensName レンズ名
 * @param exposureTime 露光時間
 * @param fNumber F値
 * @param iSOSpeedRatings ISO感度
 * @param textPosition 表示位置
 * @param textColor 表示色
 * @returns 生成した画像を返すPromise
 */
export const createRenderedImage = async (
  rawImageSource: string,
  cameraMaker: string,
  cameraModel: string,
  lensName: string,
  exposureTime: string,
  fNumber: string,
  iSOSpeedRatings: string,
  textPosition: TextPosition,
  textColor: TextColor
): Promise<string> => {
  return new Promise((res) => {
    // 事前チェック
    if (rawImageSource === '') {
      res('');
    }

    // 作業用にCanvasを用意する
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context === null) {
      res('');
    } else {
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
      res(canvas.toDataURL());
    };
    image.src = rawImageSource;
    }
  });
};
