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
    Checkbox,
} from "@mui/material"
import { Friend, Message } from "../types"
import { convertPublicKey, decryptMessages, genSharedKey, getPrivateKey } from "../KeyGeneration"
import { useSession } from "./RouteProtected"


interface ChatWindowProps {
    friend: Friend
    encryptAndSendMessage: (
        message: string,
        receiverId: number,
        receiverPublicKey: JsonWebKey
    ) => Promise<void>
    encryptionKey: CryptoKey | null
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    friend,
    encryptAndSendMessage,
    encryptionKey
}) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [decrypted, setDecrypted] = useState(false)
    const [autoDecrypt, setAutoDecrypt] = useState(true)

    const session = useSession()

    const sendMessage = async () => {
        if (!newMessage.trim()) {
            setNewMessage("")
            return
        }
        if (!friend.e2ee_public_key) {
            console.log("Error: public_key is null")
            return
        }
        // Encrypt message and send to backend
        await encryptAndSendMessage(newMessage, friend.id, friend.e2ee_public_key)
        setNewMessage("")
        await fetchMessages(friend.id)

    }
    const getSharedKey = async () => {
        // get priv key from indexedDB
        const senderPrivKey = await getPrivateKey(Number(session.user?.id), String(session.user?.name), encryptionKey!)
        // convert public key into cryptokey from jwk
        const receiverPubKey = await convertPublicKey(friend.e2ee_public_key)

        if (!senderPrivKey || !receiverPubKey) {
            console.log("Error: senderPrivKey or receiverPubKey is null")
            return
        }
        // calculate shared key
        const sharedKey = await genSharedKey(senderPrivKey, receiverPubKey)
        return sharedKey
    }

    const handleDecryptMessages = async (data: Message[]) => {
        if (decrypted) {
            return
        }
        const sharedKey = await getSharedKey()
        if (sharedKey) {
            const decryptedMsgs = await decryptMessages(data, sharedKey)
            return decryptedMsgs
        }
    }

    const fetchMessages = async (id: number) => {
        setDecrypted(false)
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
                if (autoDecrypt) {
                    await handleDecryptMessages(data)
                }
                setMessages(data)
            } else {
                if(response.status === 401) {
                    window.location.reload()
                }
                throw new Error("Failed to fetch messages")
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

    // Fetch messages every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages(friend.id)
        }, 5000)

        return () => clearInterval(interval)
    }, [autoDecrypt])

    return (
        <Box ref={bottomRef} >
            <Typography variant="h5" gutterBottom>
                Chat with {friend.username}
                <Button
                    variant="contained"
                    sx={{ ml: "10px" }}
                    onClick={async () => await fetchMessages(friend.id)}>
                    <strong>REFRESH</strong>
                </Button>
                <Checkbox
                    checked={autoDecrypt}
                    onChange={(e) => setAutoDecrypt(e.target.checked)}
                />
                Auto Decrypt
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
                <Button variant="contained" onClick={async () => await sendMessage()}>
                    SEND
                </Button>
                <Button disabled={autoDecrypt} onClick={async () => {
                    const msgs = await handleDecryptMessages(messages)
                    if (msgs) {
                        setMessages(msgs)
                        setDecrypted(true)
                    }
                }}
                >
                    DECRYPT
                </Button>
            </Box>
        </Box>
    )
}

export default ChatWindow