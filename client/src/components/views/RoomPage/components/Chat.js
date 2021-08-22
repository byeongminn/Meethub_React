import React, { useState, useEffect } from 'react'

function Chat({ socket, user, roomName, setChatList }) {
    const [value, setValue] = useState("");
    
    useEffect(() => {
        socket.on("receive_message", (chat) => {
            setChatList((chatList) => chatList.concat(chat));
        })
    }, [])

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setValue(value);
    }

    const onSubmit = (event) => {
        event.preventDefault();

        const body = {
            sender: user.name,
            content: value
        }
        socket.emit("send_message", roomName, body);
        setValue("");
    }

    return (
        <div>
            <form onSubmit={onSubmit}>
                <input type="text" value={value} onChange={onChange} />
            </form>
        </div>
    )
}

export default Chat
