import { App } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
import { sleep } from '../0_helpers/sleep';

const config = AppConfig.get()

export class SlackBot {
    private app = new App({
        // signingSecret: config.slack.signingSecret,
        token: config.slack.botToken,
        socketMode: true,
        appToken: config.slack.appToken,
        // port: 3002,
        developerMode: true
    });

    async start() {
        console.log('register commands')
        this.app.command('/hello-sev', async (args) => {
            console.log('received command', args)
            await args.ack()
            
            await args.say('Hello World')
        })

        await this.app.start()
    }

    async stop() {
        await this.app.stop()
    }
}