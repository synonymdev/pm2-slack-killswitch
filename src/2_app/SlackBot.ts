import { AllMiddlewareArgs, App, SlackAction, SlackActionMiddlewareArgs } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
import { Pm2Api } from '../1_pm2/Pm2Api';
import { ProcessList } from './ProcessList';
import { TwoFactorModal, TwoFactorModalAction } from './TwoFactorModal';
import { StringIndexed } from '@slack/bolt/dist/types/helpers';
import { AuthService } from './AuthService';

const config = AppConfig.get()

export type SlackActionArg = SlackActionMiddlewareArgs<SlackAction> & AllMiddlewareArgs<StringIndexed>

export class SlackBot {
    constructor(public pm2: Pm2Api) {}

    private app = new App({
        token: config.slack.botToken,
        socketMode: true,
        appToken: config.slack.appToken,
    });



    async start() {

        this.app.command('/killswitch-list', async (args) => {
            await args.ack()
            if (!AuthService.isWhitelisted(args.context.userId))  {
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }
            const blocks = await this.listProcesses(args.context.userId)
            await args.say({
                blocks: blocks
            })
        })

        this.app.view('2fa_modal', async args => {
            const code = args.payload.state.values.twofa_block.twofa.value
            const metadata = JSON.parse(args.payload.private_metadata)
            const action: TwoFactorModalAction = metadata.action
            const name = metadata.name
            const channelId = metadata.channelId
            const messageTs = metadata.messageTs

            
            if (!AuthService.isWhitelisted(args.context.userId))  {
                await args.ack()
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: 'Permission denied. Add your slack user id to `config.js` to gain access.'
                })
                return
            }
            if (!AuthService.isValid2FaCode(code, args.context.userId)) {
                await args.ack({
                    "response_action": "errors",
                    "errors": {
                      "twofa_block": "Invalid 2FA code."
                    }
                  })
                return
            }

            await args.ack()
            if (action === 'start') {
                await this.pm2.start(name)
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> started \`${name}\`.`
                })
            } else if (action === 'restart') {
                await this.pm2.restart(name)
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> restarted \`${name}\`.`
                })
            } else if (action === 'stop') {
                await this.pm2.stop(name)
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> stopped \`${name}\`.`
                })
            } else if (action === 'start_all') {
                const stopped = (await this.pm2.list('blocktank')).filter(pro => pro.status === 'stopped')
                for (const pro of stopped) {
                    await this.pm2.start(pro.name)
                }
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> started all processes.`
                })
            } else if (action === 'stop_all') {
                const runningProcesses = (await this.pm2.list('blocktank')).filter(pro => pro.status === 'online')
                for (const pro of runningProcesses) {
                    await this.pm2.stop(pro.name)
                }
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> stopped all processes.`
                })
            } else {
                await args.client.chat.postMessage({
                    channel: channelId,
                    mrkdwn: true,
                    text: `Unknown action \`${action}\`.`
                })
            }

            await this.updateProcessList(messageTs, channelId, args.body.user.id)
            
        })

        this.app.action(/^button_process_\w*$/, async args => {
            
            const value = (args.action as any).value
            const actionId = (args.action as any).action_id
            console.log('Received command', args.action, args.context)

            await args.ack()
            if (!AuthService.isWhitelisted(args.context.userId))  {
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }
        
            if (actionId === 'button_process_start') {
                const {name} = JSON.parse(value)
                await this.open2FAModal(args, 'start', name)
            } else if (actionId === 'button_process_restart') {
                const {name} = JSON.parse(value)
                await this.open2FAModal(args, 'restart', name)
            } else if (actionId === 'button_process_stop') {
                const {name} = JSON.parse(value)
                await this.open2FAModal(args, 'stop', name)
            } else if (actionId === 'button_process_start_all') {
                await this.open2FAModal(args, 'start_all')
            } else if (actionId === 'button_process_stop_all') {
                await this.open2FAModal(args, 'stop_all')
            } else if (actionId === 'button_process_refresh') {
                // List is refresh automatically after every command.
            } else {
                args.say(`<@${args.context.userId}> Unknown action`)
            }

            
            await this.updateProcessList((args.body as any).container.message_ts, args.body.channel.id, args.context.userId) 
        })

        await this.app.start()
    }

    private async open2FAModal(arg: SlackActionArg, action: TwoFactorModalAction, name?: string) {
        await arg.client.views.open({
            trigger_id: (arg.body as any).trigger_id as string,
            view: new TwoFactorModal(arg.body.channel.id, (arg.body as any).container.message_ts, action, name).render()
        })
    }

    private async listProcesses(userId: string) {
        const processes = await this.pm2.list('blocktank')
        return new ProcessList(processes, userId).render()
    }

    private async updateProcessList(messageTs: string, channelId: string, userId: string) {
        const newList = await this.listProcesses(userId)
        this.app.client.chat.update({
            channel: channelId,
            ts: messageTs,
            blocks: newList
        })
    }

    async stop() {
        await this.app.stop()
    }
}