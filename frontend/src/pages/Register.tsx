import React, { ReactElement } from "react"
import AuthenticationForm from "../components/AuthenticationForm"


const Register = () => {
    return <AuthenticationForm
        isRegister={true}
        route="http://localhost:8000/api/user/register/"
    />
}

export default Register