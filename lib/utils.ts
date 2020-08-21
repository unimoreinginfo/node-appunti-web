import os from 'os'
import CryptoWorkerPool from "./CryptoWorkerPool"

let self = {

    cryptoThreadsPool: new CryptoWorkerPool(os.cpus().length * 2)

}

export = self;