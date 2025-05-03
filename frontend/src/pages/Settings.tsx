import React, { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'

import { getCsrfToken } from '../utils'
import { API_URL } from '../constants'
import PasswordDialog from '../components/PasswordDialog'

export const Settings = () => {
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)


    const delMessages = async () => {
        try {
            const response = await fetch(API_URL + `/api/message/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                credentials: 'include',
            })
            if (response.ok) {
                const data = await response.json()
                console.log(data.detail)
            } else {
                throw new Error("Failed to delete message")
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
            <Stack spacing={5}>
                <Box display={'flex'}>
                    <Button
                        sx={{ maxWidth: "200px" }}
                        variant='contained'
                        onClick={async () => {
                            setPasswordDialogOpen(true)
                        }}
                    >
                        <strong>REGENERATE KEYPAIR</strong>
                    </Button>
                    <Typography ml={2} sx={{ maxWidth: "500px" }}>
                        You won't be able to decrypt previous messages after doing this.
                        Delete message history after
                    </Typography>
                </Box>
                <Box display={'flex'}>
                    <Button
                        sx={{ maxWidth: "200px" }}
                        variant='contained'
                        onClick={async () => await delMessages()}
                    >
                        <strong>DELETE MESSAGE HISTORY</strong>
                    </Button>
                    <Typography m={2}>
                        Delete all message history (from you and the receiver)
                    </Typography>
                </Box>
            </Stack>

            <PasswordDialog
                open={passwordDialogOpen}
                decrypt={false}
                handlePasswordDialog={setPasswordDialogOpen}
            />
        </>
    )
}

