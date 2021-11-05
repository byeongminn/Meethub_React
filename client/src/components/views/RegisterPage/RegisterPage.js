import React, { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';

function RegisterPage(props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const onChange = (event) => {
        const {
            target: { name, value }
        } = event;
        if (name === "name") {
            setName(value);
        } else if (name === "email") {
            setEmail(value);
        } else if (name === "password") {
            setPassword(value);
        } else if (name === "confirmPassword") {
            setConfirmPassword(value);
        }
    }

    const onSubmit = (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            return message.error("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        let body = {
            name,
            email,
            password
        }

        axios.post("/api/users/register", body)
            .then(response => {
                if (response.data.success) {
                    props.history.push("/login");
                } else {
                    message.error(response.data.message);
                }
            })
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center"
            , width: "100%", height: "100vh"
        }}>
            <form style={{ display: "flex", flexDirection: "column" }} onSubmit={onSubmit}>
                <label>이름</label>
                <input name="name" type="text" value={name} onChange={onChange} />
                <label>이메일</label>
                <input name="email" type="email" value={email} onChange={onChange} />
                <label>비밀번호</label>
                <input name="password" type="password" value={password} onChange={onChange} />
                <label>비밀번호 확인</label>
                <input name="confirmPassword" type="password" value={confirmPassword} onChange={onChange} />
                <br />
                <button type="submit">
                    회원가입
                </button>
            </form>
        </div>
    )
}

export default RegisterPage
