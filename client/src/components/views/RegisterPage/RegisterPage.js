import React, { useState } from 'react';
import axios from 'axios';
import './RegisterPage.css'

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
            return alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        let body = {
            name,
            email,
            password
        }

        axios.post("/api/users/register", body)
            .then(response => {
                console.log(response.data);
                if (response.data.success) {
                    props.history.push("/login");
                } else {
                    alert("Failed to sign up.");
                }
            })
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center"
            , width: "100%", height: "100vh"
        }}>
            <div className="LoginBox">
            <div class="LoginTitleDiv">
                    <span class="LoginBoxTitle">MeetHub</span>
                </div>
            <form style={{ display: "flex", flexDirection: "column",width: "40%" }} onSubmit={onSubmit}>
                <label>Name</label>
                <input name="name" type="text" value={name} onChange={onChange} />
                <label>Email</label>
                <input name="email" type="email" value={email} onChange={onChange} />
                <label>Password</label>
                <input name="password" type="password" value={password} onChange={onChange} />
                <label>Confirm Password</label>
                <input name="confirmPassword" type="password" value={confirmPassword} onChange={onChange} />
                <br />
                <button type="submit">
                    회원가입
                </button>
            </form>
            </div>
        </div>
    )
}

export default RegisterPage
