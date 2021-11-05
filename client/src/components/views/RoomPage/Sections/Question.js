import { Button, Modal, Form, Input, message } from 'antd';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { confirm } = Modal;

function Question(props) {
    const [form] = Form.useForm();
    const [answers, setAnswers] = useState([]);

    useEffect(() => {
        getAnswers();
    }, []);

    const getAnswers = () => {
        const variables = {
            questionId: props.question._id
        }

        axios.post('/api/answers/getAnswers', variables)
            .then(response => {
                if (response.data.success) {
                    setAnswers(response.data.answers);
                } else {
                    message.error('답변 리스트를 받아오는데 실패했습니다.');
                }
            })
    }

    const onReset = () => {
        form.resetFields();
    }

    const onAnswer = (values) => {
        const variables = {
            question: props.question._id,
            answerer: props.user._id,
            title: values.answerTitle,
            content: values.answerContent
        }

        axios.post('/api/answers/register', variables)
            .then(response => {
                if (response.data.success) {
                    message.success('답변이 성공적으로 등록되었습니다.');
                    onReset();

                    axios.post('/api/questions/answered', variables);
                    getAnswers();
                    props.refreshQuestion();
                } else {
                    message.error('답변을 등록하는데 실패했습니다.');
                }
            })
    }

    const renderAnswers = answers && answers.map((v, i) => {
        const onAnswerDelete = () => {
            const variables = {
                answerId: v._id
            }

            axios.post('/api/answers/answerDelete', variables)
                .then(response => {
                    if (response.data.success) {
                        message.success('성공적으로 삭제되었습니다.');
                        getAnswers();
                    } else {
                        message.error('답변을 삭제하는데 실패했습니다.');
                    }
                })
        }

        const showConfirm = () => {
            confirm({
                title: '해당 답변을 삭제하시겠습니까?',
                icon: <ExclamationCircleOutlined />,
                content: '삭제시 해당 답변이 답변 목록에서 삭제됩니다.',
                okText: '삭제',
                okType: 'danger',
                cancelText: '취소',
                onOk() {
                    onAnswerDelete();
                }
            })
        }

        return <div key={i}>
            <div>{v.title}</div>
            <div>{v.content}</div>
            <div>{v.answerer.name}</div>
            <div>{moment(v.createdAt).format('YYYY-MM-DD')}</div>
            {(props.user._id === v.answerer._id || props.user._id === props.room.creator._id ) &&
                <Button onClick={showConfirm}>삭제</Button>
            }
        </div>
    })

    return (
        <div>
            <Modal
                title='질문'
                visible={props.visible}
                footer={[
                    <Button key="cancel" type="default" onClick={props.onCancel}>닫기</Button>
                ]}
                onCancel={props.onCancel}
            >
                <div>
                    <div>{props.question.title}</div>
                    <div>{props.question.content}</div>
                    <div>{props.question.questioner.name}</div>
                    <div>{moment(props.question.createdAt).format('YYYY-MM-DD')}</div>
                </div>

                {renderAnswers}

                <Form form={form} name='answer' onFinish={onAnswer}>
                    <Form.Item
                        name='answerTitle'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <Input placeholder='제목을 입력하세요.' />
                    </Form.Item>
                    <Form.Item
                        name='answerContent'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' }
                        ]}
                    >
                        <TextArea rows={4} placeholder='답변을 입력하세요.' />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">답변달기</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default Question
