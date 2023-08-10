# PM2 Slack Killswitch

A Slack bot for pm2 to start/stop processes.

- User whitelist.
- 2-Factor authentication.
- Logs to a Slack channel.

## Usage

Configure the bot with the `config.js` file. Checkout [config.example.js]('./config.example.js') for an example.

* `npm run build` - Build the bot.
* `npm run start` - Start the bot.

## Slack

### Install

- [Create](https://api.slack.com/apps) a new Slack app.
- Choose from an app manifest.
- Select your workspace.
- Copy content of [app_manifest.json](./app_manifest.json) to the text area.
- Create.
- Install to workspace.
- Add app `pm2-slack-killswitch` to the log channel.

Run `/killswitch-list` to list all processes.

### pm2

A `ecosystem.config.js` is provided to run the service with [pm2](https://pm2.keymetrics.io/).

- Build typescript to javascript: `npm run build`.
- Start service: `pm2 start ecosystem.config.js`.
  - Watcher logs: `pm2 logs pm2-slack-killswitch`.
- Stop service: `pm2 stop ecosystem.config.js`.
