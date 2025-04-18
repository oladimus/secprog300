import React, { useEffect, useRef, useState } from "react"
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
} from "@mui/material"
import { Friend } from "../types"

interface Message {
    sender: "me" | "friend"
    content: string
}

interface ChatWindowProps {
    friend: Friend
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    friend
}) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);

    
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")

    const sendMessage = () => {
        if (!newMessage.trim()) return
        setMessages([...messages, { sender: "me", content: newMessage }])
        setNewMessage("")
        // You'd also send the message to backend here
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]); 

    return (
        <Box ref={bottomRef} >
            <Typography variant="h5" gutterBottom>
                Chat with {friend.username}
            </Typography>
            <List sx={{ maxHeight: "500px", overflowY: "auto", mb: 2, minHeight: "500px" }}>
                {messages.map((msg, idx) => (
                    <ListItem key={idx} sx={{ justifyContent: msg.sender === "me" ? "flex-end" : "flex-start" }}>
                        <ListItemText ref={bottomRef}
                            sx={{
                                maxWidth: "60%",
                                bgcolor: msg.sender === "me" ? "blue" : "red",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
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
                    onKeyDown={(e) => {
                        if(e.key === "Enter"){
                            sendMessage()
                            e.preventDefault()
                        }}
                    }
                />
                <Button variant="contained" onClick={sendMessage}>
                    Send
                </Button>
            </Box>
        </Box>
    )
}

export default ChatWindow