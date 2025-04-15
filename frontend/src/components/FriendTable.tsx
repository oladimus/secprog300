import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Friend, FriendRequest } from '../types'
import { Check, Clear, Delete, PersonAdd } from '@mui/icons-material'

interface FriendTableProps {
    friends: Friend[]
    friendRequests: FriendRequest[]
}
const FriendTable: React.FC<FriendTableProps> = ({
    friends,
    friendRequests,
}) => {

    const [showRorF, setShowRorF] = useState<'friends' | 'requests'>('friends')
    const handleAddFriend = () => {

    }


    return (
        <>
            <Box marginBottom={2}>
                <TextField label="Enter User" sx={{ marginRight: 1 }} variant='outlined' id="friendField"/>

                <Button sx={{ padding: 2 }} variant='contained'
                    onClick={handleAddFriend}
                >
                    <PersonAdd />
                </Button>
                <Button onClick={() => {
                    setShowRorF(showRorF === 'friends' ? 'requests' : 'friends')
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
                                <strong>{showRorF.toUpperCase()}</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {showRorF === 'friends' ? friends.map((fri) => {
                            return (
                                <TableRow key={fri.id}>
                                    <TableCell>
                                        {fri.username}
                                    </TableCell>
                                    <TableCell>
                                        <Delete

                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        }
                        ) : (
                            friendRequests.map((req) => {
                                return (
                                    <TableRow key={req.id}>
                                    <TableCell>
                                        {req.sender.username}
                                    </TableCell>
                                    <TableCell>
                                        <Clear

                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Check
                                        
                                        />
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