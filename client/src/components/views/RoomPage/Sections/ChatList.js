import React, { useState, useEffect, useRef } from 'react';
import Chat from './Chat';

function ChatList({ socket, user, roomName }) {
    const [chatList, setChatList] = useState([]);
    const divRef = useRef();

    useEffect(() => {
        divRef.current.scrollTop = divRef.current.scrollHeight;
    }, [chatList]);

    return (
        <>
            <div className="ChatList__container" ref={divRef}>
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
