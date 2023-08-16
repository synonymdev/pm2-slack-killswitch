import { AppConfig } from "./0_config/AppConfig"
import { waitOnSigint } from "./0_helpers/waitOnSigint"
import { Pm2Service } from "./1_pm2/Pm2Api"
import { SlackBot } from "./2_app/SlackBot"

const config = AppConfig.get()

async function printManagedProcesses() {
    const processes = await Pm2Service.listFiltered(config.pm2ProcessFilters)
    console.log('Managed processes based on pm2ProcessFilters:')
    if (processes.length === 0) {
        console.log('- No managed processes found.')
    } else {
        for (const pro of processes) {
            console.log('-', pro.name)
        }
    }
}

async function main() {
    const bot = new SlackBot()
    try {
        await Pm2Service.connect()
        await printManagedProcesses()
        await bot.start()
        console.log()
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
