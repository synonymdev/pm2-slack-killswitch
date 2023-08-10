import { AppConfig } from "../0_config/AppConfig"
import { AppUser } from "../0_config/IConfig";
const notp = require('notp');
var base32 = require('thirty-two');

const config = AppConfig.get()

export class AuthService {
    public static isWhitelisted(userId: string): boolean {
        return !!this.getUser(userId)
    }

    public static getUser(userId: string): AppUser| undefined {
        return config.users.find(user => user.slackUserId === userId)
    }

    static getUserName(userId: string) {
        const user = AuthService.getUser(userId)
        if (!user) {
            return userId
        }

        return `${user.name} ${user.slackUserId}`
    }

    public static isValid2FaCode(code: string, userId: string): boolean {
        const user = AuthService.getUser(userId)
        if (!user) {
            return false
        }
        const decodedSecret = base32.decode(user.oneTimePasswordSecret)
        const result = notp.totp.verify(code, decodedSecret);
        if (!result) {
            return false
        }
        return result.delta === 0 // Only the current valid code.
    }
}