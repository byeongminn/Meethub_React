import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';

function RoomPage(props) {
    const roomName = props.location.roomName;
    const [user, setUser] = useState({});
    const [content, setContent] = useState("");

    useEffect(() => {
        axios.get("/api/users/auth")
            .then(response => setUser(response.data));
    }, [])

    // localStorage : 새로고침 시를 위한 작업해야함.

    const socket = io("http://localhost:5000");

    if (user.isAuth) {
        socket.emit("join_room", roomName, user.name);
        socket.on("welcome", (userName) => {
            console.log(`${roomName}방에 ${userName}님이 입장하셨습니다.`);
        })

        let body = {
            roomName: roomName,
            email: user.email
        }
        axios.post("/api/rooms/make", body);
    }

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setContent(value);
    }

    return (
        <div>
            <form>
                <input
                    style={{ width: "300px", height: "40px" }}
                    type="text"
                    value={content}
                    onChange={onChange}
                />
            </form>
        </div>
    )
}

export default RoomPage
