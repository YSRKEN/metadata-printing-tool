import { Fraction } from "constant/other";

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
  console.log(table);

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
