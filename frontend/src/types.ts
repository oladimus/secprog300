

export type Friend = {
    username: string
    id: number
}

export type FriendRequest = {
    sender: Friend
    receiver: Friend
    created_at: string
    id: number
    status: string
}
