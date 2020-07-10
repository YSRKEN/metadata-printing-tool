import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import 'App.css';
import EXIF from 'exif-js';

const getLensNameForPanasonic = (makerNote: number[], rawData: ArrayBuffer) => {
  // MakerNoteにIFDタグが並んでいるので、レンズ名を示す情報を検索する
  const ifdCount = makerNote[12];
  for (let i = 0; i < ifdCount; i += 1) {
    const ifdIndex = 12 + 2 + 12 * i;
    const temp = makerNote.slice(ifdIndex, ifdIndex + 12);
    const tagId = temp[1] * 256 + temp[0];
    if (tagId === 0x51) {
      // データの長さ・オフセット値を取得
      const lensNameLength = temp[7] * 16777216 + temp[6] * 65536 + temp[5] * 256 + temp[4];
      const lensNameOffset = temp[11] * 16777216 + temp[10] * 65536 + temp[9] * 256 + temp[8];

      // 検索処理で文字列をスライスして取り出す
      const keyWord = 'Exif';
      const view = new Uint8Array(rawData);
      for (let j = 0; j < Math.min(view.length - 4, 3000); j += 1) {
        if (view[j] === keyWord.charCodeAt(0)
          && view[j + 1] === keyWord.charCodeAt(1)
          && view[j + 2] === keyWord.charCodeAt(2)
          && view[j + 3] === keyWord.charCodeAt(3)) {
            const lensNameArray = view.slice(j + 6 + lensNameOffset, j + 6 + lensNameOffset + lensNameLength);
            let lensName = '';
            for (let ci = 0; ci < lensNameArray.length; ci += 1) {
              lensName += String.fromCharCode(lensNameArray[ci]);
            }
            lensName = lensName.replace(/\0/g, '');
            return lensName;
          }
      }
    }
  }
  return '？？';
};

// 配列同士を比較し、完全に一致していた場合はtrue
const compareArray = (arr1: Uint8Array, arr2: number[]) => {
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

// Unit8の配列と、ASCII文字列とを比較し、完全に一致していた場合はtrue
const compareArrayString = (arr1: Uint8Array, str1: string) => {
  const temp: number[] = [];
  for (let i = 0; i < str1.length; i += 1) {
    temp.push(str1.codePointAt(i) as number);
  }
  return compareArray(arr1, temp);
}

// 指定した配列について、先頭4バイトをリトルエンディアンのINT型と仮定して読み取る
const getIntValueLE = (arr1: Uint8Array) => {
  return arr1[3] * 16777216 + arr1[2] * 65536 + arr1[1] * 256 + arr1[0];
};

// 指定した配列について、先頭4バイトをリトルエンディアンのSHORT型と仮定して読み取る
const getShortValueLE = (arr1: Uint8Array) => {
  return arr1[1] * 256 + arr1[0];
};

// 指定した配列について、指定した範囲をASCII型と仮定して読み取る
const getAsciiValue = (arr1: Uint8Array, start: number, length: number) => {
  let output = '';
  for (let ci = 0; ci < length; ci += 1) {
    output += String.fromCharCode(arr1[start + ci]);
  }
  output = output.replace(/\0/g, '');
  return output;
};


// IFDタグのデータを読み取る
interface IFD {
  id: number;     //タグのID
  type: number;   // 値の種類
  count: number;  // 値の数
  value: number;  // 値 or 値へのオフセット
};

const getIfdData = (arr1: Uint8Array, startIndex: number) => {
  const ifdCount = getShortValueLE(arr1.slice(startIndex, startIndex + 2));
  const output: IFD[] = [];
  for (let i = 0; i < ifdCount; i += 1) {
    const p = startIndex + 2 + 12 * i;
    output.push({
      id: getShortValueLE(arr1.slice(p, p + 2)),
      type: getShortValueLE(arr1.slice(p + 2, p + 4)),
      count: getIntValueLE(arr1.slice(p + 4, p + 8)),
      value: getIntValueLE(arr1.slice(p + 8, p + 12))
    });
  }
  return output;
};

const getLensNameForSONY = (rawData: ArrayBuffer) => {
  // MakerNoteにすら情報が無いので、地道に生データをデコードする
  const view = new Uint8Array(rawData);
  if (!compareArray(view.slice(0, 4), [0xFF, 0xD8, 0xFF, 0xE1])) {
    // JPEGデータではないと推定されるので弾く
    return '？？';
  }
  if (!compareArrayString(view.slice(6, 10), 'Exif')) {
    // Exifフォーマットではないと推定されるので弾く
    return '？？';
  }
  if (!compareArray(view.slice(12, 14), [0x49, 0x49])) {
    // 面倒なので、ビッグエンディアンの際も弾く
    return '？？';
  }
  const pointerOffset = 2 + 2 + 2 + 6;  // IFD関係のポインター値のオフセット値
  // 0th IFDを読み取る
  const zerothIfdPointer = getIntValueLE(view.slice(16, 20));
  const zerothIfdIndex = pointerOffset + zerothIfdPointer;
  const zerothIfdData = getIfdData(view, zerothIfdIndex);
  
  // Exif IFDへのポインターを探す
  const temp = zerothIfdData.filter(tag => tag.id === 34665);
  if (temp.length === 0) {
    return '？？';
  }
  const exifIfdPointer = temp[0].value;
  const exifIfdIndex = pointerOffset + exifIfdPointer;
  const exifIfdData = getIfdData(view, exifIfdIndex);

  // レンズ名へのポインターを探す
  const temp2 = exifIfdData.filter(tag => tag.id === 42036);
  if (temp2.length === 0) {
    return '？？';
  }
  const lensNameLength = temp2[0].count;
  const lensNamePointer = temp2[0].value;
  const lensNameIndex = pointerOffset + lensNamePointer;
  return getAsciiValue(view, lensNameIndex, lensNameLength);
}

const App = () => {
  const [maker, setMaker] = useState('？');
  const [model, setModel] = useState('？');
  const [lensName, setLensName] = useState('？');
  const [shutterSpeed, setShutterSpeed] = useState('？');
  const [fNumber, setFNumber] = useState('？');
  const [isoRate, setIsoRate] = useState('？');

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const files: FileList = e.dataTransfer.files;
    if (files.length >= 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const rawData = reader.result;
        if (rawData !== null && typeof rawData !== 'string') {
          EXIF.getData(file as any, () => {
            const exif: { [key: string]: any } = EXIF.getAllTags(file);
            if ('Make' in exif) {
              setMaker((exif['Make'] as string).replace(/\0/g, ''));
            }
            if ('Model' in exif) {
              setModel((exif['Model'] as string).replace(/\0/g, ''));
            }
            if ('ExposureTime' in exif) {
              const rawShutterSpeed: Number = exif['ExposureTime'];
              if (rawShutterSpeed.valueOf() < 1.0) {
                setShutterSpeed(`1/${Math.round(1.0 / rawShutterSpeed.valueOf())}`);
              } else {
                setShutterSpeed(rawShutterSpeed.toString());
              }
            }
            if ('FNumber' in exif) {
              const rawFNumber: Number = exif['FNumber'];
              setFNumber(rawFNumber.toString());
            }
            if ('ISOSpeedRatings' in exif) {
              setIsoRate(`ISO${exif['ISOSpeedRatings']}`);
            }

            // メーカー毎に分析処理が分岐
            if ('Make' in exif) {
              const rawMaker = (exif['Make'] as string);
              if (rawMaker.includes('OLYMPUS') && 'undefined' in exif) {
                setLensName((exif['undefined'] as string).replace(/\0/g, ''));
              } else if (rawMaker.includes('Panasonic') && 'MakerNote' in exif) {
                setLensName(getLensNameForPanasonic(exif['MakerNote'], rawData));
              } else if (rawMaker.includes('SIGMA') && 'undefined' in exif) {
                setLensName((exif['undefined'] as string).replace(/\0/g, ''));
              } else if (rawMaker.includes('SONY') && 'MakerNote' in exif) {
                setLensName(getLensNameForSONY(rawData));
                console.log(exif);
              }else {
                setLensName('？');
                console.log(exif);
              }
            }
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Container>
      <Row className="my-3">
        <Col>
          <h1 className="text-center">画像内にExifデータを書き込むツール</h1>
        </Col>
      </Row>
      <Row className="my-3">
        <Col sm={4} className="mx-auto">
          <div
            className="border d-flex justify-content-center flex-column align-items-center"
            style={{ width: '100%', height: 150 }}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <span className="d-block"><strong>ここにドラッグ＆ドロップ</strong></span>
          </div>
        </Col>
      </Row>
      <Row className="my-3">
        <Col sm={8} className="mx-auto">
          <Form>
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>メーカー</Form.Label>
                <Form.Control type="text" disabled value={maker} />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>モデル名</Form.Label>
                <Form.Control type="text" disabled value={model} />
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>レンズ名</Form.Label>
                <Form.Control type="text" disabled value={lensName} />
              </Form.Group>
              <Form.Group as={Col} className="col-sm-2">
                <Form.Label>露光時間</Form.Label>
                <Form.Control type="text" disabled value={shutterSpeed} />
              </Form.Group>
              <Form.Group as={Col} className="col-sm-2">
                <Form.Label>F値</Form.Label>
                <Form.Control type="text" disabled value={fNumber} />
              </Form.Group>
              <Form.Group as={Col} className="col-sm-2">
                <Form.Label>ISO感度</Form.Label>
                <Form.Control type="text" disabled value={isoRate} />
              </Form.Group>
            </Form.Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
