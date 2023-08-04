# blocktank-util-slack

A Slack bot for BlockTank. You can configure multiple channels and other workers can use them.

## Usage

Configure the bot with the `config.json` file. Checkout [config.example.json]('./config.example.json') for an example.

* `npm run build` - Build the bot.
* `npm run start` - Start the bot.
* `npm run send-test-message -- {myConfiguredChannelName}` - Send a test message to a specific channel by name.


### pm2

A `ecosystem.config.js` is provided to run the service with [pm2](https://pm2.keymetrics.io/).

- Build typescript to javascript: `npm run build`.
- Start service: `pm2 start ecosystem.config.js`.
  - Watcher logs: `pm2 logs blocktank-util-slack`.
- Stop service: `pm2 stop ecosystem.config.js`.
