import { Pm2Process } from "../1_pm2/Pm2Process"
import { SlackActionArg } from "./SlackBot"

const divider = {
    "type": "divider"
  }


export class ProcessList {
    constructor(private processes: Pm2Process[], private userId: string) {}

    private renderProcess(process: Pm2Process) {
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

        const memory = (process.memory/10**6).toFixed(1)
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

    private renderGlobalActions() {
        return {
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
    }

    public render() {
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
                    "text": `Last updated <!date^${Math.round(Date.now()/1000)}^{date_num} {time_secs}|${new Date().toISOString()}> by <@${this.userId}>.`
                },
            ]
        }

        return [
            divider,
            headerBlock1,
            contextHeader,
            this.renderGlobalActions(),
            ...this.processes.map(pro => this.renderProcess(pro)).flatMap(arr => arr),
        ]
    }

    async processAction(args: SlackActionArg){

    }
}