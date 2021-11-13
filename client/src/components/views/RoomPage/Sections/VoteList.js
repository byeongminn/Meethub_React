import React, { useState, useEffect } from 'react';
import { Input, message, Modal, Form, Button, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import Vote from './Vote';

import voteingBox from "../img/voting-box.png";

const { confirm } = Modal;

function VoteList(props) {
    const [openVoteListModal, setOpenVoteListModal] = useState(false);
    const [openVoteRegisterModal, setOpenVoteRegisterModal] = useState(false);
    const [content, setContent] = useState("");
    const [form] = Form.useForm();
    const [voteList, setVoteList] = useState([]);
    const [vote, setVote] = useState(false);

    useEffect(() => {
        getVotes();
    }, [])
    
    const getVotes = () => {
        const variables = {
            roomId: props.room._id
        }
        
        axios.post('/api/votes/getVotes', variables)
        .then(response => {
            if (response.data.success) {
                setVoteList(response.data.votes);
            } else {
                message.error('투표리스트를 받아오는데 실패했습니다.');
            }
        })
    }

    const onReset = () => {
        form.resetFields();
    }

    const closeVoteRegisterModal = () => {
        setOpenVoteRegisterModal(false);
        onReset();
    }

    const onChange = (event) => {
        const {
            target: { name, value }
        } = event;
        if (name === 'content') {
            setContent(value);
        }
    }

    const onVoteRegister = (values) => {
        const options = new Array();

        values.options.map((v) => {
            options.push({ option: v.option, count: 0 });
        })

        const variables = {
            room: props.room._id,
            creator: props.user._id,
            content: values.voteContent,
            options
        }
        
        axios.post('/api/votes/register', variables)
            .then(response => {
                if (response.data.success) {
                    message.success('투표가 성공적으로 등록되었습니다.');
                    getVotes();
                    setTimeout(() => {
                        setOpenVoteRegisterModal(false);
                        onReset();
                    }, 1000);
                } else {
                    message.error('투표를 등록하는데 실패했습니다.');
                }
            })
    }

    const renderVoteList = voteList && voteList.map((v, i) => {
        const onVoteClosing = () => {
            const variables = {
                voteId: v._id
            }
    
            axios.post('/api/votes/voteClosing', variables)
                .then(response => {
                    if (response.data.success) {
                        message.success("성공적으로 종료되었습니다.");
                        getVotes();
                    } else {
                        message.error("투표를 종료하는데 실패했습니다.");
                    }
                })
        }

        const onVoteDelete = () => {           
            const variables = {
                voteId: v._id
            }
    
            axios.post('/api/votes/voteDelete', variables)
                .then(response => {
                    if (response.data.success) {
                        message.success("성공적으로 삭제되었습니다.");
                        getVotes();
                    } else {
                        message.error("투표를 삭제하는데 실패했습니다.");
                    }
                })
        }

        const showConfirm = () => {
            confirm({
                title: '해당 투표를 삭제하시겠습니까?',
                icon: <ExclamationCircleOutlined />,
                content: '삭제시 해당 투표가 투표 목록에서 삭제됩니다.',
                okText: '삭제',
                okType: 'danger',
                cancelText: '취소',
                onOk() {
                    onVoteDelete();
                }
            })
        }

        return <div style={{margin:'0 0 30px 0'}}key={i}>
            <div onClick={() => setVote(v)}><span style={{fontSize:"18px", fontWeight:"bold"}}> 투표 제목 : </span>{v.content}</div>
            <div>{v.voted.length}</div>
            <div>{v.available ? <span style={{ color: 'black', fontWeight: '600' }}>투표중</span> : <span style={{ color: 'gray' }}>종료</span>}</div>
            <div>{moment(v.createdAt).format('YY-MM-DD')}</div>
            {props.user._id === v.creator._id &&
                <Button disabled={v.available ? false : true} onClick={onVoteClosing}>종료</Button>
            }
            {props.user._id === v.creator._id &&
                <Button onClick={showConfirm}>삭제</Button>
            }
        </div>
    })

    return (
        <div>
            <button onClick={() => setOpenVoteListModal(true)}><img src={ voteingBox} /></button>
            <Modal
                title='투표'
                visible={openVoteListModal}
                onCancel={() => setOpenVoteListModal(false)}
                footer={[
                    <Button
                        style={{ float: 'left' }}
                        key="register"
                        type="primary"
                        disabled={props.room.creator._id === props.user._id ? false : true}
                        onClick={() => setOpenVoteRegisterModal(true)}
                    >
                        투표 등록
                    </Button>,
                    <Button key="refresh" type="default" onClick={getVotes}>새로고침</Button>,
                    <Button key="cancel" type="default" onClick={() => setOpenVoteListModal(false)}>닫기</Button>
                ]}
            >
                {renderVoteList}
                {vote && <Vote vote={vote} visible={Boolean(vote)} onCancel={() => setVote(false)} user={props.user} />}
            </Modal>

            <Modal
                title='투표 등록'
                visible={openVoteRegisterModal}
                okText='등록'
                onOk={() => {
                    form
                    .validateFields()
                    .then(values => {
                        onVoteRegister(values);
                    })
                    .catch(info => {
                        
                    })
                }}
                cancelText='닫기'
                onCancel={closeVoteRegisterModal}
            >
                <Form form={form} name='vote'>
                    <Form.Item
                        name='voteContent'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <Input name='content' type="text" placeholder='투표 주제를 입력하세요.' value={content} onChange={onChange} />
                    </Form.Item>
                    <Form.List name='options'>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'option']}
                                            rules={[{ required: true, message: '필수 입력 사항입니다.' }]}
                                        >
                                            <Input placeholder='보기를 입력하세요.' />
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

export default VoteList
