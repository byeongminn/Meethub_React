import { message, Tabs } from 'antd';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import Attend from './Sections/Attend';
import ChatList from './Sections/ChatList';
import ParticipantList from './Sections/ParticipantList';
import QuestionList from './Sections/QuestionList';
import ShareDisplay from './Sections/ShareDisplay';
import VoteList from './Sections/VoteList';
import effectSound from './Sections/effectSound';
import ES from './audios/ES.mp3';
import Video from './Sections/Video';

const { TabPane } = Tabs;

function RoomPage(props) {
    const user = props.user;
    const roomId = props.match.params.roomId;
    const [room, setRoom] = useState({});

    const variables = {
        roomId
    }
    const es = effectSound(ES, 1);

    const [users, setUsers] = useState([]);

    let localVideoRef = useRef(null);
    let myCameraOn = useRef(true);

    let pcs;

    const pc_config = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    };

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

        const newSocket = io.connect("http://localhost:5000");
        setSocket(newSocket);
        let localStream;

        //방에 입장했을 경우. 같은 방에 있는 유저들의 정보를 가져온다.
        newSocket.on("all_users", (allUsers) => {
            let len = allUsers.length;

            //각각의 유저에대한 소켓연결을 만드는 부분.
            for (let i = 0; i < len; i++) {
                createPeerConnection(
                    allUsers[i].socketId,
                    allUsers[i].user.email,
                    newSocket,
                    localStream
                );

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
                pc.addIceCandidate(new RTCIceCandidate(data.candidate)).then(() => {
                    
                });
            }
        });

        newSocket.on("user_exit", (data) => {
            pcs[data.id].close();
            delete pcs[data.id];
            setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id));
            //유저가 나가면 연결을 끊고 현재방에대한 유저를 담고있는
            //Users도 새롭게 갱신해준다.
        });

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

                localStream = stream;

                //내 비디오정보를 가져오고 join_room을 하면 그때부터 소켓연결이 시작 됨.
                newSocket.emit("join_room", {
                    roomName: props.location.room.roomName,
                    user: props.location.user,
                });
                es.play();
            })
            .catch((error) => {
                console.log(`getUserMedia error: ${error}`);
            });

        if (props.location.room && props.location.user) {
            message.info(`${props.location.room.roomName}에 ${props.location.user.name}님이 입장하셨습니다.`);
        } else {
            props.history.push('/');
        }
    }, [])

    const createPeerConnection = (socketID, email, newSocket, localStream) => {
        let pc = new RTCPeerConnection(pc_config);

        // add pc to peerConnections object
        pcs = { ...pcs, [socketID]: pc };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                newSocket.emit("candidate", {
                    candidate: e.candidate,
                    candidateSendID: newSocket.id,
                    candidateReceiveID: socketID,
                });
            }
        };

        pc.oniceconnectionstatechange = (e) => {
            
        };

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

    return (
        <div>
            <ShareDisplay />
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
                <button onClick={handleCamera}>
                    {myCameraOn ? "카메라 끄기" : "카메라 켜기"}
                </button>
                {users.map((user, index) => {
                    return (
                        <div key={index}>
                            <Video key={index} email={user.email} stream={user.stream} />
                            {/* <button onClick={() => cameraTurn(user.id)}>화상연결해제</button> */}
                        </div>
                    );
                })}
            </div>
            {room.roomName && user.name &&
                <div>
                    <Tabs defaultActiveKey='1'>
                        <TabPane tab='사용자' key='2'>
                            <ParticipantList socket={socket} roomName={room.roomName} />
                        </TabPane>
                        <TabPane tab='채팅' key='1'>
                            <ChatList socket={socket} user={user} roomName={room.roomName} />
                        </TabPane>
                    </Tabs>
                    <Attend socket={socket} roomName={room.roomName} room={room} user={props.user} />
                    <VoteList room={room} user={props.user} />
                    <QuestionList room={room} user={props.user} />
                </div>
            }
            <button onClick={() => {
                socket.disconnect();
                props.history.push('/');
                es.play();
            }}>나가기</button>

        </div>
    )
}

export default RoomPage
