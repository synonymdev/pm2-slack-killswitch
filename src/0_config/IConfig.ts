
export interface AppUser {
    name: string,
    slackUserId: string,
    oneTimePasswordSecret: string   
}

export interface IConfig {
    slack: {
        botToken: string,
        appToken: string,
        channelId: string
    },
    users: AppUser[],
    pm2ProcessFilter: string
}