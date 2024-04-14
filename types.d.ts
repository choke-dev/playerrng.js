type PlayerInfo = {
    description: string,
    created: string,
    isBanned: boolean,
    externalAppDisplayName: unknown,
    hasVerifiedBadge: boolean,
    id: number,
    name: string,
    displayName: string,
    followerCount: number,
    badges: Array<object>,
    totalPlaceVisits: number
}

type Badge = {
    id: number,
    name: string,
    description: string,
    imageUrl: string
}

export { PlayerInfo, Badge }