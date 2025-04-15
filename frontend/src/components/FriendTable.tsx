import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Friend, FriendRequest } from '../types'
import { Check, Clear, Delete, PersonAdd } from '@mui/icons-material'

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
    checkFriends: () => void
    checkSentFriendRequests: () => void
    checkIncomingFriendRequests: () => void
}
const FriendTable: React.FC<FriendTableProps> = ({
    friends,
    friendRequests,
    sentFriendRequests,
    sendFriendRequest,
    respondFriendRequest,
    deleteFriend,
    checkFriends,
    checkIncomingFriendRequests,
    checkSentFriendRequests
}) => {

    const [showWhat, setShowWhat] = useState<"friends" | "sent requests" | "incoming requests">("friends")
    const [writtenUser, setWrittenUser] = useState<string>("")

    const handleShowView = () => {
        if (showWhat === "friends")
            setShowWhat("incoming requests")
        if (showWhat === "incoming requests")
            setShowWhat("sent requests")
        if (showWhat === "sent requests")
            setShowWhat("friends")
    }

    const fetchAllData = async () => {
        checkFriends()
        checkIncomingFriendRequests()
        checkSentFriendRequests()
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
                    switchview
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{}}>
                            <TableCell>
                                <strong>{showWhat.toUpperCase()}</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {showWhat === "friends" ? friends.map((fri) => {
                            return (
                                <TableRow key={fri.id}>
                                    <TableCell>
                                        {fri.username}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            onClick={async () => {
                                                await deleteFriend(fri.username)
                                                fetchAllData()
                                            }}>
                                            <Delete />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        }
                        ) : (showWhat === "incoming requests" &&
                            friendRequests.map((req) => {
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            {req.sender.username}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={async () => {
                                                    await respondFriendRequest("reject", req.id)
                                                    fetchAllData()
                                                }}
                                            >
                                                <Clear />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={async () => {
                                                    await respondFriendRequest("accept", req.id)
                                                    fetchAllData()
                                                }}
                                            >
                                                <Check />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                            || showWhat === "sent requests" &&
                            sentFriendRequests.map((req) => {
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            {req.receiver.username}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default FriendTable