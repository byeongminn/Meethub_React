import React, { useState } from 'react';
import Input from './Input';

function Chat({ socket, user, roomName }) {
    const [content, setContent] = useState("");
    
    const getContent = (content) => {
        setContent(content);
    }

    if (content !== "") {
        const body = {
            sender: user.name,
            content
        }
        socket.emit("send_message", roomName, body);
        socket.on("receive_message", (chat) => {
            console.log(chat);
        })
    }


    return (
        <div>
            <Input getContent={getContent} />
        </div>
    )
}

export default Chat
