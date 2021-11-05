import React, { useState } from 'react';
import { Input, message, Modal, Radio, Form } from "antd";
import axios from 'axios';

function MakeRoom(props) {
    const [roomName, setRoomName] = useState("");
    const [roomDescription, setRoomDescription] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    const [lock, setLock] = useState(false);
    const [form] = Form.useForm();

    const onChange = (event) => {
        const {
            target: { name, value }
        } = event;
        if (name === 'roomName') {
            setRoomName(value);
        } else if (name === 'roomDescription') {
            setRoomDescription(value);
        } else if (name === 'roomPassword') {
            setRoomPassword(value);
        } else if (name === 'lock') {
            setLock(value);
            if (!lock) {
                setRoomPassword('');
            }
        }
    }

    const onOk = (values) => {
        if (props.user.isAuth) {
            const variables = {
                creator: props.user._id,
                roomName: values.roomName,
                roomDescription: values.roomDescription,
                roomPassword,
                manager: props.user.email
            }
            axios.post('/api/rooms/make', variables)
                .then(response => {
                    if (!response.data.exist) {
                        if (response.data.success) {
                            props.history.push(`/rooms/${response.data.roomId}`);
                        } else {
                            message.error('양식에 맞게 입력해주세요.');
                        }
                    } else {
                        message.error(response.data.message);
                    }
                })
        } else {
            props.history.push("/login");
        }
    }

    return (
        <div>
            <Modal
                title="방 만들기"
                visible={props.visible}
                onOk={() => {
                    form
                        .validateFields()
                        .then(values => {
                            onOk(values);
                        })
                        .catch(info => {
                            message.error('필수 입력 사항들을 모두 입력해주세요.');
                        })
                }}
                onCancel={props.onCancel}
            >
                <Form
                    form={form}
                    name='roomMake'
                >
                    <Form.Item
                        label='방 제목'
                        name='roomName'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' },
                            { max: 20, message: '방 제목은 20자 이내여야 합니다.' }
                        ]}
                    >
                        <Input name='roomName' type="text" placeholder='방 제목을 입력해주세요. (20자 이내)' value={roomName} onChange={onChange} />
                    </Form.Item>
                    <Form.Item
                        label='방 정보'
                        name='roomDescription'
                        hasFeedback
                        rules={[
                            { required: true, message: '필수 입력 사항입니다.' },
                            { max: 50, message: '방 정보는 50자 이내여야 합니다.' }
                        ]}
                    >
                        <Input name='roomDescription' type='text' placeholder='방에 대한 정보를 입력해주세요. (50자 이내)' value={roomDescription} onChange={onChange} />
                    </Form.Item>
                    {lock &&
                        <Form.Item
                            label='비밀번호'
                            name='roomPassword'
                            hasFeedback
                            rules={[
                                { required: lock ? true : false, message: '필수 입력 사항입니다.' },
                                { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.' }
                            ]}
                        >
                            <Input name='roomPassword' type='password' placeholder='비밀번호를 입력해주세요. (최소 6자 이상)' value={roomPassword} onChange={onChange} />
                        </Form.Item>
                    }
                    <Radio.Group name='lock' value={lock} onChange={onChange}>
                        <Radio value={false}>공개</Radio>
                        <Radio value={true}>비공개</Radio>
                    </Radio.Group>
                </Form>
            </Modal>
        </div>
    )
}

export default MakeRoom
