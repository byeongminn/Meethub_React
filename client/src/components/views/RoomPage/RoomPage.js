import React from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import ChatList from './components/ChatList';

function RoomPage(props) {
    const user = props.location.user;
    const roomName = props.location.roomName;
    console.log(props);
    console.log(user);
    console.log(roomName);

    const socket = io("http://localhost:5000");
    console.log(socket);
    socket.emit("join_room", roomName, user.name);
    socket.on("welcome", (userName) => {
        console.log(`${roomName}방에 ${userName}님이 입장하셨습니다.`);
    })
    let body = {
        roomName: roomName,
        email: user.email
    }
    axios.post("/api/rooms/make", body)
        .then(response => {
            console.log(response);
        });

    return (
        <div>
            <button onClick={() => console.log("앙")}>눌러보세요</button>
            <ChatList socket={socket} user={user} roomName={roomName} />
        </div>
    )
}

export default RoomPage
