import { IConfig } from "./IConfig";

export const defaultConfig: IConfig = {
    slack: {
        signingSecret: undefined,
        botToken: undefined,
        appToken: undefined
    }
}