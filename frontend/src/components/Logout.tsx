import React, { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Register from '../pages/Register'
const BASE_URL = `http://localhost:8000/api/`

interface LogoutProps {
    route: string
    children: ReactNode
}

const Logout: React.FC<LogoutProps> = ({
    route, children
}) => {
    const navigate = useNavigate()

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const res = await fetch(BASE_URL + "user/logout/", {
                    method: 'GET',
                    credentials: 'include',
                })
                if (res.status == 200) {
                    if (route === "/login") {
                        navigate(route)
                    }
                } else {
                    console.error("Logout failed")
                }
            } catch (error) {
                console.error(error)
            }
        }
        handleLogout()
    }, [navigate])

    return children

}

export default Logout
