import { waitOnSigint } from "./0_helpers/waitOnSigint"
import { Pm2Service } from "./1_pm2/Pm2Api"
import { SlackBot } from "./2_app/SlackBot"

async function main() {
    const bot = new SlackBot()
    try {
        await Pm2Service.connect()
        await bot.start()
        console.log(`⚡️ pm2-slack-killswitch is running!`);
        console.log('⚡️ Press CTRL+C to stop.')
        await waitOnSigint()
    } finally {
        console.log('Stopping bot...')
        await bot.stop()
        Pm2Service.disconnect()
    }
}

main()
