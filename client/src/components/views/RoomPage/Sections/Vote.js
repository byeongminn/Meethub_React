import React, { useEffect, useState } from 'react';
import { Input, message, Modal, Form, Button, Space, Radio } from "antd";
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

function Vote(props) {
    const [form] = Form.useForm();
    const [vote, setVote] = useState(0);                            // 몇번을 투표했는가?
    const [options, setOptions] = useState(props.vote.options);     // 투표 보기들
    const [voted, setVoted] = useState(props.vote.voted);           // 이미 투표한 명단
    const [voteCheck, setVoteCheck] = useState(false);              // 투표했는지 체크 [ true: 투표함, false: 투표안함 ]

    /* Chart Part */
    const [labels, setLabels] = useState([]);
    const [datas, setDatas] = useState([]);

    useEffect(() => {
        voted.map((v, i) => {
            if (v === props.user.email) {
                setVoteCheck(true);
            }
        })

        initLabels();
    }, [])

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setVote(value);
    }

    const onVoteSubmit = (values) => {
        options[vote].count++;
        voted.push(props.user.email);

        const variables = {
            voteId: props.vote._id,
            options,
            voted
        }

        axios.post('/api/votes/voteUpdate', variables)
            .then(response => {
                if (response.data.success) {
                    message.success("성공적으로 제출되었습니다.");
                    setTimeout(() => {
                        props.onCancel();
                    }, 1000)
                } else {
                    message.error('투표 제출에 실패했습니다.');
                }
            })
    }

    /* Chart Part */
    const initLabels = () => {
        const tmpLabels = new Array();
        const tmpDatas = new Array();
        
        options.map((v, i) => {
            tmpLabels.push(v.option);
            tmpDatas.push(v.count);
        })

        setLabels(tmpLabels);
        setDatas(tmpDatas);
    }

    return (
        <div>
            {props.vote.available ? 
                <Modal
                    title={props.vote.content}
                    visible={props.visible}
                    footer={[
                        <Button key="voteSubmit" type="primary" disabled={voteCheck} onClick={onVoteSubmit}>투표 제출</Button>,
                        <Button key="cancel" type="default" onClick={props.onCancel}>닫기</Button>
                    ]}
                    onCancel={props.onCancel}
                >
                    <Form
                        form={form}
                        name='vote'
                    >
                        <Radio.Group name='vote' value={vote} onChange={onChange}>
                            {props.vote.options.map((v, i) => (
                                <Radio key={i} value={i}>{v.option}</Radio>
                            ))}
                        </Radio.Group>
                    </Form>
                </Modal>
                :
                <Modal
                    title={props.vote.content}
                    visible={props.visible}
                    footer={[
                        <Button key="cancel" type="default" onClick={props.onCancel}>닫기</Button>
                    ]}
                    onCancel={props.onCancel}
                >
                    {labels &&
                        <Bar
                            data={{
                                labels: labels,
                                datasets: [{
                                    label: '투표 수',
                                    data: datas,
                                    backgroundColor: 'skyblue'
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        ticks: {
                                            stepSize: 1
                                        }
                                    }
                                }
                            }}
                        >
                        </Bar>
                    }
                </Modal>
            }
        </div>
    )
}

export default Vote
