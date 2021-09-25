import { useState, useEffect } from "react";
import axios from "axios";

export default function (SpecificComponent, option, adminRoute = null) {
    function AuthenticationCheck(props) {
        const [user, setUser] = useState({});

        useEffect(() => {
            axios.get("/api/users/auth")
                .then(response => {
                    setUser(response.data);
                    if (!response.data.isAuth) {
                        if (option) {
                            props.history.push("/login");
                        }
                    } else {
                        if (adminRoute && !response.data.isAdmin) {
                            props.history.push("/");
                        } else {
                            if (option === false) {
                                props.history.push("/");
                            }
                        }
                    }
                })
        }, [])

        return (
            <SpecificComponent {...props} user={user}/>
        )
    }

    return AuthenticationCheck;
}