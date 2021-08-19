import { useEffect } from "react";
import axios from "axios";

export default function (SpecificComponent, option, adminRoute = null) {
    function AuthenticationCheck(props) {
        useEffect(() => {
            axios.get("/api/users/auth")
                .then(response => {
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
            <SpecificComponent {...props}/>
        )
    }

    return AuthenticationCheck;
}