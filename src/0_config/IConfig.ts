
export interface AppUser {
    slackUserId: string,
    oneTimePasswordSecret: string   
}

export interface IConfig {
    slack: {
        botToken: string,
        appToken: string
    },
    users: AppUser[]
}