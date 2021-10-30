import React, { useState, useEffect } from 'react';
import { Input, message, Modal, Form, Button } from "antd";
import axios from 'axios';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

function Attend(props) {
    const [participantList, setParticipantList] = useState([]);
    const [openAttendModal, setOpenAttendModal] = useState(false);
    const [openAttendRegisterModal, setOpenAttendRegisterModal] = useState(false);
    const [form] = Form.useForm();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [attBook, setAttBook] = useState([]);

    const onChange = (event) => {
        const {
            target: { name, value }
        } = event;
        if (name === 'name') {
            setName(value);
        } else if (name === 'email') {
            setEmail(value);
        }
    }

    const handleOpenAttendModal = () => {
        setOpenAttendModal(true);
    }

    const handleCloseAttendModal = () => {
        setOpenAttendModal(false);
    }

    const handleOpenAttendRegisterModal = () => {
        setOpenAttendRegisterModal(true);
    }

    const handleCloseAttendRegisterModal = () => {
        setOpenAttendRegisterModal(false);
    }

    const onAddEmail = (values) => {
        const attendanceBook = props.room.attendanceBook;

        const addList = {
            name: values.attendRegisterName,
            email: values.attendRegisterEmail
        }
        
        
        attendanceBook.push(addList);
        
        
        const variables = {
            roomId: props.room._id,
            attendanceBook
        }

        axios.post('/api/rooms/attBookUpdate', variables)
            .then(response => {
                if (response.data.success) {
                    message.success("성공적으로 추가되었습니다.");
                    setTimeout(() => {
                        setOpenAttendRegisterModal(false);
                    }, 1000);
                } else {
                    message.error("출석부 수정에 실패했습니다.");
                }
            })
    }

    const onConfirm = () => {
        const attendanceBook = props.room.attendanceBook;

        const check = new Array();
        attendanceBook.map((v) => {
            check.push({ name: v.name, email: v.email, attend: false });
        })

        participantList.map((v, i) => {
            check.map((attBook) => {
                if (v.user.email === attBook.email) {
                    attBook.attend = true;
                }
            })
        })

        setAttBook(check);
    }

    const renderAttend = attBook.map((v, i) => {
        const onAttBookDelete = () => {
            const attendanceBook = props.room.attendanceBook;

            attendanceBook.splice(i, 1);
            
            const variables = {
                roomId: props.room._id,
                attendanceBook
            }
    
            axios.post('/api/rooms/attBookUpdate', variables)
                .then(response => {
                    if (response.data.success) {
                        message.success("성공적으로 삭제되었습니다.");
                        setTimeout(() => {
                            setOpenAttendRegisterModal(false);
                        }, 1000);
                    } else {
                        message.error("출석부 수정에 실패했습니다.");
                    }
                })
        }

        return <div key={i}>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.name}</span>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.email}</span>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.attend ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}</span>
            <button style={{ display: 'inline-block' }} onClick={onAttBookDelete}>삭제</button>
        </div>
    })

    useEffect(() => {
        props.socket.emit('participants', props.roomName);
        props.socket.on("participants", (participants) => {
            setParticipantList(participants);
        })
    }, [])

    return (
        <div>
            {props.user._id === props.room.creator._id &&
                <button onClick={handleOpenAttendModal}>출결 확인</button>
            }
            <Modal
                style={{ textAlign: 'center' }}
                title="출결 확인"
                visible={openAttendModal}
                onCancel={handleCloseAttendModal}
                footer={[
                    <Button key="register" type="primary" onClick={handleOpenAttendRegisterModal} style={{ float: "left" }}>출결부 명단 추가</Button>,
                    <Button key="cancel" type="defualt" onClick={handleCloseAttendModal}>닫기</Button>,
                    <Button key="confirm" type="primary" onClick={onConfirm}>출결 확인</Button>
                ]}
            >
                <span style={{ display: 'inline-block', width: '30%' }}>이름</span>
                <span style={{ display: 'inline-block', width: '30%' }}>이메일</span>
                <span style={{ display: 'inline-block', width: '30%' }}>출결</span>
                <hr />
                {renderAttend}
            </Modal>
            
            <Modal
                title="출결부 명단 추가"
                visible={openAttendRegisterModal}
                onOk={() => {
                    form
                        .validateFields()
                        .then(values => {
                            onAddEmail(values);
                        })
                        .catch(info => {
                            message.error('필수 입력 사항들을 모두 입력해주세요.');
                        })
                }}
                onCancel={handleCloseAttendRegisterModal}
            >
                <Form
                    form={form}
                    name='attendRegister'
                >
                    <Form.Item
                        name='attendRegisterName'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <Input name='name' type="text" placeholder='출석부에 등록할 이름을 입력하세요.' value={name} onChange={onChange} />
                    </Form.Item>
                    <Form.Item
                        name='attendRegisterEmail'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <Input name='name' ype="email" placeholder='출석부에 등록할 이메일을 입력하세요.' value={email} onChange={onChange} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default Attend
