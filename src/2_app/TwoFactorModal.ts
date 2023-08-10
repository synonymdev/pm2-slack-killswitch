import { App, ModalView } from "@slack/bolt";
import { IViewId } from "./IViewId";
import { AppConfig } from "../0_config/AppConfig";
import { AuthService } from "./AuthService";
import { Pm2Service } from "../1_pm2/Pm2Api";

export type TwoFactorModalAction = 'start' | 'stop' | 'restart' | 'start_all' | 'stop_all'

const config = AppConfig.get()

export class TwoFactorModal {
    constructor(private app: App) { }

    async init(on2FaClose: (model: IViewId) => any) {
        this.app.view('2fa_modal', async args => {
            const code = args.payload.state.values.twofa_block.twofa.value
            const metadata = JSON.parse(args.payload.private_metadata)
            const action: TwoFactorModalAction = metadata.action
            const name = metadata.name

            if (!AuthService.isWhitelisted(args.context.userId)) {
                await args.ack()
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: 'Permission denied. Add your slack user id to `config.js` to gain access.'
                })
                return
            }
            const userName = AuthService.getUserName(args.context.userId)
            if (!AuthService.isValid2FaCode(code, args.context.userId)) {
                console.log('User', userName, 'invalid 2FA code submitted.')
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
                console.log('User:', userName, 'Action:', action, 'Process:', name)
                await Pm2Service.start(name)
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> started \`${name}\`.`
                })
            } else if (action === 'restart') {
                console.log('User:', userName, 'Action:', action, 'Process:', name)
                await Pm2Service.restart(name)
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> restarted \`${name}\`.`
                })
            } else if (action === 'stop') {
                console.log('User:', userName, 'Action:', action, 'Process:', name)
                await Pm2Service.stop(name)
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> stopped \`${name}\`.`
                })
            } else if (action === 'start_all') {
                console.log('User:', userName, 'Action:', action, 'Process:', name)
                const stopped = (await Pm2Service.listFiltered(config.pm2ProcessFilters)).filter(pro => pro.status === 'stopped')
                for (const pro of stopped) {
                    await Pm2Service.start(pro.name)
                }
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> started all processes.`
                })
            } else if (action === 'stop_all') {
                console.log('User:', userName, 'Action:', action, 'Process:', name)
                const runningProcesses = (await Pm2Service.listFiltered(config.pm2ProcessFilters)).filter(pro => pro.status === 'online')
                for (const pro of runningProcesses) {
                    await Pm2Service.stop(pro.name)
                }
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `<@${args.context.userId}> stopped all processes.`
                })
            } else {
                console.log('User:', userName, 'Action:', 'Unknown', 'Process:', name)
                await args.client.chat.postMessage({
                    channel: config.slack.channelId,
                    mrkdwn: true,
                    text: `Unknown action \`${action}\`.`
                })
            }
            const modal: IViewId = {
                view_id: args.view.previous_view_id,
            }
            await on2FaClose(modal)
        })

        this.app.view({ callback_id: '2fa_modal', type: 'view_closed' }, async (args) => {
            await args.ack();
            const modal: IViewId = {
                view_id: args.view.previous_view_id,
            }
            await on2FaClose(modal)
        });
    }

    async open(triggerId: string, action: TwoFactorModalAction, name?: string) {
        await this.app.client.views.push({
            trigger_id: triggerId,
            view: this.render(action, name)
        })
    }

    private render(action: TwoFactorModalAction, name?: string): ModalView {
        let description = ''
        if (name) {
            description = `You are about to \`${action}\` the process \`${name ? name : ''}\`.`
        } else {
            if (action === 'start_all') {
                description = `You are about to \`start\` \`ALL\` processes.`
            } else if (action === 'stop_all') {
                description = `You are about to \`stop\` \`ALL\` processes.`
            }
        }
        return {
            "type": "modal",
            "callback_id": "2fa_modal",
            "notify_on_close": true,
            "private_metadata": JSON.stringify({
                action: action,
                name: name,
            }),
            "title": {
                "type": "plain_text",
                "text": "2FA required"
            },
            "submit": {
                "type": "plain_text",
                "text": "Submit"
            },
            "blocks": [
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": `${description} Enter your 2FA code below to complete the action.`
                        }
                    ]
                },
                {
                    "type": "input",
                    "block_id": "twofa_block",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "twofa",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Enter your 2-factor authentication code."
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "2FA"
                    }
                }
            ],
        }
    }
}