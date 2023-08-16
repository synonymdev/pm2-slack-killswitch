module.exports = {
    slack: {
        botToken: "xoxb-1111111111111-1111111111111-xxx...", // Got to your App, OAuth & Permissions, OAuth Tokens for Your Workspace
        appToken: "xapp-1-xxxxxxxxxxx-xxxxxxxxxxxxx-xxx...", // Go to your App, Basic Information, App-Level Tokens. I needs connections:write only.
        channelId: "C05..." // ID of the channel the bot will log to.
    },
    users: [
        {
            name: "Severin", // Name of the user. Used for logs.
            slackUserId: 'U04GXT6RS22', // Slack user. Go to user profile, extended menu button, and click Copy member id.
            oneTimePasswordSecret: "MFZWM===" // One time password secret. Base32 encoded value of at least 160bits aka. 20 bytes aka. 20 characters.
        }
    ],
    pm2ProcessFilters: ['^.*$'] // Only show processes that match one of these regex.
}