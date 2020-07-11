import React, { useContext, useRef, FormEvent } from "react";
import { ApplicationContext } from "service/state";
import { Alert } from "react-bootstrap";

const PhotoView: React.FC = () => {
  const { imageSource, loadingFlg, dispatch } = useContext(ApplicationContext);
  const fileRef = useRef<HTMLInputElement>(null);

  // div部分(輪郭線で表示されている部分)をクリックした際の動き
  const onClickDiv = () => {
    fileRef?.current?.click();
  };

  // ファイルが選択された際の動き
  const onChangeInput = (e: FormEvent<HTMLInputElement>) => {
    const files: FileList | null = e.currentTarget.files;
    if (files !== null && files.length >= 1) {
      // ファイルが選択されているので、そのファイルを読み込み情報をdispatchする
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          dispatch({ type: 'setImageSource', message: result });
        }
        dispatch({type: 'setLoadingFalse', message: ''});
      };
      dispatch({type: 'setLoadingTrue', message: ''});
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      {
        loadingFlg ? <Alert variant='primary'>処理中……</Alert> : <></>
      }
      <input type="file" className="d-none" ref={fileRef} onChange={onChangeInput} />
      {
        imageSource === ''
          ? (
            <div
              className="border d-flex justify-content-center flex-column align-items-center h-100"
              onClick={onClickDiv}
            >
              <strong className="d-block">
                クリックしてファイルを読み込み
              </strong>
            </div>
          )
          : (
            <div
              className="border d-flex justify-content-center flex-column align-items-center"
              onClick={onClickDiv}
            >
              <img src={imageSource} width="100%" height="auto" alt="実行結果" />
            </div>
          )
      }
    </>
  );
};

export default PhotoView;
