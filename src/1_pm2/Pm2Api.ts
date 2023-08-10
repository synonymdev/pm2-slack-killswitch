import pm2 from 'pm2'
import { Pm2Process } from './Pm2Process'

export class Pm2Service {
    static async connect() {
        return new Promise<void>((resolve, reject) => {
            pm2.connect((err) => {
                if (err) {
                    return reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    static async disconnect() {
        pm2.disconnect()
    }

    static async list(includes?: string) {
        return new Promise<Pm2Process[]>((resolve, reject) => {
            pm2.list((err, list) => {
                if (err) {
                    return reject(err)
                }
                const processes = list.map(data => new Pm2Process(data)).filter(pro=> {
                    if (includes) {
                        return pro.name.includes(includes)
                    } else {
                        return true
                    }
                })
                return resolve(processes)
              })
        })
    }

    static async stop(processName: string){
        return new Promise<void>((resolve, reject) => {
            pm2.stop(processName, err => {
                if (err) {
                    return reject(err)
                }
                return resolve()
            })
        })
    }

    static async start(processName: string){
        return new Promise<void>((resolve, reject) => {
            pm2.start({name: processName}, err => {
                if (err) {
                    return reject(err)
                }
                return resolve()
            })
        })
    }

    static async restart(processName: string){
        return new Promise<void>((resolve, reject) => {
            pm2.restart(processName, err => {
                if (err) {
                    return reject(err)
                }
                return resolve()
            })
        })
    }
}