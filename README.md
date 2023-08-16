# PM2 Slack Killswitch

A Slack bot for pm2 to start/stop processes.

- User whitelist.
- 2-Factor authentication.
- Logs to a Slack channel.

## Getting Started

### Register Slack App

- [Create](https://api.slack.com/apps) a new Slack app.
- Choose from an app manifest.
- Select your workspace.
- Copy content of [app_manifest.json](./app_manifest.json) to the text area.
- Create.
- Install to workspace.
- Add app `pm2-slack-killswitch` to the log channel.

### Setup Bot


```
git clone https://github.com/synonymdev/pm2-slack-killswitch.git
cd pm2-slack-killswitch
npm i
```

Configure the bot with the `config.js` file. Checkout [config.example.js]('./config.example.js') for an example.

Run `npm run start` to start the bot.

### Slack Usage

Run `/killswitch-list` to list all processes.

## pm2

A `ecosystem.config.js` is provided to run the service with [pm2](https://pm2.keymetrics.io/).

- Build typescript to javascript: `npm run build`.
- Start service: `pm2 start ecosystem.config.js`.
  - Watcher logs: `pm2 logs pm2-slack-killswitch`.
- Stop service: `pm2 stop ecosystem.config.js`.
