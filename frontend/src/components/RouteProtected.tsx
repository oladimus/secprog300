import React, { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants'
import { useEffect, useState } from 'react'
import Home from '../pages/Home'

const BASE_URL = `http://localhost:8000/api/`

interface RouteProtectedProps {
    children: ReactNode
}

const RouteProtected: React.FC<RouteProtectedProps> = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAuthentication()
    }, [])

    const checkAuthentication = async () => {
        try {
            const response = await fetch(BASE_URL + "auth-check/", {
                method: 'GET',
                credentials: 'include',
            })
            if (response.status == 200) {
                console.log("Authorization success")
                setIsAuthorized(true)
            } else {
                throw new Error("Failed token refresh")
            }

        } catch (error) {
            console.log(error)
            setIsAuthorized(false)
        } finally {
            setIsLoading(false)
        }
    }


    if (isLoading) {
        return <div>Loading...</div>
    }

    return isAuthorized ? children : <Navigate to="/login" />

}

export default RouteProtected