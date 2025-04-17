import React, { useEffect, useState } from 'react'
import { API_URL } from '../constants'
import FriendTable from './FriendTable'
import { Friend, FriendRequest } from '../types'
import Alert from '@mui/material/Alert';
import { Snackbar } from '@mui/material';


const FriendlistManager = () => {

    const [friends, setFriends] = useState<Friend[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([])

    const [alertOpen, setAlertOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
    const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('info')

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
            setAlertMessage(data.detail)
            setAlertSeverity(response.ok ? 'success' : 'error')
            setAlertOpen(true)
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
            setAlertMessage(data.detail)
            setAlertSeverity(response.ok ? 'success' : 'error')
            setAlertOpen(true)
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
            setAlertMessage(data.detail)
            setAlertSeverity(response.ok ? 'success' : 'error')
            setAlertOpen(true)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
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
            <Snackbar
                open={alertOpen}
                autoHideDuration={4000}
                onClose={() => setAlertOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setAlertOpen(false)}
                    severity={alertSeverity}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </>

    )
}

export default FriendlistManager