import React from 'react';
import { io } from "socket.io-client";
import ChatList from './Sections/ChatList';
import ShareDisplay from './Sections/ShareDisplay';

function RoomPage(props) {
    const user = props.user;
    const roomName = props.match.params.roomId;

    const socket = io("http://localhost:5000");
    console.log(socket);
    socket.emit("join_room", roomName, user.name);
    socket.on("welcome", (userName) => {
        console.log(`${roomName}방에 ${userName}님이 입장하셨습니다.`);
    })
    
    return (
        <div>
            <ShareDisplay />
            <ChatList socket={socket} user={user} roomName={roomName} />
        </div>
    )
}

export default RoomPage
