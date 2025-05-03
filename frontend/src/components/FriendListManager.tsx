import React, { useEffect, useState } from 'react'
import { API_URL } from '../constants'
import FriendTable from './FriendTable'
import { Friend, FriendRequest } from '../types'
import Alert from '@mui/material/Alert';
import { Snackbar } from '@mui/material';
import { getCsrfToken } from '../utils';


const FriendlistManager = () => {

    const [friends, setFriends] = useState<Friend[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([])

    const [alertOpen, setAlertOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
    const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('info')

    useEffect(() => {
        fetchAllData()
    }, [])


    const fetchAllData = async () => {
        try {
            const [friendsRes, incomingRes, sentRes] = await Promise.all([
                fetch(API_URL + "/api/friends/", { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
                fetch(API_URL + "/api/friendrequest/view/", { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
                fetch(API_URL + "/api/friendrequest/sent/", { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
            ])
            if(friendsRes.status === 401) {
                window.location.reload()
            }
            if (friendsRes.ok) setFriends(await friendsRes.json())
            if (incomingRes.ok) setFriendRequests(await incomingRes.json())
            if (sentRes.ok) setSentFriendRequests(await sentRes.json())
        } catch (error) {
            console.error(error)
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
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    "receiver": receiver
                }),
                credentials: 'include',
            })
            if(response.status === 401) {
                window.location.reload()
            }
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
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    "action": res
                }),
                credentials: 'include',
            })
            if(response.status === 401) {
                window.location.reload()
            }
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
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    "friend": name
                }),
                credentials: 'include',
            })
            if(response.status === 401) {
                window.location.reload()
            }
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
                fetchAllData={fetchAllData}
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