import React, { useState } from 'react';
import { message, Modal } from "antd";
import axios from 'axios';

function JoinRoom(props) {
    const [roomName, setRoomName] = useState("");

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setRoomName(value);
    }

    const onOk = () => {
        if (props.user.isAuth) {
            const variables = {
                creator: props.user._id,
                roomName
            }
            axios.post('/api/rooms/join', variables)
                .then(response => {
                    if (response.data.success) {
                        props.history.push({
                            pathname: `/rooms/${response.data.roomId}`
                        });
                    } else {
                        message.error(response.data.message);
                    }
                })
        } else {
            props.history.push("/login");
        }
    }

    return (
        <div>
            <Modal title="참여하기" visible={props.visible} onOk={onOk} onCancel={props.onCancel} >
                <label>방 제목</label>
                <input type="text" value={roomName} onChange={onChange} />
            </Modal>
        </div>
    )
}

export default JoinRoom
