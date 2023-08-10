import { IConfig } from "./IConfig";

export const defaultConfig: IConfig = {
    slack: {
        botToken: undefined,
        appToken: undefined,
        channelId: undefined
    },
    users: []
}