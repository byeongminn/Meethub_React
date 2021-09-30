import { Input, message, Modal } from 'antd'
import React, { useState } from 'react'

function JoinRoom(props) {
    const [password, setPassword] = useState('');

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setPassword(value);
    }
    
    const onOk = () => {
        if (password === props.room.roomPassword) {
            props.history.push(`/rooms/${props.room._id}`);
        } else {
            message.error('비밀번호가 틀렸습니다.');
        }
    }

    return (
        <Modal
            title='비밀번호 입력'
            visible={props.visible}
            onOk={onOk}
            onCancel={props.onCancel}
        >
            <Input type='password' value={password} onChange={onChange} autoFocus/>
        </Modal>
    )
}

export default JoinRoom
