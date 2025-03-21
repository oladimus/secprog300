import React from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants'
import { useEffect, useState } from 'react'
import Home from '../pages/Home'

const BASE_URL = `http://localhost:8000/api/token/`

const RouteProtected: React.FC = () => {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        auth().catch(() => {
            setIsAuthorized(false)
            setIsLoading(false)
        })
    }, [])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)
        try {
            const response = await fetch(BASE_URL + "refresh/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                localStorage.setItem(ACCESS_TOKEN, data.ACCESS_TOKEN)
                console.log("Authorization success")
                setIsAuthorized(true)
            } else {
                console.error("Failed token refresh")
                setIsAuthorized(false)
            }

        } catch (error) {
            console.log(error)
            setIsAuthorized(false)
        } finally {
            setIsLoading(false)
        }
    }

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (!token) {
            setIsAuthorized(false)
            return
        }

        const decoded = jwtDecode(token)
        const tokenExpiration = decoded.exp
        const now = Date.now() / 1000

        if (tokenExpiration && tokenExpiration < now) {
            await refreshToken()
        } else {
            setIsAuthorized(true)
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return isAuthorized ? <Home /> : <Navigate to="/login" />

}

export default RouteProtected