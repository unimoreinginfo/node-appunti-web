# Webhooks
Da oggi appunti.me supporta gli webhooks per notificare vari eventi che accadono all'interno del sistema!<br>

### Protocollo di comunicazione 
#### 0. TL;DR
<a href="https://github.com/unimoreinginfo/node-appunti-web/blob/master/docs/webhooks/sample_express.js">Qua</a> puoi trovare un'implementazione in **Node.js** tramite <a href="https://www.npmjs.com/package/express">`express`</a> (no TypeScript).
#### 1. Registrazione webhook
Il primo passo da fare è quello di registrare un webhook alla nostra piattaforma recandoti alla <a href="https://appunti.me/panel/developer"> pagina dedicata</a>.
#### 2. Che cosa scatena la chiamata ad un webhook?
Per ora l'unico evento che scatena gli webhook è l'<b>upload di appunti</b> da parte di un qualsiasi utente.<br>
Vedremo cosa implementare a seconda delle varie funzioni del sito.
#### 3. Come posso validare un webhook?
Il processo è abbastanza standard:
##### Generazione "firma" webhook da parte di api.appunti.me:
* viene generato un digest `hmac` del contenuto della richiesta (che sarà di tipo *Note*, per ora) con il `client_secret` che viene fornito alla registrazione del webhook;
* al digest viene pre-concatenato il valore del timestamp (ntp) al quale è stato generato il digest stesso;
* viene crittato il valore del timestamp.
* viene eseguita una richiesta HTTP all'endpoint specificato nella pagina di registrazione;
##### Validazione webhook (vedi <a href="https://github.com/unimoreinginfo/node-appunti-web/blob/master/docs/webhooks/sample_express.js"> questa implementazione</a>)
* vengono letti gli header `x-appunti-digest` e `x-appunti-iv`, contenenti rispettivamente il digest `hmac` del corpo della richiesta e l'initialization vector usato per crittare il timestamp appeso al digest (dentro `x-appunti-digest` viene scritta una stringa con sintassi `timestamp_aes:digest_hmac`, dove `timestamp_aes` è il timestamp al quale viene generato il webhook e `digest_hmac` è l'HMAC del corpo della richiesta, usato a scopo di verifica dell'integrità del messaggio inviato);
* viene creato il digest HMAC del corpo della richiesta ricevuta (da parte di api.appunti.me);
* viene verificato che l'HMAC appena generato combaci con `digest_hmac`;
* viene verificato che il token sia stato generato almeno 5 minuti fa da parte di api.appunti.me;
* se <b>tutti</b> i controlli hanno risultato positivo, la richiesta è valida, <b> in qualsiasi altro caso va scartata</b>.
