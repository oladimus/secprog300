import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import React, { useState } from "react"
import { InitialUserKeyGeneration, deriveKeyFromPassword } from "../KeyGeneration"
import { useSession } from "./RouteProtected"
import { openDB } from "idb"

interface PasswordDialogProps {
    open: boolean
    decrypt: boolean
    handlePasswordDialog: (open: boolean) => void
    setEncryptionKey?: (key: CryptoKey | null) => void
}


const PasswordDialog: React.FC<PasswordDialogProps> = ({
    open, handlePasswordDialog, decrypt, setEncryptionKey
}) => {
    const [password, setPassword] = useState('')

    const session = useSession()

    const handleClose = () => {
        setPassword('')
        handlePasswordDialog(false)
    }

    const handleConfirm = async () => {
        if (decrypt) {
            const db = await openDB('keys-db', 1)
            const stored = await db.get('keys', `privatekey-${Number(session.user?.id)}-${String(session.user?.name)}`)
            if(!stored){
                alert('Initial password not set, or if it is, generate a new key in the settings')
                handleClose()
            }
            const key = await deriveKeyFromPassword(password, new Uint8Array(stored.salt))
            if (key) {
                setEncryptionKey!(key)
            } else {
                alert('Invalid key')
            }
        } else {
            await InitialUserKeyGeneration(Number(session.user?.id), String(session.user?.name), password)
        }
        handleClose()
    }

    return (
        <Dialog
            open={open}
            onClose={() => handlePasswordDialog(false)}
        >
            <DialogTitle>{!decrypt ? "Initial setup: Enter a password to use for accessing messages" :
                "Enter your password for accessing messages"}
            </DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleConfirm} disabled={!password}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default PasswordDialog