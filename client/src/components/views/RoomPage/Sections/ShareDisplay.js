import React, { useState, useRef } from "react";

function ShareDisplay({ localVideoRef, onShare, onChangeLocalStream, pcs }) {
  const [display, setDisplay] = useState(false);
  const videoRef = useRef();

  const onClick = () => {
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
            console.log(videoTrack);
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
  return (
    <div>
      <button onClick={onClick}>화면 공유</button>
      {display && (
        <video ref={videoRef} autoPlay playsInline width="400" height="400" />
      )}
    </div>
  );
}

export default ShareDisplay;
