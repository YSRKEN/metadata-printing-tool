import React, { useContext, FormEvent } from "react";
import { Form } from "react-bootstrap";
import { ApplicationContext } from "service/state";

const OptionForm: React.FC = () => {
  const { textPosition, textColor, dispatch } = useContext(ApplicationContext);

  // テキストの表示位置を変更する
  const onChangeTextPosition = (e: FormEvent<any>) => {
    dispatch({type: 'setTextPosition', message: e.currentTarget.value});
  };

  // テキストの表示色を変更する
  const onChangeTextColor = (e: FormEvent<any>) => {
    dispatch({type: 'setTextColor', message: e.currentTarget.value});
  };

  return (
    <Form>
      <Form.Group>
        <Form.Label htmlFor="maker">メーカー</Form.Label>
        <Form.Control id="maker" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="model">モデル名</Form.Label>
        <Form.Control id="model" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="lens_name">レンズ名</Form.Label>
        <Form.Control id="lens_name" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="exposure_time">露光時間</Form.Label>
        <Form.Control id="exposure_time" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="f_number">F値</Form.Label>
        <Form.Control id="f_number" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="iso_rate">ISO感度</Form.Label>
        <Form.Control id="iso_rate" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="text_position">表示位置</Form.Label>
        <Form.Control id="text_position" as="select" value={textPosition} onChange={onChangeTextPosition}>
          <option value="lb">左下</option>
          <option value="rb">右下</option>
          <option value="rt">右上</option>
          <option value="lt">左上</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="text_color">表示色</Form.Label>
        <Form.Control id="text_color" as="select" value={textColor} onChange={onChangeTextColor}>
          <option value="w">明るい色</option>
          <option value="b">暗い色</option>
        </Form.Control>
      </Form.Group>
    </Form>
  );
}

export default OptionForm;
