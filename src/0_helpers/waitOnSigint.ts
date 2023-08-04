/**
 * Waits on SIGINT (CTRL+C) or SIGTERM
 * @returns 
 */
export async function waitOnSigint() {
    return new Promise((resolve, reject) => {
        // Wait on CTRL+C
        process.on('SIGINT', () => {
            resolve(undefined)
        });
        process.on('SIGTERM', () => {
            resolve(undefined)
        })
    })
}