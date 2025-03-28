import React, { ReactElement } from "react"
import AuthenticationForm from "../components/AuthenticationForm"

const Login: React.FC = () => {
    return <AuthenticationForm
        isRegister={false}
        route="http://localhost:8000/api/token/"
    />

}

export default Login