import React, { useState } from 'react';
import axios from 'axios';

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

        axios.post("/api/users/login", body)
            .then(response => {
                console.log(response.data);
                if (response.data.loginSuccess) {
                    props.history.push("/");
                } else {
                    alert("Error");
                }
            })
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center"
            , width: "100%", height: "100vh"
        }}>
            <form style={{ display: "flex", flexDirection: "column" }} onSubmit={onSubmit}>
                <label>Email</label>
                <input name="email" type="email" value={email} onChange={onChange} />
                <label>Password</label>
                <input name="password" type="password" value={password} onChange={onChange} />
                <br />
                <button type="submit">
                    로그인
                </button>
            </form>
        </div>
    )
}

export default LoginPage
