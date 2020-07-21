import React, { useContext, FormEvent } from "react";
import { Form, Button } from "react-bootstrap";
import { ApplicationContext } from "service/state";

const OptionForm: React.FC = () => {
  const {
    textPosition,
    textColor,
    cameraMaker,
    cameraModel,
    lensName,
    exposureTime,
    fNumber,
    iSOSpeedRatings,
    userName,
    jpegModeFlg,
    dispatch
  } = useContext(ApplicationContext);

  // テキストの表示位置を変更する
  const onChangeTextPosition = (e: FormEvent<any>) => {
    dispatch({ type: 'setTextPosition', message: e.currentTarget.value });
  };

  // テキストの表示色を変更する
  const onChangeTextColor = (e: FormEvent<any>) => {
    dispatch({ type: 'setTextColor', message: e.currentTarget.value });
  };

  // カメラメーカーを変更する
  const onChangeCameraMaker = (e: FormEvent<any>) => {
    dispatch({ type: 'setCameraMaker', message: e.currentTarget.value });
  };

  // カメラの機種名を変更する
  const onChangeCameraModel = (e: FormEvent<any>) => {
    dispatch({ type: 'setCameraModel', message: e.currentTarget.value });
  };

  // レンズ名を変更する
  const onChangeLensName = (e: FormEvent<any>) => {
    dispatch({ type: 'setLensName', message: e.currentTarget.value });
  };

  // 露光時間を変更する
  const onChangeExposureTime = (e: FormEvent<any>) => {
    dispatch({ type: 'setExposureTime', message: e.currentTarget.value });
  };

  // F値を変更する
  const onChangeFNumber = (e: FormEvent<any>) => {
    dispatch({ type: 'setFNumber', message: e.currentTarget.value });
  };

  // ISO感度を変更する
  const onChangeISOSpeedRatings = (e: FormEvent<any>) => {
    dispatch({ type: 'setISOSpeedRatings', message: e.currentTarget.value });
  };

  // 撮影者名を変更する
  const onChangeUserName = (e: FormEvent<any>) => {
    dispatch({ type: 'setUserName', message: e.currentTarget.value });
  };

  // 画像を更新する
  const onClick = () => {
    dispatch({ type: 'refreshRenderedImage', message: '' });
  };

  // JPEGモードの切り替え
  const onChangeJpegModeFlg = () => {
    dispatch({ type: 'setJpegModeFlg', message: '' });
  };

  return (
    <Form>
      <Form.Group>
        <Form.Label htmlFor="maker">メーカー</Form.Label>
        <Form.Control id="maker" value={cameraMaker} onChange={onChangeCameraMaker} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="model">モデル名</Form.Label>
        <Form.Control id="model" value={cameraModel} onChange={onChangeCameraModel} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="lens_name">レンズ名</Form.Label>
        <Form.Control id="lens_name" value={lensName} onChange={onChangeLensName} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="exposure_time">露光時間</Form.Label>
        <Form.Control id="exposure_time" value={exposureTime} onChange={onChangeExposureTime} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="f_number">F値</Form.Label>
        <Form.Control id="f_number" value={fNumber} onChange={onChangeFNumber} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="iso_speed_ratings">ISO感度</Form.Label>
        <Form.Control id="iso_speed_ratings" value={iSOSpeedRatings} onChange={onChangeISOSpeedRatings} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="user_name">撮影者名</Form.Label>
        <Form.Control id="user_name" value={userName} onChange={onChangeUserName} />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="text_position">表示位置(自動更新)</Form.Label>
        <Form.Control id="text_position" as="select" value={textPosition} onChange={onChangeTextPosition}>
          <option value="lb">左下</option>
          <option value="rb">右下</option>
          <option value="rt">右上</option>
          <option value="lt">左上</option>
          <option value="None">非表示</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="text_color">表示色(自動更新)</Form.Label>
        <Form.Control id="text_color" as="select" value={textColor} onChange={onChangeTextColor}>
          <option value="w">明るい色</option>
          <option value="b">暗い色</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Check label="ツイッター投稿用に変換" id="jpeg_mode_flg" checked={jpegModeFlg} onChange={onChangeJpegModeFlg} />
      </Form.Group>
      <Form.Group>
        <Button size="lg" block onClick={onClick}>画像を再描画</Button>
      </Form.Group>
    </Form>
  );
}

export default OptionForm;
