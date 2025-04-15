import React, { useEffect, useState } from 'react'
import { API_URL } from '../constants'
import FriendTable from './FriendTable'
import { Friend, FriendRequest } from '../types'

const FriendlistManager = () => {

    const [friends, setFriends] = useState<Friend[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([])

    useEffect(() => {
        checkFriends()
        checkIncomingFriendRequests()
        checkSentFriendRequests()
    }, [])

    useEffect(() => {
        console.log("Friends state updated:", friends)
        console.log("FriendRequests state updated:", friendRequests)
        console.log("SentFriendRequests state updated:", sentFriendRequests)
    }, [friends])

    const checkFriends = async () => {
        try {
            const response = await fetch(API_URL + "/api/friends/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setFriends(data)
            } else {
                throw new Error("Failed to check friends")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkIncomingFriendRequests = async () => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/view/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setFriendRequests(data)

            } else {
                console.log(response)
                throw new Error("Failed to check inc requests")
            }
        } catch (error) {
            console.log(error)
        }
    }
    const checkSentFriendRequests = async () => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/sent/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            if (response.status == 200) {
                const data = await response.json()
                setSentFriendRequests(data)

            } else {
                throw new Error("Failed to check sent requests!")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const sendFriendRequest = async (
        receiver: string,
    ) => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/send/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "receiver": receiver
                }),
                credentials: 'include',
            })
            const data = await response.json()
            if (!response.ok) {
                alert(data.detail)
                throw new Error("Failed to send friend request")
            }
            alert("Friendrequest sent!")
        } catch (error) {
            console.log(error)
        }
    }

    const respondFriendRequest = async (
        res: string,
        reqId: number
    ) => {
        try {
            const response = await fetch(API_URL + "/api/friendrequest/respond/" + reqId + "/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "action": res
                }),
                credentials: 'include',
            })
            const data = await response.json()
            alert(data.detail)
        } catch (error) {
            console.log(error)
        }
    }

    const deleteFriend = async (
        name: string
    ) => {
        try {
            const response = await fetch(API_URL + "/api/friend/delete/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "friend": name
                }),
                credentials: 'include',
            })
            const data = await response.json()
            alert(data.detail)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <FriendTable
            friends={friends}
            friendRequests={friendRequests}
            sentFriendRequests={sentFriendRequests}
            sendFriendRequest={sendFriendRequest}
            respondFriendRequest={respondFriendRequest}
            deleteFriend={deleteFriend}
            checkFriends={checkFriends}
            checkIncomingFriendRequests={checkIncomingFriendRequests}
            checkSentFriendRequests={checkSentFriendRequests}
        />
    )
}

export default FriendlistManager