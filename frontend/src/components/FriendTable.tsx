import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Friend, FriendRequest } from '../types'
import { Check, Clear, Delete, PersonAdd, TableRows } from '@mui/icons-material'

interface FriendTableProps {
    friends: Friend[]
    friendRequests: FriendRequest[]
    sentFriendRequests: FriendRequest[]
    sendFriendRequest: (
        receiver: string,
    ) => Promise<void>
    respondFriendRequest: (
        response: string,
        reqId: number
    ) => Promise<void>
    deleteFriend: (
        name: string,
    ) => Promise<void>
    fetchAllData: () => Promise<void>
}
const FriendTable: React.FC<FriendTableProps> = ({
    friends,
    friendRequests,
    sentFriendRequests,
    sendFriendRequest,
    respondFriendRequest,
    deleteFriend,
    fetchAllData,
}) => {

    const [showWhat, setShowWhat] = useState<"friends" | "friend requests">("friends")
    const [writtenUser, setWrittenUser] = useState<string>("")

    const handleShowView = () => {
        if (showWhat === "friends") {
            setShowWhat("friend requests")
        } else {
            setShowWhat("friends")
        }

    }

    const cleanDate = (date: string) => {
        return new Date(date).toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
    }

    return (
        <>
            <Box marginBottom={2}>
                <TextField label="Enter User" sx={{ marginRight: 1 }} variant='outlined'
                    onChange={(e) => {
                        setWrittenUser(e.target.value)
                    }}
                />

                <Button sx={{ padding: 2 }} variant='contained'
                    onClick={async () => {
                        await sendFriendRequest(writtenUser)
                        fetchAllData()
                    }}
                >
                    <PersonAdd />
                </Button>
                <Button onClick={() => {
                    handleShowView()
                }}
                >
                    SWITCH
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell variant="head" colSpan={3} sx={{ fontSize: 20, fontWeight: "bold" }}>
                                {showWhat.toUpperCase()}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {showWhat === "friends" && (
                            friends.map((fri) => (
                                <TableRow key={fri.id}>
                                    <TableCell>{fri.username}</TableCell>
                                    <TableCell>
                                        <Button
                                            onClick={async () => {
                                                await deleteFriend(fri.username)
                                                fetchAllData()
                                            }}
                                        >
                                            <Delete />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                        {showWhat === "friend requests" && (
                            <>
                                {friendRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.sender.username}</TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={async () => {
                                                    await respondFriendRequest("reject", req.id)
                                                    fetchAllData()
                                                }}
                                            >
                                                <Clear />
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    await respondFriendRequest("accept", req.id)
                                                    fetchAllData()
                                                }}
                                            >
                                                <Check />
                                            </Button>
                                        </TableCell>
                                        <TableCell >{cleanDate(req.created_at)}</TableCell>
                                    </TableRow>
                                ))}

                                <TableRow>
                                    <TableCell variant="head" colSpan={3} sx={{ fontSize: 20, fontWeight: "bold" }}>
                                        SENT REQUESTS
                                    </TableCell>
                                </TableRow>
                                {sentFriendRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell >{req.receiver.username}</TableCell>
                                        <TableCell >{req.status}</TableCell>
                                        <TableCell >{cleanDate(req.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default FriendTable