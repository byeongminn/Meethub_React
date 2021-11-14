import { Button, Modal, Form, Input, message } from 'antd';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import Question from './Question';

import conversation from "../img/conversation.png";

const { TextArea } = Input;
const { confirm } = Modal;

function QuestionList(props) {
    const [openQuestionListModal, setOpenQuestionListModal] = useState(false);
    const [openQuestionRegisterModal, setOpenQuestionRegisterModal] = useState(false);
    const [form] = Form.useForm();
    const [questions, setQuestions] = useState([]);
    const [question, setQuestion] = useState(false);

    useEffect(() => {
        getQuestions();
    }, [])

    const getQuestions = () => {
        const variables = {
            roomId: props.room._id
        }

        axios.post('/api/questions/getQuestions', variables)
            .then(response => {
                if (response.data.success) {
                    setQuestions(response.data.questions);
                } else {
                    message.error('질문리스트를 받아오는데 실패했습니다.');
                }
            })
    }

    const refreshQuestion = () => {
        getQuestions();
    }

    const onReset = () => {
        form.resetFields();
    }

    const closeQuestionRegisterModal = () => {
        setOpenQuestionRegisterModal(false);
        onReset();
    }

    const onQuestionRegister = (values) => {
        const variables = {
            room: props.room._id,
            questioner: props.user._id,
            title: values.questionTitle,
            content: values.questionContent
        }

        axios.post('/api/questions/register', variables)
            .then(response => {
                if (response.data.success) {
                    message.success('질문이 성공적으로 등록되었습니다.');
                    getQuestions();
                    setTimeout(() => {
                        setOpenQuestionRegisterModal(false);
                        onReset();
                    }, 1000);
                } else {
                    message.error('질문을 등록하는데 실패했습니다.');
                }
            })
    }

    const renderQuestionList = questions && questions.map((v, i) => {
        const onQuestionDelete = () => {
            const variables = {
                questionId: v._id
            }

            axios.post('/api/questions/questionDelete', variables)
                .then(response => {
                    if (response.data.success) {
                        axios.post('/api/answers/answersDelete', variables);    // 질문이 지워질 시 관련 답변 모두 삭제
                        message.success('성공적으로 삭제되었습니다.');
                        getQuestions();
                    } else {
                        message.error('질문을 삭제하는데 실패했습니다.');
                    }
                })
        }

        const showConfirm = () => {
            confirm({
                title: '해당 질문을 삭제하시겠습니까?',
                icon: <ExclamationCircleOutlined />,
                content: '삭제시 해당 질문이 질문 목록에서 삭제됩니다.',
                okText: '삭제',
                okType: 'danger',
                cancelText: '취소',
                onOk() {
                    onQuestionDelete();
                }
            })
        }

        return <div key={i} style={{flexDirection:'column'}}>
            <div style={{display:'flex', flexDirection: 'row', cursor:'pointer'}} onClick={() => setQuestion(v)}><span style={{fontWeight:'bold'}}>질문 : </span>{v.title}</div>
            <div style={{fontSize:'12px'}}>질문을 클릭해 내용을 확인하세요.</div>
            <div>{v.answered ? <span style={{ color: 'green' }}>해결</span> : <span style={{ color: 'red' }}>미해결</span>}</div>
            <div>작성자 : {v.questioner.name}</div>
            <div>{moment(v.createdAt).format('YY-MM-DD')}</div>
            {(props.user._id === v.questioner._id || props.user._id === props.room.creator._id ) &&
                <Button onClick={showConfirm}>삭제</Button>
            }
        </div>
    })

    return (
        <div style={{flexDirection:'column'}}>
            <button onClick={() => setOpenQuestionListModal(true)}><img src={conversation}/></button>
            <Modal
                title='질문 목록'
                visible={openQuestionListModal}
                onCancel={() => setOpenQuestionListModal(false)}
                footer={[
                    <Button
                        style={{ float: 'left' }}
                        key="register"
                        type="primary"
                        onClick={() => setOpenQuestionRegisterModal(true)}
                    >
                        질문 등록
                    </Button>,
                    <Button key="refresh" type="default" onClick={getQuestions}>새로고침</Button>,
                    <Button key="cancel" type="default" onClick={() => setOpenQuestionListModal(false)}>닫기</Button>
                ]}
            >
                {renderQuestionList}
                {question && <Question question={question} visible={Boolean(question)} onCancel={() => setQuestion(false)} user={props.user} room={props.room} refreshQuestion={refreshQuestion}/>}
            </Modal>

            <Modal
                title='질문 등록'
                visible={openQuestionRegisterModal}
                okText='등록'
                onOk={() => {
                    form
                    .validateFields()
                    .then(values => {
                        onQuestionRegister(values);
                    })
                    .catch(info => {
                        
                    })
                }}
                cancelText='닫기'
                onCancel={closeQuestionRegisterModal}
            >
                <Form form={form} name='question'>
                    <Form.Item
                        name='questionTitle'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <Input placeholder='제목을 입력하세요.' />
                    </Form.Item>
                    <Form.Item
                        name='questionContent'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <TextArea rows={4} placeholder='질문을 입력하세요.' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default QuestionList
