import redis, { RedisClient } from 'redis';

class RClient{
    
    #port: number = 6379;
    #client: RedisClient;
    #host: string;

    constructor(port: number, host: string = 'localhost'){
        
        this.#port = port;
        this.#host = host;
        this.#client = redis.createClient({
            host: this.#host,
            port: this.#port
        })

    }
    
    get(key_type: KeyType, key: string): Promise<string | null | Error> {

        return new Promise(
            (resolve, reject) => {

                this.#client.get(`${key_type}-${key}`, (err, res) => {

                    if(err)
                        return reject(err);

                    return resolve(res);

                })
            
            }
        )

    }

    set(key_type: KeyType, key: string, value: string): Promise<string | null | Error> {

        return new Promise(
            (resolve, reject) => {

                this.#client.set(`${key_type}-${key}`, value, 'EX', parseInt(process.env.REDIS_KEY_EXPIRE_TIME_SECONDS || "1800"), (err, res) => {

                    if(err)
                        return reject(err);

                    return resolve(res);

                })
            
            }
        )

    }

}

export default new RClient(parseInt(process.env.REDIS_PORT || "6379"));
export type KeyType = "notes" | "subjects" | "students" 
export type HKeyType = "size"