import React from "react"
import AuthenticationForm from "../components/AuthenticationForm"
import {API_URL} from "../constants"

const Login: React.FC = () => {
    return <AuthenticationForm
        isRegister={false}
        route={`${API_URL}/api/token/`}
    />

}

export default Login