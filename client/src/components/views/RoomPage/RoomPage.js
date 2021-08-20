import React, { useState, useEffect, useRef } from 'react';
import Question from './Modals/Question'
import { io } from "socket.io-client";
import axios from 'axios';

function RoomPage(props) {
    const [user, setUser] = useState({});
    const [test, setTest] = useState('');
    const videoRef = useRef(null);
    const peerFaceRef = useRef(null);
    const selectRef = useRef(null);
    const muteBtn = useRef(null);
    const cameraBtn = useRef(null);
    const questionBtn = useRef(null);

    const [openQuestion, setOpenQuestion] = useState(false);

    const handleOpen = () => {
        setOpenQuestion(true);
    }

    const handleClose = () => {
        setOpenQuestion(false);
    }

    const roomName = props.match.params.roomName;
    let myStream;
    let muted = false;
    let cameraOff = false;
    let myPeerConnection;
    let myDataChannel;

    useEffect(() => {
        axios.get("/api/users/auth")
            .then(response => setUser(response.data));
    }, [])

    // localStorage : 새로고침 시를 위한 작업해야함.

    const socket = io("http://localhost:5000");

    if (user.isAuth) {
        if (user.role === 1) questionBtn.current.hidden = true;
        const socket = io("http://localhost:5000");
        socket.emit("join_room", roomName, user.name);
        console.log(`${roomName}방에 입장하셨습니다.`);
        let body = {
            roomName: roomName,
            email: user.email
        }
        axios.post("/api/rooms/make", body)
            .then(response => {
                console.log(response);
            });//방을 DB에 생성

        async function getCameras() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter((device) => device.kind === "videoinput");
                const currentCamera = myStream.getVideoTracks()[0];
                cameras.forEach((camera) => {
                    const option = document.createElement("option");
                    option.value = camera.deviceId;
                    option.innerText = camera.label;
                    if (currentCamera.label === camera.label) {
                        option.selected = true;
                    }
                    selectRef.current.appendChild(option);
                })
            } catch (e) {
                console.log(e);
            }
        }

        async function getMedia(deviceId) {
            const initialConstrains = {
                audio: true,
                video: false
            };
            const cameraConstrains = {
                audio: true,
                video: false
            };
            try {
                myStream = await navigator.mediaDevices.getUserMedia(
                    deviceId ? cameraConstrains : initialConstrains
                );
                videoRef.current.srcObject = myStream;
                if (!deviceId) {
                    await getCameras();
                }
            } catch (e) {
                console.log(e);
            }
        }

        const initCall = async () => {
            await getMedia();
            makeConnection();//연결을 시작해주는 함수
        }

        initCall();

        // Socket Code

        socket.on("welcome", async (userName) => {
            console.log(`${roomName}방에 ${userName}님이 입장하셨습니다.`);
            // myDataChannel = myPeerConnection.createDataChannel("chat");
            // myDataChannel.addEventListener("message", console.log)
            //다른 피어들은 데이터 채널을 만들 필요없이 EventListener를 만들면 된다.
            const offer = await myPeerConnection.createOffer();
            myPeerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, roomName);
        })  // Peer A

        socket.on("offer", async (offer) => {
            // myPeerConnection.addEventListener("datachannel", (event) => {
            // myDataChannel = event.channel;
            // myDataChannel.addEventListener("message", console.log)
            //     })
            myPeerConnection.setRemoteDescription(offer);
            const answer = await myPeerConnection.createAnswer();
            myPeerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, roomName);
        })  // Peer B

        socket.on("answer", (answer) => {
            myPeerConnection.setRemoteDescription(answer);
        })

        socket.on("ice", (ice) => {
            myPeerConnection.addIceCandidate(ice);
        })

        const makeConnection = () => {
            myPeerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302",
                            "stun:stun3.l.google.com:19302",
                            "stun:stun4.l.google.com:19302",
                        ],
                    },
                ],
            });
            myPeerConnection.addEventListener("icecandidate", handleIce);
            myPeerConnection.addEventListener("addstream", handleAddStream);
            myStream
                .getTracks()
                .forEach((track) => myPeerConnection.addTrack(track, myStream));
        }

        const handleIce = (data) => {
            socket.emit("ice", data.candidate, roomName);
        }

        const handleAddStream = (data) => {
            peerFaceRef.current.srcObject = data.stream;
        }

    }

    const onChange = (event) => {
        setTest(event.target.value);
    }

    const handleMuteClick = () => {
        myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
        if (muted) {
            muteBtn.current.innerText = "Mute";
            muted = false;
        } else {
            muteBtn.current.innerText = "Unmute";
            muted = true;
        }
    }
    const handleCameraClick = () => {
        myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
        if (cameraOff) {
            cameraBtn.current.innerText = "Turn Camera Off";
            cameraOff = false;
        } else {
            cameraBtn.current.innerText = "Turn Camera On";
            cameraOff = true;
        }
    }

    return (
        <div>
            <div className="myCameraBox">
                <video ref={videoRef} autoPlay playsInline width="400" height="400"></video>
                <select ref={selectRef}></select>
                <button ref={muteBtn} onClick={handleMuteClick}>Mute</button>
                <button ref={cameraBtn} onClick={handleCameraClick}>Turn Camera Off</button>
                <button ref={questionBtn} onClick={handleOpen}>Question</button>
            </div>
            <button onClick={() => console.log("앙")}>눌러보세요</button>
            <input onChange={onChange} value={test} />

            <div className="peerCameraBox">
                <video ref={peerFaceRef} autoPlay playsInline width="400" height="400"></video>
            </div>
        </div>
    )
}

export default RoomPage
