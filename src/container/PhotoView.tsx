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
              <div>
                <h3>このアプリの使い方</h3>
                <ol>
                  <li><strong>この領域をクリックして画像を読み込みます</strong></li>
                  <li>すると、Exif情報が解析され、画面右の入力欄が自動で埋まります</li>
                  <li>また、画面右の入力欄は手動でも修正可能です</li>
                  <li>「撮影者名」については、アプリを再起動しても内容が記憶されています</li>
                  <li>撮影者名を表示させたくない場合は、「撮影者名」を空欄にしてください</li>
                  <li>修正後は「画像を再描画」ボタンを押すと、内容が画像表示部分に反映されます</li>
                  <li>表示位置・表示色については、変更すると即座に画面が書き換わります</li>
                  <li><strong>画像表示部分を右クリックして、画像を保存してください</strong></li>
                </ol>
                <h3>注意点</h3>
                <ul>
                  <li>PENTAXの場合は、レンズ名が自動補完されません</li>
                  <li>Nikonの場合は、レンズ名が「焦点距離 f/開放絞り値」と簡易的な補完になります</li>
                  <li>その他、データによっては自動補完が働かないことがあります。ご了承ください</li>
                </ul>
              </div>
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
