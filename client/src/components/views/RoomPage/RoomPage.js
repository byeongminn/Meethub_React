import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';

function RoomPage(props) {
    const [user, setUser] = useState({});
    const roomName = props.location.roomName;
    console.log(user);
    console.log(roomName);

    useEffect(() => {
        axios.get("/api/users/auth")
            .then(response => setUser(response.data));
    }, [])

    if (user.isAuth) {
        const socket = io("http://localhost:5000");
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
    }
    
    return (
        <div>
            <button onClick={() => console.log("앙")}>눌러보세요</button>
        </div>
    )
}

export default RoomPage
