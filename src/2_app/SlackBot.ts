import { AllMiddlewareArgs, App, SlackAction, SlackActionMiddlewareArgs } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
import { StringIndexed } from '@slack/bolt/dist/types/helpers';
import { ProcessesModal } from './ProcessesModal';

const config = AppConfig.get()

export type SlackActionArg = SlackActionMiddlewareArgs<SlackAction> & AllMiddlewareArgs<StringIndexed>

export class SlackBot {
    private app = new App({
        token: config.slack.botToken,
        socketMode: true,
        appToken: config.slack.appToken,
    });

    async start() {
        const processesModal = new ProcessesModal(this.app)
        await processesModal.init()

        await this.app.start()
    }

    async stop() {
        await this.app.stop()
    }
}