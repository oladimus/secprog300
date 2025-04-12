import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../constants'


const Logout = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const res = await fetch(API_URL + "/api/user/logout/", {
                    method: 'GET',
                    credentials: 'include',
                })
                if (res.status == 200) {
                    navigate("/login")
                } else {
                    console.error("Logout failed")
                }
            } catch (error) {
                console.error(error)
            }
        }
        handleLogout()
    }, [navigate])

}

export default Logout
