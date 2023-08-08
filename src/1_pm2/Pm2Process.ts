export class Pm2Process {
    constructor(public data: any) {}

    get name(): string {
        return this.data.name
    }

    get pid(): number {
        return this.data.pid
    }

    get pm2Id():number {
        return this.data.pm_id
    }

    get unstableRestarts(): number {
        return this.data.pm2_env?.unstable_restarts
    }

    get memory(): number {
        return this.data.monit?.memory || 0
    }

    get cpu(): number {
        return this.data.monit?.cpu || 0
    }

    get status(): 'online' | 'stopped' | 'unknown' {
        return this.data.pm2_env?.status || 'unknown'
    }
}