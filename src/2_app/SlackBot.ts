import { App } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
import { Pm2Api } from '../1_pm2/Pm2Api';
import { ProcessList } from './ProcessList';

const config = AppConfig.get()

export class SlackBot {
    constructor(public pm2: Pm2Api) {}

    private app = new App({
        token: config.slack.botToken,
        socketMode: true,
        appToken: config.slack.appToken,
    });

    private isUserWhitelisted(userId: string) {
        return config.slack.whiteListedUserIds.includes(userId)
    }

    async start() {

        this.app.command('/killswitch-list', async (args) => {
            await args.ack()
            if (!this.isUserWhitelisted(args.context.userId))  {
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }
            const blocks = await this.listProcesses(args.context.userId)
            await args.say({
                blocks: blocks
            })
        })

        this.app.action(/^button_process_\w*$/, async args => {
            
            const value = (args.action as any).value
            const actionId = (args.action as any).action_id
            console.log('Received command', args.action, args.context)

            if (!this.isUserWhitelisted(args.context.userId))  {
                await args.ack()
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }

            if (actionId === 'button_process_start') {
                const {timestamp, name, state} = JSON.parse(value)
                await this.pm2.start(name)
                args.say(`<@${args.context.userId}> started \`${name}\`.`)
            } else if (actionId === 'button_process_restart') {
                const {timestamp, name, state} = JSON.parse(value)
                await this.pm2.restart(name)
                args.say(`<@${args.context.userId}> restarted \`${name}\`.`)
            } else if (actionId === 'button_process_stop') {
                const {timestamp, name, state} = JSON.parse(value)
                await this.pm2.stop(name)
                args.say(`<@${args.context.userId}> stopped \`${name}\`.`)
            } else if (actionId === 'button_process_refresh') {
                // List is refresh automatically after every command.
            } else if (actionId === 'button_process_start_all') {
                const stopped = (await this.pm2.list('blocktank')).filter(pro => pro.status === 'stopped')
                for (const pro of stopped) {
                    await this.pm2.start(pro.name)
                }
                args.say(`<@${args.context.userId}> started all processes.`)
            } else if (actionId === 'button_process_stop_all') {
                const runningProcesses = (await this.pm2.list('blocktank')).filter(pro => pro.status === 'online')
                for (const pro of runningProcesses) {
                    await this.pm2.stop(pro.name)
                }
                args.say(`<@${args.context.userId}> stopped all processes.`)
            } else {
                args.say(`<@${args.context.userId}> Unknown action`)
            }

            const newList = await this.listProcesses(args.context.userId)
            await args.ack()
            args.client.chat.update({
                channel: args.body.channel.id,
                ts: (args.body as any).container.message_ts,
                blocks: newList
            })
            
        })

        await this.app.start()
    }

    private async listProcesses(userId: string) {
        const processes = await this.pm2.list('blocktank')
        return new ProcessList(processes, userId).render()
    }

    async stop() {
        await this.app.stop()
    }
}