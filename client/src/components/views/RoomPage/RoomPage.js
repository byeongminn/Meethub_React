import { message, Tabs } from 'antd';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import ChatList from './Sections/ChatList';
import ParticipantList from './Sections/ParticipantList';
import ShareDisplay from './Sections/ShareDisplay';

const { TabPane } = Tabs;

function RoomPage(props) {
    const user = props.user;
    const roomId = props.match.params.roomId;
    const [room, setRoom] = useState({});

    const variables = {
        roomId
    }

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
    }, [])
    
    const socket = io("http://localhost:5000");
    
    if (user._id && room.roomName) {
        socket.emit("join_room", { roomName: room.roomName, user });
        socket.on("welcome", (userName) => {
            message.info(`${room.roomName}에 ${userName}님이 입장하셨습니다.`);
            console.log(socket.id);
        })
        socket.emit('participants', room.roomName);
        socket.on('participants', participants => {
            console.log(participants);
        })
    }

    return (
        <div>
            <ShareDisplay />
            {room.roomName && user.name &&
                <Tabs defaultActiveKey='1'>
                    <TabPane tab='사용자' key='1'>
                        <ParticipantList socket={socket} roomName={room.roomName} />
                    </TabPane>
                    <TabPane tab='채팅' key='2'>
                        <ChatList socket={socket} user={user} roomName={room.roomName} />
                    </TabPane>
                </Tabs>
            }
            <button onClick={() => {
                socket.disconnect();
                props.history.push('/');
            }}>나가기</button>
        </div>
    )
}

export default RoomPage
