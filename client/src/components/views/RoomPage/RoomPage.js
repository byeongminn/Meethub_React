import { message, Tabs } from "antd";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Attend from './Sections/Attend';
import ChatList from './Sections/ChatList';
import ParticipantList from './Sections/ParticipantList';
import QuestionList from './Sections/QuestionList';
import ShareDisplay from './Sections/ShareDisplay';
import VoteList from './Sections/VoteList';
import effectSound from './Sections/effectSound';
import ES from './audios/ES.mp3';
import ES2 from './audios/ES2.mp3';
import Video from './Sections/Video';
import * as faceApi from "face-api.js";
import './RoomPage.css'


// imgs
import call from './img/call.png'
import conversation from './img/conversation.png'
import menu from './img/menu.png'
import settings from './img/settings.png'
import user from './img/user.png'
import videoCamera from './img/video-camera.png'
import votingBox from './img/voting-box.png'
import mic from './img/mic.png'
import warningSign from './img/warning-sign.png'


const { TabPane } = Tabs;

function RoomPage(props) {
    const user = props.user;
    const roomId = props.match.params.roomId;
    const [room, setRoom] = useState({});
    const [isShare, SetisShare] = useState(false);

    const variables = {
        roomId
    }

    const mtcnnForwardParams = {
        minFaceSize: 80
    }
    var results = [];

    const es = effectSound(ES, 1);
    const es2 = effectSound(ES2, 1);
    const [users, setUsers] = useState([]);

    let localVideoRef = useRef(null);
    let myCameraOn = useRef(true);

    let pcs;
    const [pcsState, setPcsState] = useState({});
    const currLocalStream = useRef(null);
    const pc_config = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    };
    const canvasRef = useRef(null);
    const isMute = useRef(false);

    const [socket, setSocket] = useState({});
    useEffect(() => {
        axios.post('/api/rooms/getRoom', variables)
            .then(response => {
                if (response.data.success) {
                    setRoom(response.data.room);
                } else {
                    message.error('방에 대한 정보를 받아오는데 실패했습니다.');
                    setTimeout(() => {
                        props.history.push('/');
                    }, 3000)
                }
            })
        //const canvas1 = canvasRef.current;
        const canvas1 = document.createElement("canvas");
        canvas1.width=240
        canvas1.height=240
        const newSocket = io.connect("http://localhost:5000");
        setSocket(newSocket);
        let localStream = document.createElement("video");
        faceApi.loadMtcnnModel('/models')
        faceApi.loadFaceRecognitionModel('/models')

        //방에 입장했을 경우. 같은 방에 있는 유저들의 정보를 가져온다.





        //방에 입장했을 경우. 같은 방에 있는 유저들의 정보를 가져온다.
        newSocket.on("all_users", (allUsers) => {
            let len = allUsers.length;

            //각각의 유저에대한 소켓연결을 만드는 부분.
            for (let i = 0; i < len; i++) {
                if (currLocalStream.current) {
                    createPeerConnection(
                        allUsers[i].socketId,
                        allUsers[i].user.email,
                        newSocket,
                        currLocalStream.current
                    );
                } else {
                    createPeerConnection(
                        allUsers[i].socketId,
                        allUsers[i].user.email,
                        newSocket,
                        localStream
                    );
                }

                //연결을 만들고 각 유저에 대해서 offer와 answer를 주고 받아서
                // 소켓연결을 완성한다 (유저의 길이 만큼 반복문을 돌면서 각각 모두 연결 - Peer to Peer )
                let pc = pcs[allUsers[i].socketId];
                if (pc) {
                    pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                    })
                        .then((sdp) => {
                            pc.setLocalDescription(new RTCSessionDescription(sdp));
                            newSocket.emit("offer", {
                                sdp: sdp,
                                offerSendID: newSocket.id,
                                offerSendEmail: props.location.user.email,
                                offerReceiveID: allUsers[i].socketId,
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            }
        });

        //들어온 유저에게 offer를 받아서 연결을 이어가는 부분.
        newSocket.on("getOffer", (data) => {
            if (currLocalStream.current) {
                createPeerConnection(
                    data.offerSendID,
                    data.offerSendEmail,
                    newSocket,
                    currLocalStream.current
                );
            } else {
                createPeerConnection(
                    data.offerSendID,
                    data.offerSendEmail,
                    newSocket,
                    localStream
                );
            }

            let pc = pcs[data.offerSendID];
            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
                    () => {
                        pc.createAnswer({
                            offerToReceiveVideo: true,
                            offerToReceiveAudio: true,
                        })
                            .then((sdp) => {
                                //sdp는 연결하고자 하는 peer간의 미디어와 네트워크 정보를 이해하기위해 사용.
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
            let pc = pcs[data.answerSendID];
            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            }
        });

        newSocket.on("getCandidate", (data) => {
            let pc = pcs[data.candidateSendID];
            if (pc) {
                pc.addIceCandidate(new RTCIceCandidate(data.candidate)).then(() => { });
            }
        });

        newSocket.on("user_exit", (data) => {
            pcs[data.id].close();
            delete pcs[data.id];
            setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id));
            //유저가 나가면 연결을 끊고 현재방에대한 유저를 담고있는
            //Users도 새롭게 갱신해준다.
        });

        newSocket.on("warning_message", (data) => {
            console.log(data);
            message.info(`카메라,마이크켜세요`);
            es2.play();
        })


        //내 비디오에 대한 정보를 가져온다.
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video:
                {
                    width: 240,
                    height: 240,
                },
            })
            .then((stream) => {
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                let localVideo = document.createElement("video")
                localVideo.srcObject = stream;
                localVideo.autoplay = true;
                localStream = stream;
                if (localVideo.autoplay == true) {
                    localVideo.addEventListener('playing', () => {
                        let image = new Image()
                        image.src = "/img/sunglasses.png"
                        //const canvas=faceApi.createCanvasFromMedia(localVideo)
                        //const ctx = canvas.getContext('2d');
                        //document.body.append(canvas)
                        function step() {
                            getFace(localVideo, mtcnnForwardParams)
                            const ctx = canvas1.getContext('2d');
                            ctx.drawImage(localVideo, 0, 0)
                            results.map(result => {
                                ctx.drawImage(
                                    image,
                                    result.detection.box.x + 15,
                                    result.detection.box.y + 30,
                                    result.detection.box.width,
                                    result.detection.box.width * (image.height / image.width)
                                )
                            })
                            requestAnimationFrame(step)

                        }

                        requestAnimationFrame(step)
                    })
                    localStream = canvas1.captureStream(30)
                }
                //내 비디오정보를 가져오고 join_room을 하면 그때부터 소켓연결이 시작 됨.
                newSocket.emit("join_room", {
                    roomName: props.location.room.roomName,
                    user: props.location.user,
                });
                es.play();
            })
            .catch((error) => {
                message.error('카메라와 마이크를 연결 후 다시 입장해주세요.');
                setTimeout(() => {
                    props.history.push('/');
                }, 2000);
            });

        if (props.location.room && props.location.user) {
            message.info(
                `${props.location.room.roomName}에 ${props.location.user.name}님이 입장하셨습니다.`
            );
        } else {
            props.history.push("/");
        }
    }, []);


    const createPeerConnection = (socketID, email, newSocket, localStream) => {
        let pc = new RTCPeerConnection(pc_config);

        // add pc to peerConnections object
        pcs = { ...pcs, [socketID]: pc };
        setPcsState(pcs);

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                newSocket.emit("candidate", {
                    candidate: e.candidate,
                    candidateSendID: newSocket.id,
                    candidateReceiveID: socketID,
                });
            }
        };

        pc.oniceconnectionstatechange = (e) => { };

        pc.ontrack = (e) => {
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
        //내 비디오에 대한 정보를 가져온다.

        if (localStream) {
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });
        } else {
            console.log("no local stream");
        }
        // return pc
        return pc;
    };

    function handleCamera() {
        if (myCameraOn) localVideoRef.current.srcObject.getVideoTracks()[0].stop();
        else console.log("카메라켜기");
        myCameraOn.current = !myCameraOn.current;
    }

    function warning() {

    }



    const onShare = () => SetisShare(true);
    const onChangeLocalStream = (stream) => (currLocalStream.current = stream);
    async function getFace(localVideo, options) {
        results = await faceApi.mtcnn(localVideo, options)
        console.log("face_DE");
    }

    // const createPeerConnection = (socketID, email, newSocket, localStream) => {
    //     let pc = new RTCPeerConnection(pc_config);

    const cameraTurn = (userSocketId) => {
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: {
                    width: 240,
                    height: 240,
                },
            })
            .then((stream) => {
                let videoTrack = stream.getVideoTracks()[0];
                Object.keys(pcsState).forEach((key) => {
                    if (key !== userSocketId) return;
                    var sender = pcsState[key].getSenders().find(function (s) {
                        return s.track.kind === videoTrack.kind;
                    });
                    console.log("found sender:", sender);

                    navigator.mediaDevices
                        .getUserMedia({
                            audio: true,
                            video: false,
                        })
                        .then((stream) => {
                            let videoTrack = stream.getVideoTracks()[0];
                            sender.replaceTrack(videoTrack);
                        })
                        .catch((error) => {
                            console.log(`getUserMedia error: ${error}`);
                        });
                });
            })
            .catch((error) => {
                console.log(`getUserMedia error: ${error}`);
            });
    };

    const cameraTurnRetry = (userSocketId) => {
        // navigator.mediaDevices
        //   .getUserMedia({
        //     audio: true,
        //     video: {
        //       width: 240,
        //       height: 240,
        //     },
        //   })
        //   .then((stream) => {
        //     let videoTrack = stream.getAudioTracks()[0];
        //     Object.keys(pcsState).forEach((key) => {
        //       if (key !== userSocketId) return;
        //       var sender = pcsState[key].getSenders().find(function (s) {
        //         return s.track.kind === "audio";
        //       });
        //       if (stream) {
        //         stream.getTracks().forEach((track) => {
        //           pcsState[key].removeTrack(sender);
        //           pcsState[key].addTrack(track, stream);
        //         });
        //       } else {
        //         console.log("no local stream");
        //       }
        //     });
        //   })
        //   .catch((error) => {
        //     console.log(`getUserMedia error: ${error}`);
        //   });
    };

    // css 관련 버튼 이벤트
    function displayOnBtn() {
        if (document.getElementById("rightContents").style.display === "none"
            || document.getElementById("rightContents").style.display === "") {
            document.getElementById("rightContents").style.display = "flex"
        }
        else {
            document.getElementById("rightContents").style.display = "none"
        }
    }

    const onMute = () => {
        if (!isMute.current) {
            localVideoRef.current.srcObject.getAudioTracks()[0].enabled = false;
            isMute.current = !isMute.current;
        } else {
            localVideoRef.current.srcObject.getAudioTracks()[0].enabled = true;
            isMute.current = !isMute.current;
        }
    };

    return (
        <div>
            <div className="roomHead">
                <span>MeetHub</span>
            </div>
            <div className="roomBody">
                <div className="roomVideos">
                    {/* <div>
                        <div>
                            <canvas ref={canvasRef} width="240" height="240" {...props}>Your browser does not support Canvas</canvas>
                            <video
                                style={{
                                    width: 240,
                                    height: 240,
                                    margin: 5,
                                    backgroundColor: "#cfc6c64d",
                                }}
                                muted
                                ref={localVideoRef}
                                autoPlay
                            ></video>
                        </div>
                        <div>
                            <canvas ref={canvasRef} width="240" height="240" {...props}>Your browser does not support Canvas</canvas>
                            <video
                                style={{
                                    width: 240,
                                    height: 240,
                                    margin: 5,
                                    backgroundColor: "#cfc6c64d",
                                }}
                                muted
                                ref={localVideoRef}
                                autoPlay
                            ></video>
                        </div>
                    </div> */}
                    <div>
                        {/* <div>
                            <canvas ref={canvasRef} width="240" height="240" {...props}>Your browser does not support Canvas</canvas>
                            <video
                                style={{
                                    width: 240,
                                    height: 240,
                                    margin: 5,
                                    backgroundColor: "#cfc6c64d",
                                }}
                                muted
                                ref={localVideoRef}
                                autoPlay
                            ></video>
                        </div> */}
                        <div>
                            <canvas ref={canvasRef} width="240" height="240" {...props}>Your browser does not support Canvas</canvas>
                            <video
                                style={{
                                    width: 240,
                                    height: 240,
                                    margin: 5,
                                    backgroundColor: "#cfc6c64d",
                                }}
                                muted
                                ref={localVideoRef}
                                autoPlay
                            ></video>
                        </div>
                    </div>


                    {users.map((user, index) => {
                        return (
                            <div key={index}>
                                <Video key={index} email={user.email} stream={user.stream} />
                                {/* <button onClick={() => cameraTurn(user.id)}>화상연결해제</button>
                                <button onClick={() => cameraTurnRetry(user.id)}>
                                    화상다시연결

                                </button> */}
                            </div>
                        );
                    })}
                </div>
                {room.roomName && user.name && (
                    <div className="roomChat">
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="사용자" key="2">
                                <ParticipantList socket={socket} roomName={room.roomName} />
                            </TabPane>
                            <TabPane tab="채팅" key="1">
                                <ChatList socket={socket} user={user} roomName={room.roomName} />
                            </TabPane>
                        </Tabs>
                    </div>
                )}


            </div>
            <div className="roomFooter">

                <div className="leftFooter">

                    <button className="soundOnBtn" onClick={onMute}>
                        <img src={mic} />
                    </button>
                    
                    <button
                        onClick={() => {
                            socket.disconnect();
                            props.history.push("/");
                            es.play();
                        }}
                    >
                        <img src={call} />
                    </button>
                    {/* <button className="cameraOnBtn" onClick={handleCamera}>
                          <img src={ videoCamera} />
                      </button> 임시로 경고버튼으로사용*/}
                    
                    <button className="cameraOnBtn" onClick={handleCamera}>
                        <span><img src={videoCamera} /></span>
                    </button>

                </div>

                <div className="rightFooter">
                    <div className="rightBtn">
                        <button onClick={displayOnBtn} id="rightBtn"><img src={menu} />


                            <div id="rightContents" className="rightContents">
                                {room.roomName && user.name && (
                                    <div className="rightBtnDiv">
                                        <div>
                                            <VoteList room={room} user={props.user} />
                                            <Attend
                                                socket={socket}
                                                roomName={room.roomName}
                                                room={room}
                                                user={props.user}
                                            />
                                        </div>
                                        <div>
                                            <QuestionList room={room} user={props.user} />
                                            <ShareDisplay
                                                localVideoRef={localVideoRef}
                                                onShare={onShare}
                                                onChangeLocalStream={onChangeLocalStream}
                                                pcs={pcsState}
                                            />
                                        </div>
                                        <div style={{ backgroundColor: 'white' }}>
                                            <button onClick={() => { socket.emit("warning", room.roomName) }}>
                                                <img src={warningSign} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>

                        </button>

                    </div>
                </div>
            </div>

        </div>
    );
}

export default RoomPage;
