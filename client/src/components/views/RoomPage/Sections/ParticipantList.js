import React, { useState, useEffect } from 'react'

function ParticipantList(props) {
    const [participantList, setParticipantList] = useState([]);

    useEffect(() => {
        props.socket.emit('participants', props.roomName);
        props.socket.on("participants", (participants) => {
            setParticipantList(participants);
        })
    }, [])

    return (
        <div className="ChatList__container">
            {participantList.map((data, index) => (
                <div key={index}>
                    <h3>{data.user.name}</h3>
                </div>
            ))}
        </div>
    )
}

export default ParticipantList
