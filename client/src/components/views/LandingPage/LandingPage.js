import React, { useState } from 'react';
import axios from "axios";
import MakeRoom from './Sections/MakeRoom';
import { message } from 'antd';
import JoinRoom from './Sections/JoinRoom';

function LandingPage(props) {
    const [openMakeModal, setOpenMakeModal] = useState(false);
    const [openJoinModal, setOpenJoinModal] = useState(false);

    const handleOpenMakeModal = () => {
        setOpenMakeModal(true);
    }

    const handleCloseMakeModal = () => {
        setOpenMakeModal(false);
    }

    const handleOpenJoinModal = () => {
        setOpenJoinModal(true);
    }

    const handleCloseJoinModal = () => {
        setOpenJoinModal(false);
    }
    
    const onClick = (event) => {
        axios.get("/api/users/logout")
            .then(response => {
                if (response.data.success) {
                    props.history.push("/login");
                } else {
                    message.error("로그아웃 하는데 실패 했습니다.");
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
            <button onClick={handleOpenMakeModal}>방 만들기</button>
            <MakeRoom {...props} visible={openMakeModal} onCancel={handleCloseMakeModal} />
            <button onClick={handleOpenJoinModal}>참여하기</button>
            <JoinRoom {...props} visible={openJoinModal} onCancel={handleCloseJoinModal} />
        </div>
    )
}

export default LandingPage
