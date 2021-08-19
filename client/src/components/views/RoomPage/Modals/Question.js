import React, { useState, useEffect } from 'react';
import { Modal } from "antd";
import "./Question.css";
import axios from 'axios';

function MakeRoom(props) {
    const [content, setContent] = useState("");

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setContent(value);
    }
    
    const onOk = () => {
        
    }

    return (
        <div>
            <Modal title="question" visible={props.visible} onOk={onOk} onCancel={props.onCancel} >
                <label>질문을 작성하세요.</label>
                <textarea cols="50" rows="10" required value={content} />
            </Modal>
        </div>
    )
}

export default MakeRoom
