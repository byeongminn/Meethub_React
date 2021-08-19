import React, { useState } from 'react';
import axios from "axios";
import MakeRoom from '../Modals/MakeRoom';

function LandingPage(props) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const onClick = (event) => {
        event.preventDefault();
        axios.get("/api/users/logout")
            .then(response => {
                if (response.data.success) {
                    props.history.push("/login");
                } else {
                    alert("로그아웃 하는데 실패 했습니다.");
                }
            })
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center"
            , width: "100%", height: "100vh"
        }}>
            <script src="/socket.io/socket.io.js"></script>
            <h2>시작 페이지</h2>
            <button onClick={onClick}>로그아웃</button>
            <button onClick={handleOpen}>방 만들기</button>
            <MakeRoom {...props} visible={open} onCancel={handleClose} />
            <button>참여하기</button>
        </div>
    )
}

export default LandingPage
