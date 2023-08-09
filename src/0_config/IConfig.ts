export interface IConfig {
    slack: {
        botToken: string,
        appToken: string
        whiteListedUserIds: string[]
    }
}