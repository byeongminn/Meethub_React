import React, { useState, useEffect, useRef } from "react";
import Question from "./Modals/Question";
import { io } from "socket.io-client";
import axios from "axios";
import Video from "../../Video/Video";

function RoomPage(props) {
  const [user, setUser] = useState({});
  const [test, setTest] = useState("");
  const videoRef = useRef(null);
  const peerFaceRef = useRef(null);
  const selectRef = useRef(null);
  const muteBtn = useRef(null);
  const cameraBtn = useRef(null);
  const questionBtn = useRef(null);

  //================================================

  const [socket, setSocket] = useState();
  const [users, setUsers] = useState([]);

  let localVideoRef = useRef(null);

  let pcs;

  const pc_config = {
    iceServers: [
      // {
      //   urls: 'stun:[STUN_IP]:[PORT]',
      //   'credentials': '[YOR CREDENTIALS]',
      //   'username': '[USERNAME]'
      // },
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  //================================================

  const [openQuestion, setOpenQuestion] = useState(false);

  const handleOpen = () => {
    setOpenQuestion(true);
  };

  const handleClose = () => {
    setOpenQuestion(false);
  };

  const roomName = props.match.params.roomName;
  let myStream;
  let muted = false;
  let cameraOff = false;
  let myPeerConnection;
  let myDataChannel;

  let newSocket;

  useEffect(() => {
    getMy();
    //       {_id: '611ec3e37e3afa081c5b5c71', isAdmin: false, isAuth: true, email: 'sh2@naver.com', name: '성현2', …}
    // email: "sh2@naver.com"
    // isAdmin: false
    // isAuth: true
    // name: "성현2"
    // role: 0

    console.log(props.user);

    newSocket = io.connect("http://localhost:5000");
    let localStream;

    newSocket.on("all_users", (allUsers) => {
      let len = allUsers.length;

      for (let i = 0; i < len; i++) {
        createPeerConnection(
          allUsers[i].id,
          allUsers[i].email,
          newSocket,
          localStream
        );
        let pc = pcs[allUsers[i].id];
        if (pc) {
          pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
            .then((sdp) => {
              console.log("create offer success");
              pc.setLocalDescription(new RTCSessionDescription(sdp));
              newSocket.emit("offer", {
                sdp: sdp,
                offerSendID: newSocket.id,
                offerSendEmail: user.email,
                offerReceiveID: allUsers[i].id,
              });
            })
            .catch((error) => {
              console.log(error);
            });
        }
      }
    });

    newSocket.on("getOffer", (data) => {
      console.log("get offer");
      createPeerConnection(
        data.offerSendID,
        data.offerSendEmail,
        newSocket,
        localStream
      );
      let pc = pcs[data.offerSendID];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
          () => {
            console.log("answer set remote description success");
            pc.createAnswer({
              offerToReceiveVideo: true,
              offerToReceiveAudio: true,
            })
              .then((sdp) => {
                console.log("create answer success");
                pc.setLocalDescription(new RTCSessionDescription(sdp));
                newSocket.emit("answer", {
                  sdp: sdp,
                  answerSendID: newSocket.id,
                  answerReceiveID: data.offerSendID,
                });
              })
              .catch((error) => {
                console.log(error);
              });
          }
        );
      }
    });

    newSocket.on("getAnswer", (data) => {
      console.log("get answer");
      let pc = pcs[data.answerSendID];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
      //console.log(sdp);
    });

    newSocket.on("getCandidate", (data) => {
      console.log("get candidate");
      let pc = pcs[data.candidateSendID];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).then(() => {
          console.log("candidate add success");
        });
      }
    });

    newSocket.on("user_exit", (data) => {
      pcs[data.id].close();
      console.log(data.id);
      delete pcs[data.id];
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id));
    });

    setSocket(newSocket);

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: 240,
          height: 240,
        },
      })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        localStream = stream;

        newSocket.emit("join_room", {
          room: roomName,
          email: user.email,
        });
      })
      .catch((error) => {
        console.log(`getUserMedia error: ${error}`);
      });

    async function getMy() {
      await axios
        .get("/api/users/auth")
        .then((response) => setUser(response.data));
    }
  }, []);

  if (user.isAuth) {
    //if (user.role === 1) questionBtn.current.hidden = true;

    // const socket = io("http://localhost:5000");
    // socket.emit("join_room", roomName, user.name);

    console.log(`${roomName}방에 입장하셨습니다.`);
    let body = {
      roomName: roomName,
      email: user.email,
    };
    axios.post("/api/rooms/make", body).then((response) => {
      console.log(response);
    }); //방을 DB에 생성

    // async function getCameras() {
    //   try {
    //     const devices = await navigator.mediaDevices.enumerateDevices();
    //     const cameras = devices.filter(
    //       (device) => device.kind === "videoinput"
    //     );
    //     const currentCamera = myStream.getVideoTracks()[0];
    //     cameras.forEach((camera) => {
    //       const option = document.createElement("option");
    //       option.value = camera.deviceId;
    //       option.innerText = camera.label;
    //       if (currentCamera.label === camera.label) {
    //         option.selected = true;
    //       }
    //       selectRef.current.appendChild(option);
    //     });
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }

    // async function getMedia(deviceId) {
    //   const initialConstrains = {
    //     audio: true,
    //     video: { facingMode: "user" },
    //   };
    //   const cameraConstrains = {
    //     audio: true,
    //     video: { deviceId: { exact: deviceId } },
    //   };
    //   try {
    //     myStream = await navigator.mediaDevices.getUserMedia(
    //       deviceId ? cameraConstrains : initialConstrains
    //     );
    //     videoRef.current.srcObject = myStream;
    //     if (!deviceId) {
    //       await getCameras();
    //     }
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }

    // async function initCall() {
    //   await getMedia();
    //   makeConnection(); //연결을 시작해주는 함수
    // }

    // initCall();

    // Socket Code
  }

  const createPeerConnection = (socketID, email, newSocket, localStream) => {
    let pc = new RTCPeerConnection(pc_config);

    // add pc to peerConnections object
    pcs = { ...pcs, [socketID]: pc };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("onicecandidate");
        newSocket.emit("candidate", {
          candidate: e.candidate,
          candidateSendID: newSocket.id,
          candidateReceiveID: socketID,
        });
      }
    };

    pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    pc.ontrack = (e) => {
      console.log("ontrack success");
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== socketID));
      setUsers((oldUsers) => [
        ...oldUsers,
        {
          id: socketID,
          email: email,
          stream: e.streams[0],
        },
      ]);
    };

    if (localStream) {
      console.log("localstream add");
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    } else {
      console.log("no local stream");
    }

    // return pc
    return pc;
  };

  //     socket.on("welcome", async (userName) => {
  //       console.log(`${roomName}방에 ${userName}님이 입장하셨습니다.`);
  //       // myDataChannel = myPeerConnection.createDataChannel("chat");
  //       // myDataChannel.addEventListener("message", console.log)
  //       //다른 피어들은 데이터 채널을 만들 필요없이 EventListener를 만들면 된다.

  //       const offer = await myPeerConnection.createOffer();
  //       myPeerConnection.setLocalDescription(offer);
  //       //   socket.emit("offer", offer, roomName);
  //     }); // Peer A

  //     socket.on("all_users", async (allUsers) => {
  //       let len = allUsers.length; //나를 제외한 유저의 수
  //       console.log(len);
  //       for (let i = 0; i < len; i++) {
  //         pcs[allUsers.id].offer = await myPeerConnection.createOffer();
  //         const offer = await myPeerConnection.createOffer();
  //         console.log(offer);
  //         myPeerConnection.setLocalDescription(offer);
  //         console.log(myPeerConnection);
  //         socket.emit("offer", offer, roomName, socket.id, allUsers.id);
  //       }
  //     });

  //     socket.on("offer", async (offer, sendId, receiveId) => {
  //       // myPeerConnection.addEventListener("datachannel", (event) => {
  //       // myDataChannel = event.channel;
  //       // myDataChannel.addEventListener("message", console.log)
  //       //     })
  //       myPeerConnection.setRemoteDescription(offer);
  //       const answer = await myPeerConnection.createAnswer();
  //       myPeerConnection.setLocalDescription(answer);
  //       socket.emit("answer", answer, roomName, sendId, receiveId);
  //     }); // Peer B

  //     socket.on("answer", (answer, sendId, receiveId) => {
  //       myPeerConnection.setRemoteDescription(answer);
  //     });

  //     socket.on("ice", (ice) => {
  //       myPeerConnection.addIceCandidate(ice);
  //     });

  //     function makeConnection() {
  //       myPeerConnection = new RTCPeerConnection({
  //         iceServers: [
  //           {
  //             urls: [
  //               "stun:stun.l.google.com:19302",
  //               "stun:stun1.l.google.com:19302",
  //               "stun:stun2.l.google.com:19302",
  //               "stun:stun3.l.google.com:19302",
  //               "stun:stun4.l.google.com:19302",
  //             ],
  //           },
  //         ],
  //       });
  //       myPeerConnection.addEventListener("icecandidate", handleIce);
  //       myPeerConnection.addEventListener("addstream", handleAddStream);
  //       myStream
  //         .getTracks()
  //         .forEach((track) => myPeerConnection.addTrack(track, myStream));
  //     }

  //     function handleIce(data) {
  //       socket.emit("ice", data.candidate, roomName);
  //     }

  //     function handleAddStream(data) {
  //       peerFaceRef.current.srcObject = data.stream;
  //     }
  //   }

  //   const onChange = (event) => {
  //     setTest(event.target.value);
  //   };

  //   const handleMuteClick = () => {
  //     myStream
  //       .getAudioTracks()
  //       .forEach((track) => (track.enabled = !track.enabled));
  //     if (muted) {
  //       muteBtn.current.innerText = "Mute";
  //       muted = false;
  //     } else {
  //       muteBtn.current.innerText = "Unmute";
  //       muted = true;
  //     }
  //   };
  //   const handleCameraClick = () => {
  //     myStream
  //       .getVideoTracks()
  //       .forEach((track) => (track.enabled = !track.enabled));
  //     if (cameraOff) {
  //       cameraBtn.current.innerText = "Turn Camera Off";
  //       cameraOff = false;
  //     } else {
  //       cameraBtn.current.innerText = "Turn Camera On";
  //       cameraOff = true;
  //     }
  //   };

  function cameraTurn(targetId) {
    pcs[targetId].close();
    delete pcs[targetId];
    setUsers((oldUsers) => oldUsers.filter((user) => user.id !== targetId));
  }
  //user.id 이용하면 될거같음
  return (
    <div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={localVideoRef}
        autoPlay
      ></video>
      {users.map((user, index) => {
        return (
          <div>
            <Video key={index} email={user.email} stream={user.stream} />
            {console.log(user)}
            <button onClick={() => cameraTurn(user.id)}>화상연결해제</button>
          </div>
        );
      })}
    </div>
  );
}

export default RoomPage;

/* <div>
<div className="myCameraBox">
  <video
    ref={videoRef}
    autoPlay
    playsInline
    width="400"
    height="400"
  ></video>
  <select ref={selectRef}></select>
  <button ref={muteBtn} onClick={handleMuteClick}>
    Mute
  </button>
  <button ref={cameraBtn} onClick={handleCameraClick}>
    Turn Camera Off
  </button>
  <button ref={questionBtn} onClick={handleOpen}>
    Question
  </button>
</div>
<button onClick={() => console.log("앙")}>눌러보세요</button>
<input onChange={onChange} value={test} />

<div className="peerCameraBox">
  <video
    ref={peerFaceRef}
    autoPlay
    playsInline
    width="400"
    height="400"
  ></video>
</div>
</div> */
