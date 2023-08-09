module.exports = {
    slack: {
        botToken: "xoxb-1111111111111-1111111111111-xxx...", // Got to your App, OAuth & Permissions, OAuth Tokens for Your Workspace
        appToken: "xapp-1-xxxxxxxxxxx-xxxxxxxxxxxxx-xxx...", // Go to your App, Basic Information, App-Level Tokens
    },
    users: [
        {
            name: "Severin", // Name of the user. Not really used but cool to identify the usr.
            slackUserId: 'U04GXT6RS22', // Slack user. Go to user profile and click Copy member id.
            oneTimePasswordSecret: "MFZWM===" // One time password secret. Any base32 encoded value.
        }
    ]
}