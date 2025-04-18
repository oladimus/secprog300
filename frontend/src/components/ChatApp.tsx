import React, { useRef, useState } from "react"
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

const dummyFriends: Friend[] = [
    { id: 1, username: "alice" },
    { id: 2, username: "bob" },
    { id: 3, username: "charlie" },
]

const ChatApp: React.FC = () => {
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    return (
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
                        {dummyFriends.map((friend) => (
                            <ListItem key={friend.id}>
                                <ListItemButton onClick={() => setSelectedFriend(friend)}>
                                    <ListItemText primary={friend.username} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box flexGrow={1} p={3} ml="200px">
                {selectedFriend ? (
                    <ChatWindow friend={selectedFriend} />
                ) : (
                    <Typography>Select a friend to start chatting</Typography>
                )}
            </Box>
        </Box>
    )
}

export default ChatApp
