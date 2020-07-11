import React, { useState, useRef, useEffect, FormEvent } from 'react';
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

// 指定した配列について、先頭4バイトをINT型と仮定して読み取る
const getIntValue = (arr1: Uint8Array, endian: string) => {
  if (endian === 'LE') {
    return arr1[3] * 16777216 + arr1[2] * 65536 + arr1[1] * 256 + arr1[0];
  } else {
    return arr1[0] * 16777216 + arr1[1] * 65536 + arr1[2] * 256 + arr1[3];
  }
};

// 指定した配列について、先頭2バイトをSHORT型と仮定して読み取る
const getShortValue = (arr1: Uint8Array, endian: string) => {
  if (endian === 'LE') {
    return arr1[1] * 256 + arr1[0];
  } else {
    return arr1[0] * 256 + arr1[1];
  }
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

const getIfdData = (arr1: Uint8Array, startIndex: number, endian: string = 'LE') => {
  const ifdCount = getShortValue(arr1.slice(startIndex, startIndex + 2), endian);
  const output: IFD[] = [];
  for (let i = 0; i < ifdCount; i += 1) {
    const p = startIndex + 2 + 12 * i;
    output.push({
      id: getShortValue(arr1.slice(p, p + 2), endian),
      type: getShortValue(arr1.slice(p + 2, p + 4), endian),
      count: getIntValue(arr1.slice(p + 4, p + 8), endian),
      value: getIntValue(arr1.slice(p + 8, p + 12), endian)
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

const getLensNameForCanon = (rawData: ArrayBuffer) => {
  const view = new Uint8Array(rawData);
  if (!compareArray(view.slice(0, 2), [0xFF, 0xD8])) {
    // JPEGデータではないと推定されるので弾く
    return '？？';
  }

  // APP1を検索する
  let p = 2;
  let flg = false;
  while (p + 2 <= view.length) {
    if (view[p] !== 0xFF) {
      // マーカーではないので飛ばす
      break;
    }
    if (view[p + 1] === 0xE1) {
      // APP1を発見したのでループを抜ける
      flg = true;
      break;
    }
    const segmentSize = getShortValue(view.slice(p + 2, p + 4), 'BE');
    p += segmentSize + 2;
  }
  if (!flg) {
    return '？？';
  }

  // APP1の中身がExifかを確認する
  if (!compareArrayString(view.slice(p + 4, p + 8), 'Exif')) {
    // Exifフォーマットではないと推定されるので弾く
    return '？？';
  }

  // エンディアンを確認しておく
  const temp = view.slice(p + 10, p + 12);
  let endian = 'LE';
  if (compareArray(temp, [0x49, 0x49])) {
    endian = 'LE';
  } else if (compareArray(temp, [0x4D, 0x4D])) {
    endian = 'BE';
  } else {
    return '？？';
  }

  // 0th IFDを読み取る
  const zerothIfdPointer = getIntValue(view.slice(p + 14, p + 20), endian);
  const zerothIfdIndex = p + 2 + 6 + 2 + zerothIfdPointer;
  const zerothIfdData = getIfdData(view, zerothIfdIndex, endian);

  // レンズ名へのポインターを探す
  const temp2 = zerothIfdData.filter(tag => tag.id === 42036);
  if (temp2.length === 0) {
    return '？？';
  }
  const lensNameLength = temp2[0].count;
  const lensNamePointer = temp2[0].value;
  const lensNameIndex = p + 2 + 6 + 2 + lensNamePointer;
  return getAsciiValue(view, lensNameIndex, lensNameLength);
}


const App = () => {
  const [maker, setMaker] = useState('？');
  const [model, setModel] = useState('？');
  const [lensName, setLensName] = useState('？');
  const [shutterSpeed, setShutterSpeed] = useState('？');
  const [fNumber, setFNumber] = useState('？');
  const [isoRate, setIsoRate] = useState('？');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [loadingFlg, setLoadingFlg] = useState(false);
  const [textPosition, setTextPosition] = useState('lb');
  const [textColor, setTextColor] = useState('w');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageUrl === null || imageUrl === '') {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      return;
    }
    const img = new Image();
    img.src = imageUrl;
    img.onload = function () {
      // 保存用の画像データを作成する
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const fontSize = img.height / 72;
      if (textColor === 'w') {
        ctx.fillStyle = `rgb(186,192,178)`;
      } else {
        ctx.fillStyle = `rgb(69,63,77)`;
      }
      ctx.font = `${fontSize}px sans-serif`;
      const insertedText = `${maker} ${model}, ${lensName}, ${shutterSpeed}, F${fNumber}, ${isoRate}`;
      const rect = ctx.measureText(insertedText);
      switch (textPosition) {
        case 'lb':
          ctx.fillText(insertedText, fontSize, img.height - fontSize);
          break;
        case 'rb':
          ctx.fillText(insertedText, img.width - fontSize - rect.width, img.height - fontSize);
          break;
        case 'rt':
          ctx.fillText(insertedText, img.width - fontSize - rect.width, fontSize * 2);
          break;
        case 'lt':
          ctx.fillText(insertedText, fontSize, fontSize * 2);
          break;
      }
      setImageSrc(canvas.toDataURL());
      setLoadingFlg(false);
    };
  }, [imageUrl, maker, model, lensName, shutterSpeed, fNumber, isoRate, textPosition, textColor]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (loadingFlg) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (loadingFlg) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const files: FileList = e.dataTransfer.files;
    if (files.length >= 1) {
      setLoadingFlg(true);
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
              } else if (rawMaker.includes('SONY')) {
                setLensName(getLensNameForSONY(rawData));
                console.log(exif);
              } else if (rawMaker.includes('Canon')) {
                setLensName(getLensNameForCanon(rawData));
                console.log(exif);
              } else {
                setLensName('？');
                console.log(exif);
              }
            }
          });
        }
      };
      reader.readAsArrayBuffer(file);

      const reader2 = new FileReader();
      reader2.onload = () => {
        setImageUrl(reader2.result as string);
      };
      reader2.readAsDataURL(file);
    }
  };

  return (
    <Container>
      <Row className="my-3">
        <Col>
          <h1 className="text-center">フォトヨドバシごっこ</h1>
        </Col>
      </Row>
      <Row className="my-3">
        <Col sm={4} className="mx-auto">
          <div
            className={"border d-flex justify-content-center flex-column align-items-center " + (loadingFlg ? 'bg-warning' : '')}
            style={{ width: '100%', height: 150 }}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <span className="d-block "><strong>
              {loadingFlg ? '読み込み中...' : 'ここにドラッグ＆ドロップ'}
            </strong></span>
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
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>表示位置</Form.Label>
                <Form.Control as="select" value={textPosition}
                  onChange={(e: FormEvent<any>) => setTextPosition(e.currentTarget.value)}>
                  <option value="lb">左下</option>
                  <option value="rb">右下</option>
                  <option value="rt">右上</option>
                  <option value="lt">左上</option>
                </Form.Control>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>表示色</Form.Label>
                <Form.Control as="select" value={textColor}
                  onChange={(e: FormEvent<any>) => setTextColor(e.currentTarget.value)}>
                  <option value="w">明るい色</option>
                  <option value="b">暗い色</option>
                </Form.Control>
              </Form.Group>
            </Form.Row>
          </Form>
        </Col>
      </Row>
      <Row className="my-3">
        <Col sm={8} className="mx-auto text-center">
          <canvas ref={canvasRef} className="d-none" />
          <img src={imageSrc} width={500} className={imageSrc === '' ? 'd-none' : ''} height="auto" alt="変換後のイメージ" />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
