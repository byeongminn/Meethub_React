import React, { useState, useRef } from "react";
import './ShareDisplay.css'
import videoCamera from './../img/squares.png'
import mic from "../img/mic.png";
import {Modal} from "antd";
import {ExclamationCircleOutlined} from "@ant-design/icons";

const { confirm } = Modal;

function ShareDisplay({ localVideoRef, onShare, onChangeLocalStream, pcs }) {
  const [display, setDisplay] = useState(false);
  const videoRef = useRef();

  const onClick = () => {
    console.log("!23");
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then(function (audioStream) {
        //오디오 스트림을 얻어냄
        navigator.mediaDevices
          .getDisplayMedia({
            audio: true,
            video: true,
          })
          .then(function (screenStream) {
            //스크린 공유 스트림을 얻어내고 여기에 오디오 스트림을 결합함
            screenStream.addTrack(audioStream.getAudioTracks()[0]);
            setDisplay(true);
            videoRef.current.srcObject = screenStream;
            localVideoRef.current.srcObject = screenStream;

            let videoTrack = screenStream.getVideoTracks()[0];
            Object.keys(pcs).forEach((key) => {
              var sender = pcs[key].getSenders().find(function (s) {
                return s.track.kind === videoTrack.kind;
              });
              console.log("found sender:", sender);
              sender.replaceTrack(videoTrack);
              onChangeLocalStream(screenStream);
            });
            onShare();
          })
          .catch(function (e) {
            //error;
          });
      })
      .catch(function (e) {
        //error;
      });
  };
  // https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture

  const onShareCam = () => {
    //내 비디오에 대한 정보를 가져온다.
    console.log("123")
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: 240,
          height: 240,
        },
      })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        let videoTrack = stream.getVideoTracks()[0];
        Object.keys(pcs).forEach((key) => {
          var sender = pcs[key].getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
          });
          console.log("found sender:", sender);
          sender.replaceTrack(videoTrack);
          onChangeLocalStream(stream);
        });
        onShare();
      })
      .catch((error) => {
        console.log(`getUserMedia error: ${error}`);
      });
  };

  const showConfirm = () => {
    confirm({
      title: '공유하고 싶은 옵션을 고르세요.',
      icon: <ExclamationCircleOutlined />,
      // content: '삭제시 해당 질문이 질문 목록에서 삭제됩니다.',
      okText: '화면 공유',
      okType: 'danger',
      cancelText: '캠화면 공유',
      onOk() {
        onClick();
      },
      onCancel(){
        onShareCam();
      }
    })
  }

  return (
    <div style={{position:"relative"}}>
      <div className="displayShareBtn">
        <button onClick={showConfirm}><img src={ videoCamera} /></button>
      </div>
      <div id="displayShare" className="displayShare">
        <button onClick={onClick}>화면 공유</button>
        <button onClick={onShareCam}>캠화면 공유</button>
        {display && (
          <video ref={videoRef} autoPlay playsInline width="400" height="400" />
        )}
      </div>
    </div>
  );
}

export default ShareDisplay;
