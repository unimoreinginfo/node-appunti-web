const express = require("express");
const stringify = require("safe-json-stringify");
const { createHmac, timingSafeEqual, createDecipheriv } = require("crypto");
const Sntp = require("sntp");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const credentials = {
    "client_id":     "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}

app.post('/webhook', async(req, res) => {

    try{

        const signature = req.headers['x-appunti-digest']; // qui si trova il digest hmac + timestamp al quale è stato emesso il digest
        const init_vector = req.headers['x-appunti-iv']; // qui si trova l'initialization vector per decifrare il tempo che viene concatenato al digest

        // la signature ha sintassi:
        // timestamp:digest_hmac
        // dove timestamp è crittato in aes-256 con iv trasmesso tramite header
    
        const payload = signature.split(":"); // rispettiamo la sintassi della signature
        const str_body = stringify(req.body.note); // ci serve per verificare che la signature della richiesta e quella del body siano uguali
        const computed = createHmac("sha3-256", credentials.client_secret).update(str_body).digest('hex'); // si genera l'hmac del body ricevuto per poterlo verificare

        if(timingSafeEqual(Buffer.from(payload[1]), Buffer.from(computed))){
            // ^^^ per via di https://en.wikipedia.org/wiki/Timing_attack

            const sntp_time = await Sntp.time(); // il timestamp viene generato tramite sntp (pool.ntp.org di default)
            const now = parseInt((sntp_time.receiveTimestamp / 1000).toFixed(2));
            const time = Buffer.from(payload[0].toString(), 'hex');
            const dec = createDecipheriv('aes-256-cbc', credentials.client_secret, Buffer.from(init_vector, 'hex')); // si crea un decipher con le credenziali ottenute
        
            const dec_time = dec.update(time, 'utf-8');
            const end_buf = Buffer.concat([Buffer.from(dec_time), Buffer.from(dec.final())]); // safe concat
            const result = parseInt(end_buf.toString());

            if(now - 300 > result) // finestra di cinque minuti per validare il token
                return res.status(400).end("token troppo vecchio!");
            
            return res.end("webhook request is ok! pog!");

        }

        return res.status(400).end("bad request");

    }catch(err){

        return res.status(500).end("mah...");

    }

});

app.listen(1025);

console.log("listening..");