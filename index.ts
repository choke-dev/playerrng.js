import { isOnline } from 'https://deno.land/x/is_online@v0.1.0/mod.ts';
import * as colors from "https://deno.land/std@0.222.1/fmt/colors.ts";
import { printImage } from "https://deno.land/x/terminal_images@3.1.0/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import * as types from "./types.d.ts";
import { RarityThreshold } from "./interfaces.d.ts";

const CONNECTED_TO_INTERNET = await isOnline().catch(err => {});
if (!CONNECTED_TO_INTERNET) {
    alert("No internet connection. Please check your internet connection and try again.");
    Deno.exit(1);
}

const MAX_USERID = 9999999999
const rarityThresholds: RarityThreshold[] = [
    { threshold: 180, label: colors.brightRed("Exotic") },
    { threshold: 70, label: colors.brightMagenta("Mythic") },
    { threshold: 40, label: colors.yellow("Legendary") },
    { threshold: 30, label: colors.magenta("Epic") },
    { threshold: 20, label: colors.brightBlue("Rare") },
    { threshold: 5, label: colors.green("Uncommon") }
];

function getRarity(stars: number): string {
    for (const threshold of rarityThresholds) {
        if (stars >= threshold.threshold) {
            return threshold.label;
        }
    }
    return colors.gray("Common");
}

async function getStars(playerInfo: types.PlayerInfo): Promise<object> {
    let totalStars = 0;
    const reasons: string[] = [];

    // Roblox Badges
    if (playerInfo.badges) {
        for (const badge of playerInfo.badges as types.Badge[]) {
            switch (badge.id) {
                case 1: // Administrator
                    totalStars += 50;
                    reasons.push("Is Administrator +50 ⭐");
                    break;
                case 2: // Friendship
                    totalStars += 5;
                    reasons.push("Owns Badge: Friendship +5 ⭐");
                    break;
                case 3: // Combat Initiation
                    totalStars += 5;
                    reasons.push("Owns Badge: Combat Initiation +5 ⭐");
                    break;
                case 4: // Warrior
                    totalStars += 10;
                    reasons.push("Owns Badge: Warrior +10 ⭐");
                    break;
                case 5: // Bloxxer
                    totalStars += 20;
                    reasons.push("Owns Badge: Bloxxer +20 ⭐");
                    break;
                case 8: // Inviter
                    totalStars += 15;
                    reasons.push("Owns Badge: Inviter +15 ⭐");
                    break;
                case 17: // Official Model Maker
                    totalStars += 60;
                    reasons.push("Owns Badge: Official Model Maker +15 ⭐");
                    break;
                case 18: // Welcome To The Club
                    totalStars += 5;
                    reasons.push("Owns Badge: Welcome To The Club +5 ⭐");
                    break;
            }
        }
    }

    // Is a star creator
    const starCreatorResponse = await fetch(`https://groups.roblox.com/v2/users/${playerInfo.id}/groups/roles?includeLocked=true&includeNotificationPreferences=false`).then(response => response.json()).catch(error => console.error(error));
    if (starCreatorResponse?.data.some((groupRole: { group: { id: number } }) => groupRole.group.id === 4199740)) {
        totalStars += 40;
        reasons.push("Is Star Creator +40 ⭐");
    }

    // Is a roblox intern
    const robloxInternResponse = await fetch(`https://groups.roblox.com/v2/users/${playerInfo.id}/groups/roles?includeLocked=true&includeNotificationPreferences=false`).then(response => response.json()).catch(error => console.error(error));
    if (robloxInternResponse?.data.some((groupRole: { group: { id: number } }) => groupRole.group.id === 2868472)) {
        totalStars += 40;
        reasons.push("Is Intern +40 ⭐");
    }

    // Verified Badge
    if (playerInfo.hasVerifiedBadge) {
        totalStars += 30
        reasons.push("Has Verified Badge +30 ⭐");
    }

    // Username length
    switch (playerInfo.name.length) {
        case 3:
            totalStars += 50;
            reasons.push(`3 Letter Username +50 ⭐`);
            break;
        case 4:
            totalStars += 35;
            reasons.push(`4 Letter Username +35 ⭐`);
            break;
        case 5:
            totalStars += 10;
            reasons.push(`5 Letter Username +10 ⭐`);
            break;
    }

    // Follower Count
    const followerTiers = [
        { count: 10000000, stars: 40 },
        { count: 1000000, stars: 30 },
        { count: 500000, stars: 25 },
        { count: 100000, stars: 20 },
        { count: 50000, stars: 15 }
    ];
    for (const threshold of followerTiers) {
        if (playerInfo.followerCount > threshold.count) {
            totalStars += threshold.stars;
            reasons.push(`Followers > ${threshold.count} +${threshold.stars} ⭐`);
            break;
        }
    }

    // User ID
    const userIDTiers = [
        { count: 10, stars: 100 },
        { count: 50, stars: 95 },
        { count: 100, stars: 90 },
        { count: 1000, stars: 85 },
        { count: 10000, stars: 60 },
        { count: 50000, stars: 55 },
        { count: 100000, stars: 40 },
        { count: 500000, stars: 35 },
        { count: 1000000, stars: 30 },
        { count: 5000000, stars: 25 },
        { count: 10000000, stars: 20 },
        { count: 50000000, stars: 15 },
        { count: 100000000, stars: 10 }
    ];
    for (const tier of userIDTiers) {
        if (playerInfo.id < tier.count) {
            totalStars += tier.stars;
            reasons.push(`User ID < ${tier.count} +${tier.stars}`);
            break;
        }
    }

    // Place Visits
    const placeVisitTiers = [
        { count: 1000000000, stars: 70 },
        { count: 10000000, stars: 50 },
        { count: 1000000, stars: 40 },
        { count: 10000, stars: 15 },
        { count: 1000, stars: 10 },
        { count: 100, stars: 5 }
    ];
    for (const threshold of placeVisitTiers) {
        if (playerInfo.totalPlaceVisits > threshold.count) {
            totalStars += threshold.stars;
            reasons.push(`Place Visits > ${threshold.count} +${threshold.stars} ⭐`);
            break;
        }
    }
    
    return { totalStars, reasons };
}

async function getTotalPlaceVisits(userId: number) {
    let totalPlaceVisits = 0;
    let nextPageCursor = undefined;
    do {
        const constructedUrl = new URL(`https://games.roblox.com/v2/users/${userId}/games?limit=50`);
        if (nextPageCursor) constructedUrl.searchParams.set("cursor", nextPageCursor)
        const response = await fetch(constructedUrl).then(response => response.json()).catch(error => console.error(error));
        (response?.data as Array<{ placeVisits?: number }>).forEach(game => {
            totalPlaceVisits += game.placeVisits || 0;
        });
        nextPageCursor = response?.nextPageCursor;
    } while (nextPageCursor);
    return totalPlaceVisits;
}

function pickRandomUserId(): number {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const randomInt = (buffer[0] / 0x100000000 * MAX_USERID) | 0;
    return Math.abs(randomInt);
}

async function getPlayerInfo(userId: number) {
    if (!userId) throw new Error("An invalid UserID parameter was given.");
    //@ts-ignore shuddup
    const [playerInfo, playerBadges, playerFollowers, playerTotalPlaceVisits] = await Promise.all([
        fetch(`https://users.roblox.com/v1/users/${userId}`).then(response => response.json()),
        fetch(`https://accountinformation.roblox.com/v1/users/${userId}/roblox-badges`).then(response => response.json()),
        fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`).then(response => response.json()),
        getTotalPlaceVisits(userId),
    ]).catch(error => console.error(error));
    
    playerInfo.followerCount = playerFollowers?.count || 0;
    playerInfo.badges = playerBadges || [];
    playerInfo.totalPlaceVisits = playerTotalPlaceVisits;

    return playerInfo
} 

async function renderPlayerAvatar(userId: number) {
    if (!userId) throw new Error("An invalid UserID parameter was given.");
    const response = await fetch(`https://tools.choke.dev/roblox/avatar-thumbnails/v1/users/avatar-headshot?userId=${userId}`);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await printImage({rawFile: uint8Array, width: 25}).catch(err => console.log("Failed to render player."));
    return uint8Array;
}



async function roll() {
    const randomUserID = pickRandomUserId();
    const playerInfo: types.PlayerInfo = await getPlayerInfo(randomUserID);
    const playerStarsInfo = await getStars(playerInfo);
    //@ts-ignore shutup
    const playerStars = playerStarsInfo?.totalStars
    //@ts-ignore shutup
    const playerStarReasons = playerStarsInfo?.reasons

    const str = [
        `${getRarity(playerStars)} ⭐ ${playerStars}`,
        `${playerInfo.displayName} (@${playerInfo.name})`,
        `#${playerInfo.id}`,
        "",
        playerStarReasons.join("\n")
    ].join("\n")

    console.log(str);
    const imagedata: Uint8Array = await renderPlayerAvatar(randomUserID);
    const shouldSave = confirm("Save?");
    console.log("")
    if (shouldSave) {
        Deno.writeFile(Deno.cwd() + `/${playerInfo.name}.png`, imagedata);
    }
}

await new Command()
    .name("playerrng")
    .version("0.0.1")
    .description("Player RNG")

    .command('roll', 'Rolls a random player')
    .action(roll)

    .command('autoroll', 'Automatically rolls for a random player')
    .action(async () => {
        while (true) {
            await roll();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    })
    .parse(Deno.args);

if (import.meta.main && !Deno.args) {
    alert("This application is intended to be used as a CLI. Please run playerrng --help in a terminal session for a list of commands.");
    Deno.exit(1);
}