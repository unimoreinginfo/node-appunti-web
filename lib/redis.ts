import redis, { RedisClient } from 'redis';

class RClient{
    
    #port: number = 6379;
    #client: RedisClient;
    #host: string;

    constructor(port: number, host: string = 'redis'){
        
        this.#port = port;
        this.#host = host;
        this.#client = redis.createClient({
            host: this.#host,
            port: this.#port
        })

    }

    get redis(): RedisClient{

        return this.#client;

    }
    
    get(key_type: KeyType, key: string): Promise<string | null | Error> {

        return new Promise(
            (resolve, reject) => {

                this.#client.get(`${key_type}-${key}`, (err, res) => {

                    if(err)
                        return reject(err);

                    return resolve(res as string);

                })
            
            }
        )

    }

    set(key_type: KeyType, key: string, value: string): Promise<string | null | Error> {

        return new Promise(
            (resolve, reject) => {

                this.#client.set(`${key_type}-${key}`, value, 'EX', parseInt(process.env.REDIS_KEY_EXPIRE_TIME_SECONDS || "180"), (err, res) => {

                    if(err)
                        return reject(err);

                    return resolve(res as string);

                })
            
            }
        )

    }

}

const client = new RClient(parseInt(process.env.REDIS_PORT || "6379"));
export default client;

export type KeyType = "notes" | "subjects" | "students" 
export type HKeyType = "size"
