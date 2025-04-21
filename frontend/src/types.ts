

export type Friend = {
    username: string
    id: number
    e2ee_public_key: JsonWebKey
}

export type FriendRequest = {
    sender: Friend
    receiver: Friend
    created_at: string
    id: number
    status: string
}

export type Message = {
    sender: Friend
    receiver: Friend
    content: string
    iv: string
    timestamp: string
}
