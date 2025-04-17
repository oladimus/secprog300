import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/form.css"
interface AuthenticationFormProps {
    isRegister: boolean;
    route: string;
}

const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
    isRegister,
    route,
}) => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    const navigate = useNavigate()

    const fetchAuthentication = async () => {
        try {
            const response = await fetch(route, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "username": username, "password": password }),
                credentials: 'include',
            })
            if (!response.ok) {
                const errorData = await response.json()
                console.log(errorData)
                let errormsg = ""
                if (isRegister) {
                    if (response.status === 403) {
                        errormsg = "Too many registers!"
                    } else {
                        if(errorData?.username) {
                            errormsg = errorData.username
                        } else if (errorData?.password) {
                            errormsg = errorData.password.join(' ')
                        }
                    }
                } else {
                    errormsg = errorData.detail
                }
                setErrorMsg(errormsg)
            } else {
                if (!isRegister) {
                    navigate("/")
                } else {
                    navigate("/authenticate/login")
                }
            }
        } catch (error) {
            alert(error)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(username && password)
            fetchAuthentication()
        else setErrorMsg("Cannot have empty fields!")
    }

    return <form onSubmit={handleSubmit} className="form-container">
        <h1>{isRegister ? "Register" : "Login"}</h1>
        <h3>{errorMsg}</h3>
        <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
        />
        <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
        />
        <button className="form-button" type="submit">
            {isRegister ? "Register" : "Login"}
        </button>
        <button
            className="toggle-button"
            onClick={isRegister ? () => navigate("/authenticate/login") : () => navigate("/authenticate/register")}
            type="button"
        >
            {isRegister ? "Login instead" : "Register instead"}
        </button>
    </form >

}


export default AuthenticationForm