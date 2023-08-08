import { waitOnSigint } from "./0_helpers/waitOnSigint"
import { Pm2Api } from "./1_pm2/Pm2Api"
import { SlackBot } from "./2_app/SlackBot"

async function main() {
  const pm2 = new Pm2Api()
  const bot = new SlackBot(pm2)
  try {
    await pm2.connect()
    await bot.start()
    console.log(`⚡️ pm2-slack-killswitch is running!`);
    console.log('⚡️ Press CTRL+C to stop.')
    await waitOnSigint()
  } finally {
    console.log('Stopping bot...')
    await bot.stop()
    pm2.disconnect()
  }
}

main()
