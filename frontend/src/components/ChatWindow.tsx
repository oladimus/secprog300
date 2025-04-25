import React, { useEffect, useRef, useState } from "react"
import { API_URL } from "../constants"
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
} from "@mui/material"
import { Friend, Message } from "../types"
import { convertPublicKey, decryptMessages, genSharedKey, getPrivateKey } from "./KeyGeneration"
import { useSession } from "./RouteProtected"


interface ChatWindowProps {
    friend: Friend
    encryptAndSendMessage: (
        message: string,
        receiverId: number,
        receiverPublicKey: JsonWebKey
    ) => Promise<void>
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    friend,
    encryptAndSendMessage
}) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")

    const session = useSession()

    const sendMessage = async () => {
        if (!newMessage.trim()) return
        // Send encrypted message to backend
        await encryptAndSendMessage(newMessage, friend.id, friend.e2ee_public_key)
        setNewMessage("")
        fetchMessages(friend.id)

    }
    const getSharedKey = async () => {
        // get priv key from indexedDB
        const senderPrivKey = await getPrivateKey(Number(session.user?.id), String(session.user?.name))
        // convert public key into cryptokey from jwk
        const receiverPubKey = await convertPublicKey(friend.e2ee_public_key)

        if (!senderPrivKey || !receiverPubKey) {
            console.log("FAIL")
            return
        }
        // calculate shared key
        const sharedKey = await genSharedKey(senderPrivKey, receiverPubKey)
        return sharedKey
    }

    const handleDecryptMessages = async () => {
        const sharedKey = await getSharedKey()
        if (sharedKey) {
            const decryptedMsgs = await decryptMessages(messages, sharedKey)
            setMessages(decryptedMsgs)
        }
    }

    const fetchMessages = async (id: number) => {
        try {
            const response = await fetch(API_URL + `/api/message/?with=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',

            })
            if (response.status == 200) {
                const data = await response.json()
                setMessages(data)
                console.log(data)
            } else {
                throw new Error("Failed to check friends")
            }
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        fetchMessages(friend.id)
    }, [friend])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <Box ref={bottomRef} >
            <Typography variant="h5" gutterBottom>
                Chat with {friend.username}
                <Button 
                variant="contained"
                sx={{ml: "10px"}}
                onClick={() => fetchMessages(friend.id)}>
                    REFRESH
                </Button>
            </Typography>
            <List sx={{ maxHeight: "500px", overflowY: "auto", mb: 2, minHeight: "500px" }}>
                {messages.map((msg, idx) => (
                    <ListItem key={idx} sx={{ justifyContent: msg.sender.id !== friend.id ? "flex-end" : "flex-start" }}>
                        <ListItemText ref={bottomRef}
                            sx={{
                                maxWidth: "60%",
                                bgcolor: msg.sender.id !== friend.id ? "blue" : "red",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",

                            }}
                            primary={msg.content}
                        />
                    </ListItem>
                ))}
            </List>
            <Box display="flex" gap={2}>
                <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            await sendMessage()
                            e.preventDefault()
                        }
                    }
                    }
                />
                <Button variant="contained" onClick={sendMessage}>
                    SEND
                </Button>
                <Button onClick={handleDecryptMessages} >
                    DECRYPT
                </Button>
            </Box>
        </Box>
    )
}

export default ChatWindow