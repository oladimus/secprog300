import React, { useEffect, useState } from 'react'
import { API_URL } from '../constants'
import FriendTable from './FriendTable'
import { Friend, FriendRequest } from '../types'
const FriendlistManager = () => {

    const [friends, setFriends] = useState<Friend[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])

    useEffect(() => {
        checkFriends()
        checkFriendRequests()
    }, [])
    
    useEffect(() => {
        console.log("Friends state updated:", friends)
        console.log("FriendRequests state updated:", friendRequests)
    }, [friends])
    
    const checkFriends = async () => {
        try {
            const response = await fetch(API_URL + "/api/friends/", {
                method: 'GET',
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                console.log(data)
                setFriends(data)
            } else {
                throw new Error("Failed token refresh")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkFriendRequests = async () => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/view/", {
                method: 'GET',
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setFriendRequests(data)

            } else {
                throw new Error("Failed token refresh")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const sendFriendRequest = async () => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/view/", {
                method: 'POST',
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setFriendRequests(data)

            } else {
                throw new Error("Failed token refresh")
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <FriendTable 
        friends={friends}
        friendRequests={friendRequests}
        />
    )
}

export default FriendlistManager