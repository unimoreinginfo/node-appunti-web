import mysql, { Pool, createPool, OkPacket } from "mysql2";

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