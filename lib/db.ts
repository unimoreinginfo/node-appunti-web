import { rejects } from "assert";
import mysql, { Pool, createPool, OkPacket } from "mysql2";
import PoolConnection from "mysql2/typings/mysql/lib/PoolConnection";

class Db {
    pool: Pool | undefined = undefined;

    constructor() {
    }

    init() {
        if (this.pool !== undefined) return;
        
        this.pool = createPool({
            host: process.env.MYSQL_HOST,
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            multipleStatements: true
        });
    }
    getConnection(connection?: WrappedConnection): Promise<WrappedConnection>{

        return new Promise(
            (resolve, reject) => {

                if(!this.pool)
                    throw new Error('pool uninitialized');

                if(connection)
                    return resolve(connection);

                this.pool.getConnection((err, conn) => {

                    if(err)
                        return reject(err);                    

                    return resolve(new WrappedConnection(conn)); // downcasting
                
                })

            }
        )

    }
    query(query: string, options: any = {}, buffered_results: boolean = false): any {
        return new Promise((resolve, reject) => {
            this.pool!.query(query, options, function (err, results, fields) {
                if (err)
                    return reject(err);
                
                if(buffered_results)
                    results = debufferize(results as any);

                return resolve({
                    results,
                    fields
                });
            });
        });
    }
}

export class WrappedConnection{

    private connection: PoolConnection;
    private released: boolean = false;

    constructor(conn: PoolConnection){
        this.connection = conn;
    }

    async release(): Promise<void>{
        
        if(this.released)
            return;

        this.released = true;
        this.connection.release();

    }

    query(query: string, options: any = {}): Promise<any>{

        return new Promise(
            (resolve, reject) => {

                this.connection.query(query, options, (err, results, fields) => {

                    if(err)
                        return reject(err);
                    
                    return resolve({
                        results,
                        fields
                    });
        
                })
            
            }
        )

    }
}

export default new Db();
export const core = mysql;
export const debufferize = (rows: any[]): any => {

    let new_rows = rows.map(result => {

        let keys = Object.keys(result);
        keys.forEach(key => {

            if(result[key] instanceof Buffer)
                result[key] = result[key].toString();

        })

        return result;
            
    })

    return new_rows;

}