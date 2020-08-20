import { Pool, createPool } from "mysql";

class Db {
    pool: Pool | undefined = undefined;

    construtor() {
    }

    init() {
        if (this.pool !== undefined) return;
        
        this.pool = createPool({
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
    }

    query(query: string, options: any = {}): any {
        return new Promise((resolve, reject) => {
            this.pool!.query(query, options, function (err, results, fields) {
                if (err)
                    return reject(err);
                return resolve({
                    results: results,
                    fields: fields
                });
            });
        });
    }
}

export default new Db();
