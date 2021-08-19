import React, { useState, useEffect } from 'react';
import { Modal } from "antd";
import "./MakeRoom.css";
import axios from 'axios';

function MakeRoom(props) {
    const [roomName, setRoomName] = useState("");

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setRoomName(value);
    }
    
    const onOk = () => {
        props.history.push({
            pathname: `/rooms/${roomName}`,
            roomName,
        });
    }

    return (
        <div>
            <Modal title="방 만들기" visible={props.visible} onOk={onOk} onCancel={props.onCancel} >
                <label>방 제목</label>
                <input type="text" value={roomName} onChange={onChange} />
            </Modal>
        </div>
    )
}

export default MakeRoom
