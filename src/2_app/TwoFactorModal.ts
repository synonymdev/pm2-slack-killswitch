import { ModalView } from "@slack/bolt";

export type TwoFactorModalAction = 'start' | 'stop' | 'restart' | 'start_all' | 'stop_all'

export class TwoFactorModal {
    constructor(public channelId: string, public messageTs: string, public action: TwoFactorModalAction, public name?: string) {}

    render(): ModalView {
        let description = ''
        if (this.name) {
            description= `You are about to \`${this.action}\` the process \`${this.name? this.name: ''}\`.`
        } else {
            if (this.action === 'start_all') {
                description = `You are about to \`start\` \`ALL\` processes.`
            } else if (this.action === 'stop_all') {
                description = `You are about to \`stop\` \`ALL\` processes.`
            }
        }
        return {
            "type": "modal",
            "callback_id": "2fa_modal",
            "private_metadata": JSON.stringify({
                action: this.action,
                name: this.name,
                channelId: this.channelId,
                messageTs: this.messageTs
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