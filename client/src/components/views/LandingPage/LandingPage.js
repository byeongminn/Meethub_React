import React, { useState, useEffect } from 'react';
import axios from "axios";
import MakeRoom from './Sections/MakeRoom';
import { Avatar, Card, Col, message, Row } from 'antd';
import { LockFilled } from '@ant-design/icons';

const { Meta } = Card;

function LandingPage(props) {
    const [rooms, setRooms] = useState([]);
    const [openMakeModal, setOpenMakeModal] = useState(false);

    useEffect(() => {
        axios.get('/api/rooms/getRooms')
            .then(response => {
                if (response.data.success) {
                    setRooms(response.data.rooms);
                } else {
                    message.error('방목록을 불러오는데 실패했습니다.');
                }
            })
    }, [])
    
    const handleOpenMakeModal = () => {
        setOpenMakeModal(true);
    }

    const handleCloseMakeModal = () => {
        setOpenMakeModal(false);
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
            width: '85%', margin: '3rem auto'
        }}>
            <h2>방목록</h2>
            <button onClick={() => window.location.replace('/')}>새로고침</button>
            <button onClick={onClick}>로그아웃</button>
            <button onClick={handleOpenMakeModal}>방 만들기</button>
            <MakeRoom {...props} visible={openMakeModal} onCancel={handleCloseMakeModal} />
            <hr />
            <Row gutter={[16, 16]}>
                {rooms.length > 0 ?
                    rooms.map((room, index) => (
                        <Col key={index} lg={6} md={8} xs={24}>
                            <a href={`/rooms/${room._id}`}>
                                <Card style={{ position: 'relative' }}>
                                    {room.roomPassword && <LockFilled style={{ position: 'absolute', right: 30 }} />}
                                    <div style={{ width: '100%', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span style={{ color: 'black', fontSize: '2rem', fontWeight: '600' }}>{room.roomName}</span>
                                    </div>
                                    <br />
                                    <Meta
                                        title={`방장: ${room.creator.name}`}
                                        description={room.roomDescription}
                                    />
                                </Card>
                            </a>
                        </Col>
                    ))
                    : 
                    <div style={{ width: '100%', height: '20vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '3rem', fontWeight: '600' }}>방이 하나도 존재하지 않습니다.</span>
                    </div>
                }
            </Row>
        </div>
    )
}

export default LandingPage
