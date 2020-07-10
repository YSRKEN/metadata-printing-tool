import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import 'App.css';
import EXIF from 'exif-js';

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
      EXIF.getData(file as any, () => {
        const exif: {[key: string]: any} = EXIF.getAllTags(file);
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
          if (rawMaker.includes('OLYMPUS')) {
            setLensName((exif['undefined'] as string).replace(/\0/g, ''));
          } else {
            setLensName('？');
            console.log(exif);
          }
        }
      });
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
