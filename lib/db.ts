import mysql, { Pool, createPool, OkPacket } from "mysql";

class Db {
    pool: Pool | undefined = undefined;

    constructor() {
    }

    init() {
        if (this.pool !== undefined) return;
        
        this.pool = createPool({
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });
    }

    query(query: string, options: any = {}, buffered_results: boolean = false): any {
        return new Promise((resolve, reject) => {
            this.pool!.query(query, options, function (err, results, fields) {
                if (err)
                    return reject(err);
                
                if(buffered_results)
                    results = debufferize(results);

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