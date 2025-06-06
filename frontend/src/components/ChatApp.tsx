import React, { useEffect, useState } from "react"
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
} from "@mui/material"
import ChatWindow from "./ChatWindow"
import { Friend } from "../types"
import { API_URL } from "../constants"
import {
    genSharedKey, getPrivateKey, convertPublicKey,
    arrayBufferToBase64
} from "../KeyGeneration"
import { useSession } from "./RouteProtected"
import { getCsrfToken } from "../utils"
import PasswordDialog from "./PasswordDialog"

const ChatApp: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const session = useSession()

    const fetchFriends = async () => {
        try {
            const response = await fetch(API_URL + "/api/friends/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            if (response.status == 200) {
                setFriends(await response.json())
            } else {
                if(response.status === 401) {
                    window.location.reload()
                }
                throw new Error("Failed to check friends")
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchFriends()
    }, [])

    const encryptAndSendMessage = async (
        message: string,
        receiverId: number,
        receiverPublicKey: JsonWebKey
    ) => {
        if(!encryptionKey){
            setPasswordDialogOpen(true)
            return
        }
        // get priv key from indexedDB
        const senderPrivKey = await getPrivateKey(Number(session.user?.id), String(session.user?.name), encryptionKey)
        // convert public key into cryptokey from jwk
        const receiverPubKey = await convertPublicKey(receiverPublicKey)

        if (!senderPrivKey || !receiverPubKey) return
        // calculate shared key
        const sharedKey = await genSharedKey(senderPrivKey, receiverPubKey)
        if (!sharedKey) {
            console.log("Error: sharedKey is null")
            return
        }
        const enc = new TextEncoder()

        const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            sharedKey,
            enc.encode(message)
        )
        try {
            const ivBase64 = arrayBufferToBase64(iv)
            const msgBase64 = arrayBufferToBase64(ciphertext)
            const response = await fetch(API_URL + `/api/message/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                credentials: 'include',
                body: JSON.stringify({
                    "receiver_id": receiverId,
                    "content": msgBase64,
                    "iv": ivBase64
                })
            })
            if (response.ok) {
                const data = await response.json()
                console.log(data.detail)
            } else {
                throw new Error("Failed to send message")
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
        <Box display="flex" position="relative" height="100%">
            <Drawer
                anchor="left"
                variant="permanent"
                sx={{
                    '& .MuiDrawer-root': {
                        position: 'absolute'
                    },
                    '& .MuiPaper-root': {
                        position: 'absolute'
                    },
                    height: "100%"
                }}
            >
                <Box width={200}>
                    <Typography align="center" variant="h5" m={2}>Friends</Typography>
                    <List>
                        {friends.map((friend) => (
                            <ListItem key={friend.id}>
                                <ListItemButton onClick={() => {
                                    if(encryptionKey){
                                    setSelectedFriend(friend)
                                    } else {
                                        setPasswordDialogOpen(true)
                                    }
                                    }}>
                                    <ListItemText primary={friend.username} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box flexGrow={1} p={3} ml="200px">
                {selectedFriend ? (
                    <ChatWindow
                        friend={selectedFriend}
                        encryptAndSendMessage={encryptAndSendMessage}
                        encryptionKey={encryptionKey}
                    />
                ) : (
                    <Typography>Select a friend to start chatting</Typography>
                )}
            </Box>
        </Box>
        <PasswordDialog
        open={passwordDialogOpen}
        decrypt={true}
        handlePasswordDialog={setPasswordDialogOpen}
        setEncryptionKey={setEncryptionKey}
        />
        </>
    )
}

export default ChatApp
