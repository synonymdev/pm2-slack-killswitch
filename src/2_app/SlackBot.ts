import { App } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
import { sleep } from '../0_helpers/sleep';
import { Pm2Api } from '../1_pm2/Pm2Api';

const config = AppConfig.get()

export class SlackBot {
    constructor(public pm2: Pm2Api) {}

    private app = new App({
        token: config.slack.botToken,
        socketMode: true,
        appToken: config.slack.appToken,
    });

    async start() {
        console.log('register commands')
        this.app.command('/killswitch-list', async (args) => {
            await args.ack()
            const blocks = await this.listProcesses()
            console.log(JSON.stringify(blocks))
            await args.say({
                blocks: blocks
            })
        })

        this.app.action(/^button_process_\w*$/, async args => {
            args.ack()
            const value = (args.action as any).value
            const actionId = (args.action as any).action_id
            console.log('Received command', args.action)
            if (actionId === 'button_process_start') {
                await this.pm2.start(value)
                args.say(`<@${args.context.userId}> started \`${value}\`.`)
            } else if (actionId === 'button_process_restart') {
                await this.pm2.restart(value)
                args.say(`<@${args.context.userId}> restarted \`${value}\`.`)
            } else if (actionId === 'button_process_stop') {
                await this.pm2.stop(value)
                args.say(`<@${args.context.userId}> stopped \`${value}\`.`)
            } else {
                args.say(`<@${args.context.userId}> Unknown action`)
            }

            const newList = await this.listProcesses()
            args.client.chat.update({
                channel: args.body.channel.id,
                ts: (args.body as any).container.message_ts,
                blocks: newList
            })
            
        })

        await this.app.start()
    }

    private async listProcesses() {
        const processes = await this.pm2.list()
        const divider = {
            "type": "divider"
          }
          const headerBlock1 = {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*List PM2 Processes*"
                  },

            ]
        }
        const headerBlock2 = {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "Here is a list of all pm2 processes on this server:\n"
                }
            ]
        }
        const processBlocks = processes.map(pro => {
            const onlineButtons = {
                "type": "actions",
                "block_id": `actions_${pro.pm2Id}`,
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Stop"
                        },
                        "value": `${pro.name}`,
                        "action_id": `button_process_stop`
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Restart"
                        },
                        "value": `${pro.name}`,
                        "action_id": `button_process_restart`
                    }
                ]
            }

            const stoppedButtons = {
                "type": "actions",
                "block_id": `actions_${pro.pm2Id}`,
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Start"
                        },
                        "value": `${pro.name}`,
                        "action_id": `button_process_start`
                    }
                ]
            }

            let buttons = {
                "type": "actions",
                "block_id": "actions1",
                "elements": [] as any[]
            }
            if (pro.status === 'online') {
                buttons = onlineButtons
            } else if (pro.status === 'stopped') {
                buttons = stoppedButtons
            }

            let emoji: string = pro.status
            if (pro.status === 'online') {
                emoji = '🟢'
            } else if (pro.status === 'stopped') {
                emoji = '🔴'
            }

            const memory = (pro.memory/10**6).toFixed(1) + 'MB'
            const context = {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": `${pro.status} ${emoji} Memory: ${memory}, CPU: ${pro.cpu}, Unstable restarts: ${pro.unstableRestarts}`
                    },
                ]
            }

            
            const description = {
                "type": "header",
                "text": {
                        "type": "plain_text",
                        "text": `${pro.name}`
                    }
            }
            return [
                divider,
                description,
                context,
                buttons,
            ]
        })

        return [
            divider,
            headerBlock1,
            headerBlock2,
            ...processBlocks.flatMap(arr => arr),
            
        ]
    }

    async stop() {
        await this.app.stop()
    }
}