import React, { useEffect } from 'react'
import { API_URL } from '../constants'

const Friendlist = () => {

        useEffect(() => {
            const checkFriends = async () => {
                try {
                    const response = await fetch(API_URL + "/api/friends/", {
                        method: 'GET',
                        credentials: 'include',
                    })
                    if (response.status == 200) {
                        const data = await response.json()
                        console.log(data)
                    
                    } else {
                        throw new Error("Failed token refresh")
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            checkFriends()
        }, [])

    return (
        <h1>lol</h1>
    )
}

export default Friendlist