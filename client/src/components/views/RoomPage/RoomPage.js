import React, { useState, useEffect, useRef } from "react";
import { message, Tabs } from "antd";
import { io } from "socket.io-client";
import axios from "axios";
import Video from "../../Video/Video";
import Attend from './Sections/Attend';
import ChatList from './Sections/ChatList';
import ParticipantList from './Sections/ParticipantList';
import ShareDisplay from './Sections/ShareDisplay';
import VoteList from './Sections/VoteList';
import "./RoomPage.css"

//img
import video from '../../../icons/video-player.png'
import information from '../../../icons/information.png'
import abstract from '../../../icons/abstract.png'
import gear from '../../../icons/gear.png'
import mic from '../../../icons/mic.png'
import phone from '../../../icons/phone-call.png'
import vote from '../../../icons/vote.png'
import more from '../../../icons/more.png'
import account from '../../../icons/account.png'


const { TabPane } = Tabs;

function RoomPage(props) {
  const roomId = props.match.params.roomId;
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [room, setRoom] = useState({});

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

  let newSocket = io.connect("http://localhost:5000");
  const [init, setInit] = useState(false);

  useEffect(() => {
    const variables = {
      roomId,
    };

    axios.post("/api/rooms/getRoom", variables).then((response) => {
      if (response.data.success) {
        setRoom(response.data.room);
        setInit(true);
      } else {
        message.error("방에 대한 정보를 받아오는데 실패했습니다.");
        setTimeout(() => {
          props.history.push("/");
        }, 3000);
      }
    });
  }, []);

  useEffect(() => {
    if (init && user) {
      console.log("소켓이 방에 포함되기를 시작.");

      //setInit(newSocket);
      let localStream;
      console.log(user);
      console.log(room);

      if (user.isAuth && room.roomName) {
        //내 정보와 방 정보가 잘 가져와졌다면.
        newSocket.on("welcome", (userName) => {
          message.info(`${room.roomName}에 ${userName}님이 입장하셨습니다.`);
        });
      }

      //방에 입장했을 경우. 같은 방에 있는 유저들의 정보를 가져온다.
      newSocket.on("all_users", (allUsers) => {
        let len = allUsers.length;

        //각각의 유저에대한 소켓연결을 만드는 부분.
        for (let i = 0; i < len; i++) {
          createPeerConnection(
            allUsers[i].id,
            allUsers[i].email,
            newSocket,
            localStream
          );

          //연결을 만들고 각 유저에 대해서 offer와 answer를 주고 받아서
          // 소켓연결을 완성한다 (유저의 길이 만큼 반복문을 돌면서 각각 모두 연결 - Peer to Peer )
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

      //들어온 유저에게 offer를 받아서 연결을 이어가는 부분.
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
                  //sdp는 연결하고자 하는 peer간의 미디어와 네트워크 정보를 이해하기위해 사용.
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
        //유저가 나가면 연결을 끊고 현재방에대한 유저를 담고있는
        //Users도 새롭게 갱신해준다.
      });

      console.log(user, "유저이름");
      newSocket.emit("join_room", {
        room: room._id,
        user,
        userName: user.name,
      });
      //내 비디오에 대한 정보를 가져온다.
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

          console.log(room._id, "룸이 셋팅??");

          //내 비디오정보를 가져오고 join_room을 하면 그때부터 소켓연결이 시작 됨.
          // newSocket.emit("join_room", {
          //   room: room._id,
          //   user,
          // });
        })
        .catch((error) => {
          console.log(`getUserMedia error: ${error}`);
        });
    } else {
      getMy();
      async function getMy() {
        await axios
          .get("/api/users/auth")
          .then((response) => setUser(response.data));
      } //DB에 담긴 나의 정보를 가져온다.
    }
  }, [init, user]);

  //peer간 연결을 만드는 함수.
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
<<<<<<< HEAD

    function optionModal(){
        let opModal = document.getElementById("optionModal")
        console.log("op" , opModal.style.display)
        if(opModal.style.display === "none" || !opModal.style.display){
            opModal.style.display = "block"
        }
        else {
            opModal.style.display = "none"
        }
    }

    return (
        <div className="rooms">
            <div className="roomHead">
                <span>MeetHub</span>
            </div>
            <div className="roomBody">
                <div className="roomVideoDiv">
                    <div>
                        <video
                            style={{
                                width: 300,
                                height: 300,
                                margin: 5,
                                backgroundColor: "gray",
                            }}
                            muted
                            ref={localVideoRef}
                            autoPlay
                        ></video>
                        <video
                            style={{
                                width: 300,
                                height: 300,
                                margin: 5,
                                backgroundColor: "gray",
                            }}
                            muted
                            ref={localVideoRef}
                            autoPlay
                        ></video>
                    </div>
                    <div>
                        <video
                            style={{
                                width: 300,
                                height: 300,
                                margin: 5,
                                backgroundColor: "gray",
                            }}
                            muted
                            ref={localVideoRef}
                            autoPlay
                        ></video>
                        <video
                            style={{
                                width: 300,
                                height: 300,
                                margin: 5,
                                backgroundColor: "gray",
                            }}
                            muted
                            ref={localVideoRef}
                            autoPlay
                        ></video>
                    </div>

                </div>
                {/*채팅방 넣는 위치*/}
                <div className="roomChat">
                    <div className="roomExample">s

                    </div>
                </div>
            </div>
            <div className="roomFooter">
                <div className="roomFooterIcons">
                    <div className="cameraDiv ">
                        {/*<img src={video}/>*/}
                        <button className="micBtn">
                            <img src={mic}/>
                        </button>
                        <button className="micBtn">
                            <img src={phone}/>
                        </button>
                        <button className="cameraBtn" onClick={handleCamera} style={{backgronudImage:"{video}"}}>
                            <img src={video}/>
                            {/*{myCameraOn ? "카메라 끄기" : "카메라 켜기"}*/}
                        </button>
                    </div>
                </div>
                <div className="roomFooterOptions">

                    <button id="optionBtn" className="micBtn" onClick={optionModal}>
                        <div id="optionModal" className="optionModal">
                            <button className="vote">
                                <img src={vote}/>
                            </button>
                            <button className="information">
                                <img src={information}/>
                            </button>
                            <button className="account">
                                <img src={account}/>
                            </button>
                            <button className="abstract">
                                <img src={abstract}/>
                            </button>
                            <button className="gear">
                                <img src={gear}/>
                            </button>
                        </div>
                        <img src={more}/>
                    </button>
                    {users.map((user, index) => {
                        return (
                            <div>
                                <Video key={index} email={user.email} stream={user.stream} />
                                {console.log(user)}
                                <button onClick={() => cameraTurn(user.id)}>화상연결해제</button>
                            </div>
                        );
                })}
                <ShareDisplay />
                </div>
            </div>
            {/* {room.roomName && user.name &&
                <div>
                    <Tabs defaultActiveKey='1'>
                        <TabPane tab='사용자' key='1'>
                            <ParticipantList socket={newSocket} roomName={room.roomName} />
                        </TabPane>
                        <TabPane tab='채팅' key='2'>
                            <ChatList socket={newSocket} user={user} roomName={room.roomName} />
                        </TabPane>
                    </Tabs>
                    <Attend socket={newSocket} roomName={room.roomName} room={room} user={props.user} />
                    <VoteList room={room} user={props.user} />
                </div>
            }
            <button onClick={() => {
                newSocket.disconnect();
                props.history.push('/');
            }}>나가기</button> */}
=======
    // return pc
    return pc;
  };

  //선택적 카메라공유 (아직 구현 못함)
  function cameraTurn(targetId) {
    pcs[targetId].close();
    delete pcs[targetId];
    setUsers((oldUsers) => oldUsers.filter((user) => user.id !== targetId));
  }
  //user.id 이용하면 될거같음

  //내카메라를 전체 유저에게 안보이게 설정하는 기능
  function handleCamera() {
    if (myCameraOn) localVideoRef.current.srcObject.getVideoTracks()[0].stop();
    else console.log("카메라켜기");
    myCameraOn.current = !myCameraOn.current;
    console.log(myCameraOn);
    console.log(localVideoRef.current.srcObject);
  }
  console.log(newSocket, init);
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
      <button onClick={handleCamera}>
        {myCameraOn ? "카메라 끄기" : "카메라 켜기"}
      </button>
      {users.map((user, index) => {
        return (
          <div>
            <Video key={index} email={user.email} stream={user.stream} />
            {console.log(user)}
            <button onClick={() => cameraTurn(user.id)}>화상연결해제</button>
          </div>
        );
      })}
      <ShareDisplay />
      {init && room && user.name && (
        <div>
          <h1>hihi</h1>
          <Tabs defaultActiveKey="1">
            <TabPane tab="사용자" key="1">
              <ParticipantList socket={newSocket} roomName={room._id} />
            </TabPane>
            <TabPane tab="채팅" key="2">
              <ChatList socket={newSocket} user={user} roomName={room._id} />
            </TabPane>
          </Tabs>
          <Attend
            socket={newSocket}
            roomName={room._id}
            room={room}
            user={props.user}
          />
          <VoteList room={room} user={props.user} />
>>>>>>> bbm
        </div>
      )}
      {init && (
        <button
          onClick={() => {
            newSocket.disconnect();
            props.history.push("/");
          }}
        >
          나가기
        </button>
      )}
    </div>
  );
}

export default RoomPage;
