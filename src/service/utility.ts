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

export const fractionToString = (fraction: Fraction, type: 'exp' | 'f') => {
  switch (type) {
    case 'exp':
      if (fraction.numerator < fraction.denominator) {
        return `1/${roundX(1.0 * fraction.denominator / fraction.numerator, 1)}`;
      } else {
        return `${roundX(1.0 * fraction.numerator / fraction.denominator, 1)}`;
      }
      return '';
    case 'f':
      return `${roundX(1.0 * fraction.numerator / fraction.denominator, 1)}`;
  }
};
