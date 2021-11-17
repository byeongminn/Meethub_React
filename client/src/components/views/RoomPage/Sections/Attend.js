import React, { useState, useEffect } from 'react';
import { Input, message, Modal, Form, Button, Space } from "antd";
import axios from 'axios';
import { CheckOutlined, ExclamationCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import './Attend.css'

import user from "../img/user.png";

const { confirm } = Modal;

function Attend(props) {
    const [participantList, setParticipantList] = useState([]);
    const [openAttendModal, setOpenAttendModal] = useState(false);
    const [openAttendRegisterModal, setOpenAttendRegisterModal] = useState(false);
    const [form] = Form.useForm();
    const [attBook, setAttBook] = useState([]);
    const [counter, setCounter] = useState(0);
    const [totalCounter, setTotalCounter] = useState(0);

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
        onReset();
    }

    const onReset = () => {
        form.resetFields();
    }

    const onAddEmail = (values) => {
        const attendanceBook = props.room.attendanceBook;

        values.user.map((v, i) => {
            attendanceBook.push(v);
        })
        
        const variables = {
            roomId: props.room._id,
            attendanceBook
        }

        axios.post('/api/rooms/attBookUpdate', variables)
            .then(response => {
                if (response.data.success) {
                    message.success("성공적으로 추가되었습니다.");
                    refreshAttendanceBook();
                    setTimeout(() => {
                        setOpenAttendRegisterModal(false);
                        onReset();
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

        let cnt = 0;

        participantList.map((v, i) => {
            check.map((attBook) => {
                if (v.user.email === attBook.email) {
                    attBook.attend = true;
                    cnt++;
                }
            })
        })

        setAttBook(check);
        setCounter(cnt);
        setTotalCounter(attendanceBook.length);
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
                        refreshAttendanceBook();
                        setTimeout(() => {
                            setOpenAttendRegisterModal(false);
                        }, 1000);
                    } else {
                        message.error("출석부 수정에 실패했습니다.");
                    }
                })
        }

        const showConfirm = () => {
            confirm({
                title: '해당 인원을 삭제하시겠습니까?',
                icon: <ExclamationCircleOutlined />,
                content: '삭제시 해당 인원이 출석부에서 삭제됩니다.',
                okText: '삭제',
                okType: 'danger',
                cancelText: '취소',
                onOk() {
                    onAttBookDelete();
                }
            })
        }

        return <div key={i} style={{flexDirection:'row'}}>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.name}</span>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.email}</span>
            <span style={{ display: 'inline-block', width: '30%' }}>{v.attend ? <CheckOutlined style={{ color: 'green' }} /> : ''}</span>
            <button className="deleteMemBtn" style={{  display: 'inline-block', border:'0',width:'40px' }} onClick={showConfirm}>삭제</button>
        </div>
    })

    const refreshAttendanceBook = () => {
        const attendanceBook = props.room.attendanceBook;

        const check = new Array();
        attendanceBook.map((v) => {
            check.push({ name: v.name, email: v.email, attend: v.attend });
        })

        setAttBook(check);
        setTotalCounter(attendanceBook.length);
    }

    useEffect(() => {
        props.socket.emit('participants', props.roomName);
        props.socket.on("participants", (participants) => {
            setParticipantList(participants);
        })
    }, [])

    useEffect(() => {
        refreshAttendanceBook();
    }, [])

    return (
        <div>
            {/*{props.user._id === props.room.creator._id &&*/}
                <button onClick={handleOpenAttendModal}><img src={user}/></button>
            {/*}*/}
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
                <div className="nameModalTitle" style={{display:'flex', flexDirection: 'row'}
                }>
                    <span style={{ display: 'inline-block', width: '30%' }}>이름</span>
                    <span style={{ display: 'inline-block', width: '30%' }}>이메일</span>
                    <span style={{ display: 'inline-block', width: '30%' }}>출결</span>
                </div>
                <hr />
                {renderAttend}
                <br />
                <div style={{display:'flex',justifyContent: 'center'}}>
                <span>출석 인원 : {counter} / {totalCounter}</span>
                </div>
            </Modal>
            
            <Modal
                title="출결부 명단 추가"
                visible={openAttendRegisterModal}
                okText='등록'
                onOk={() => {
                    form
                        .validateFields()
                        .then(values => {
                            onAddEmail(values);
                        })
                        .catch(info => {
                            
                        })
                }}
                cancelText='닫기'
                onCancel={handleCloseAttendRegisterModal}
            >
                <Form
                    form={form}
                    name='attendRegister'
                >
                    <Form.List name='user'>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, fieldKey, ...restField }) => (
                                    <Space key={key}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'name']}
                                            fieldKey={[fieldKey, 'name']}
                                            rules={[{ required: true, message: '필수 입력 사항입니다.' }]}
                                        >
                                            <Input placeholder='이름을 입력하세요.' />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'email']}
                                            fieldKey={[fieldKey, 'email']}
                                            rules={[{ required: true, message: '필수 입력 사항입니다.' }]}
                                        >
                                            <Input placeholder='이메일을 입력하세요.' />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}></Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    )
}

export default Attend
