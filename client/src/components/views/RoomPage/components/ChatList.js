import React, { useState } from 'react';
import Chat from './Chat';
import "./ChatList.css";

function ChatList({ socket, user, roomName }) {
    const [chatList, setChatList] = useState([]);

    return (
        <>
            <div className="ChatList__container">
                {chatList.map(({ sender, content }, index) => (
                    <div key={index}>
                        <h3>{sender}</h3>
                        <h4>{content}</h4>
                    </div>
                ))}
            </div>
            <Chat socket={socket} user={user} roomName={roomName} setChatList={setChatList} />
        </>
    )
}

export default ChatList
