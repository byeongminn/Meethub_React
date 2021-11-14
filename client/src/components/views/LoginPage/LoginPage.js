import React, { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';
import './LoginPage.css'

function LoginPage(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onChange = (event) => {
        const {
            target: { name, value }
        } = event;
        if (name === "email") {
            setEmail(value);
        } else if (name === "password") {
            setPassword(value);
        }
    }

    const onSubmit = (event) => {
        event.preventDefault();

        let body = {
            email,
            password
        }

        if(email.length === 0){
            return message.error("이메일을 입력해주세요.");
        }

        if(password.length === 0){
            return message.error("패스워드를 입력해주세요.");
        }

        axios.post("/api/users/login", body)
            .then(response => {
                if (response.data.loginSuccess) {
                    props.history.push("/");
                } else {
                    message.error(response.data.message);
                }
            })
    }

    const onRegistrer = () => {
        props.history.push("/register");
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center"
            , width: "100%", height: "100vh"
        }}>
            <div className="loginDiv">
                <div className="loginTitle">
                    <span>MeetHub</span>
                </div>
                <form style={{ display: "flex", flexDirection: "column" }} onSubmit={onSubmit}>
                    <label>이메일</label>
                    <input name="email" type="email" value={email} onChange={onChange} />
                    <label>비밀번호</label>
                    <input name="password" type="password" value={password} onChange={onChange} />
                    <br />
                    <button type="submit">
                        로그인
                    </button>
                    <button onClick={onRegistrer}>
                        회원가입
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
