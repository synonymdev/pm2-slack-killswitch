import { App } from '@slack/bolt'
import { AppConfig } from '../0_config/AppConfig';
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
            const blocks = await this.listProcesses(args.context.userId)
            console.log(JSON.stringify(blocks))
            await args.say({
                blocks: blocks
            })
        })

        this.app.action(/^button_process_\w*$/, async args => {
            
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
            args.ack()
            args.client.chat.update({
                channel: args.body.channel.id,
                ts: (args.body as any).container.message_ts,
                blocks: newList
            })
            
        })

        await this.app.start()
    }

    private async listProcesses(userId: string) {
        const processes = (await this.pm2.list('blocktank'))
        const divider = {
            "type": "divider"
          }
          const headerBlock1 = {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*All Blocktank PM2 Processes*"
                  },

            ]
        }

        const contextHeader = {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Last updated <!date^${Math.round(Date.now()/1000)}^{date_num} {time_secs}|${new Date().toISOString()}> by <@${userId}>.`
                },
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

            const memory = (pro.memory/10**6).toFixed(1)
            const context = {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": `${pro.status} ${emoji} Memory: ${memory}MB, CPU: ${pro.cpu}%, Unstable restarts: ${pro.unstableRestarts}, Uptime: ${pro.humanizedUptime}`
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

        const globalActions = {
            "type": "actions",
            "block_id": `actions_gobal`,
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Refresh list"
                    },
                    "value": `all`,
                    "action_id": `button_process_refresh`
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Start all processes"
                    },
                    "value": `all`,
                    "action_id": `button_process_start_all`
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Stop all processes"
                    },
                    "value": `all`,
                    "action_id": `button_process_stop_all`
                },

            ]
        }

        return [
            divider,
            headerBlock1,
            contextHeader,
            globalActions,
            ...processBlocks.flatMap(arr => arr),
        ]
    }

    async stop() {
        await this.app.stop()
    }
}