import pm2 from 'pm2'

export class Pm2Api {
    async connect() {
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

    async list() {
        return new Promise<any>((resolve, reject) => {
            pm2.list((err, list) => {
                if (err) {
                    return reject(err)
                }
                return resolve(list)
              })
        })
    }
}