import React, { useContext, useRef, FormEvent } from "react";
import { ApplicationContext } from "service/state";

const PhotoViewImage: React.FC = () => {
  const { imageSource } = useContext(ApplicationContext);

  if (imageSource === '') {
    return (
      <strong className="d-block">
        クリックしてファイルを読み込み……
      </strong>
    );
  } else {
    return (
      <img src={imageSource} width="100%" height="100%" alt="実行結果" />
    );
  }
};

const PhotoView: React.FC = () => {
  const { dispatch } = useContext(ApplicationContext);
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
          dispatch({type: 'setImageSource', message: result});
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <input type="file" className="d-none" ref={fileRef} onChange={onChangeInput} />
      <div
        className="border d-flex justify-content-center flex-column align-items-center h-100"
        onClick={onClickDiv}
      >
        <PhotoViewImage />
      </div>
    </>
  );
};

export default PhotoView;
