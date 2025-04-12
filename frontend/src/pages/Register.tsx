import React from "react"
import AuthenticationForm from "../components/AuthenticationForm"
import {API_URL} from "../constants"


const Register = () => {
    return <AuthenticationForm
        isRegister={true}
        route = {`${API_URL}/api/user/register/`}
    />
}

export default Register