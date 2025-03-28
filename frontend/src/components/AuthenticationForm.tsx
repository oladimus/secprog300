import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"


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
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const fetchAuthentication = async () => {
        try {
            const response = await fetch(route, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            })
            if (response.ok && !isRegister) {
                navigate("/")
            } else {
                navigate("/login")
            }
        } catch (error) {
            alert(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        setLoading(true)
        e.preventDefault()
        fetchAuthentication()
    }

    return <form onSubmit={handleSubmit} className="form-container">
        <h1>{isRegister ? "Register" : "Login"}</h1>
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
    </form >
}


export default AuthenticationForm