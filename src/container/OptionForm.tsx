import React from "react";
import { Form } from "react-bootstrap";

const OptionForm: React.FC = () => {
  return (
    <Form>
      <Form.Group>
        <Form.Label htmlFor="maker">メーカー</Form.Label>
        <Form.Control id="maker" />
        <Form.Label htmlFor="model">モデル名</Form.Label>
        <Form.Control id="model" />
        <Form.Label htmlFor="lens_name">レンズ名</Form.Label>
        <Form.Control id="lens_name" />
        <Form.Label htmlFor="exposure_time">露光時間</Form.Label>
        <Form.Control id="exposure_time" />
        <Form.Label htmlFor="f_number">F値</Form.Label>
        <Form.Control id="f_number" />
        <Form.Label htmlFor="iso_rate">ISO感度</Form.Label>
        <Form.Control id="iso_rate" />
      </Form.Group>
      <Form.Group>
        <Form.Label htmlFor="text_position">表示位置</Form.Label>
        <Form.Control id="text_position" />
        <Form.Label htmlFor="text_color">表示色</Form.Label>
        <Form.Control id="text_color" />
      </Form.Group>
    </Form>
  );
}

export default OptionForm;
