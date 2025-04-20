import React, { createContext, ReactNode, useContext } from 'react'
import { Navigate} from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from '../constants'



interface Session {
    user?: {
        id?: string | null;
        name?: string | null;
        image?: string | null;
        email?: string | null;
    } 
}

const SessionContext = createContext<Session>({});

export const useSession = () => useContext(SessionContext);

interface RouteProtectedProps {
    children: ReactNode
}
const RouteProtected: React.FC<RouteProtectedProps> = ({children}) => {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [session, setSession] = useState<Session['user']>();

    useEffect(() => {
        refreshToken()
    }, [])

    
    const refreshToken = async () => {
        try {
            await fetch(API_URL + "/api/token/refresh/", {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'include',
            })
            checkAuthentication()
        } catch (error) {
            console.log(error)
        }
    }
    const checkAuthentication = async () => {
        try {
            const response = await fetch(API_URL + "/api/auth-check/", {
                method: 'GET',
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setSession(data)
                console.log("Authorization success")
                setIsAuthorized(true)
            
            } else {
                throw new Error("Failed authorization")
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

    return isAuthorized ? (
        <SessionContext.Provider value={{ user: session }}>
          {children}
        </SessionContext.Provider>
      ) : (
        <Navigate to="/authenticate/login" />
      );

}

export default RouteProtected