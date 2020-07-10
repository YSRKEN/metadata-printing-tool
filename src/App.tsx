import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import 'App.css';
import EXIF from 'exif-js';

const App = () => {
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
      console.log(`ファイル名：${file.name}`);
      console.log(`ファイルタイプ：${file.type}`);
      console.log(`ファイルサイズ(B)：${file.size}`);
      EXIF.getData(file as any, () => {
          const exitData = EXIF.pretty(file);
          console.log(exitData);
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
        <Col className="col-4 offset-4">
          <div
            className="border d-flex justify-content-center flex-column align-items-center"
            style={{width: '100%', height: 150}}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <span className="d-block"><strong>ここにドラッグ＆ドロップ</strong></span>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
