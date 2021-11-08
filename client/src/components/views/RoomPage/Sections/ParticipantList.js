import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

function ParticipantList(props) {
  const [participantList, setParticipantList] = useState();

  console.log(props.socket);
  console.log(props.roomName, "safafds");

  useEffect(() => {
    props.socket.emit("participants", props.roomName);
    props.socket.on("participants", (participants) => {
      console.log(participants, "리스트");
      setParticipantList(participants);
    });
  }, []);

  if (participantList) console.log(participantList[0]);

  return (
    <div className="ChatList__container">
      {participantList &&
        participantList.map((data, index) => (
          <div key={index}>
            <h3>{data.user.name}</h3>
          </div>
        ))}
    </div>
  );
}

export default ParticipantList;
