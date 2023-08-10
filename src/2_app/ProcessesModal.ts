import { App, ModalView } from "@slack/bolt"
import { Pm2Process } from "../1_pm2/Pm2Process"
import { AuthService } from "./AuthService"
import { Pm2Service } from "../1_pm2/Pm2Api"
import { TwoFactorModal } from "./TwoFactorModal"
import { IViewId } from "./IViewId"

const divider = {
    "type": "divider"
}


export class ProcessesModal {
    private twoFa: TwoFactorModal
    constructor(private app: App) {
        this.twoFa = new TwoFactorModal(this.app)
     }

    async init() {
        this.app.command('/killswitch-list', async (args) => {
            await args.ack()
            if (!AuthService.isWhitelisted(args.context.userId)) {
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }
            await this.app.client.views.open({
                trigger_id: args.body.trigger_id,
                view: await this.render()
            })
        })

        this.app.action(/^button_process_\w*$/, async args => {
            
            const value = (args.action as any).value
            const actionId = (args.action as any).action_id

            const modal: IViewId = {
                view_id: (args.body as any).view.id,
                hash: (args.body as any).view.hash,
            }

            await args.ack()
            if (!AuthService.isWhitelisted(args.context.userId))  {
                await args.say('Permission denied. Add your slack user id to `config.js` to gain access.')
                return
            }
        
            if (actionId === 'button_process_start') {
                const {name} = JSON.parse(value)
                await this.twoFa.open((args.body as any).trigger_id, 'start', name)
            } else if (actionId === 'button_process_restart') {
                const {name} = JSON.parse(value)
                await this.twoFa.open((args.body as any).trigger_id, 'restart', name)
            } else if (actionId === 'button_process_stop') {
                const {name} = JSON.parse(value)
                await this.twoFa.open((args.body as any).trigger_id, 'stop', name)
            } else if (actionId === 'button_process_start_all') {
                await this.twoFa.open((args.body as any).trigger_id, 'start_all')
            } else if (actionId === 'button_process_stop_all') {
                await this.twoFa.open((args.body as any).trigger_id, 'stop_all')
            } else if (actionId === 'button_process_refresh') {
                await args.client.views.update({
                    ...modal,
                    view: await this.render()
                })
            } else {
                args.say(`<@${args.context.userId}> Unknown action`)
            }
        })

        await this.twoFa.init(async (modal) => {
            await this.app.client.views.update({
                ...modal,
                view: await this.render()
            })
        })
    }


    private _renderProcess(process: Pm2Process) {
        const onlineButtons = {
            "type": "actions",
            "block_id": `actions_${process.pm2Id}`,
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Stop"
                    },
                    "value": JSON.stringify({
                        name: process.name,
                        timestamp: Date.now(),
                        state: process.status
                    }),
                    "action_id": `button_process_stop`
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Restart"
                    },
                    "value": JSON.stringify({
                        name: process.name,
                        timestamp: Date.now(),
                        state: process.status
                    }),
                    "action_id": `button_process_restart`
                }
            ]
        }

        const stoppedButtons = {
            "type": "actions",
            "block_id": `actions_${process.pm2Id}`,
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Start"
                    },
                    "value": JSON.stringify({
                        name: process.name,
                        timestamp: Date.now(),
                        state: process.status
                    }),
                    "action_id": `button_process_start`
                }
            ]
        }

        let buttons = {
            "type": "actions",
            "block_id": "actions1",
            "elements": [] as any[]
        }
        if (process.status === 'online') {
            buttons = onlineButtons
        } else if (process.status === 'stopped') {
            buttons = stoppedButtons
        }

        let emoji: string = process.status
        if (process.status === 'online') {
            emoji = '🟢'
        } else if (process.status === 'stopped') {
            emoji = '🔴'
        }

        const memory = (process.memory / 10 ** 6).toFixed(1)
        const context = {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `${process.status} ${emoji} Memory: ${memory}MB, CPU: ${process.cpu}%, Unstable restarts: ${process.unstableRestarts}, Uptime: ${process.humanizedUptime}`
                },
            ]
        }


        const description = {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": `${process.name}`
            }
        }

        return [
            divider,
            description,
            context,
            buttons,
        ]
    }

    private _renderGlobalActions() {
        return {
            "type": "actions",
            "block_id": `actions_gobal`,
            "elements": [
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
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Refresh list"
                    },
                    "value": `all`,
                    "action_id": `button_process_refresh`
                },
            ]
        }
    }

    private async render(): Promise<ModalView> {
        const processes = await Pm2Service.list()
        const contextHeader = {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Last updated <!date^${Math.round(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>.`
                },
            ]
        }

        const modal: ModalView = {
            "type": "modal",
            "callback_id": "process_list_modal",
            "private_metadata": JSON.stringify({
            }),
            "title": {
                "type": "plain_text",
                "text": "Blocktank Process List"
            },
            "blocks": [
                this._renderGlobalActions(),
                ...processes.map(pro => this._renderProcess(pro)).flatMap(arr => arr),
                divider,
                contextHeader,
            ]
        }
        return modal

    }

}