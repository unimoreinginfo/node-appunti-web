"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _app;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet = require('helmet');
class Router {
    constructor() {
        _app.set(this, void 0);
        // imo fare una classe per il router ci può aiutare se vogliamo integrare dei microservizi
        // vedremo se sta cosa ha un'utilità oppure no
        __classPrivateFieldSet(this, _app, express_1.default());
    }
    init() {
        // facciamo un file separato per ogni gruppo di routes
        // così è tutto molto più organizzato
        __classPrivateFieldGet(this, _app).use(helmet());
        __classPrivateFieldGet(this, _app).use('/', require("./routes/main")); // possiamo fare sta cosa del require perché tanto quando viene chiamato il file è già in .js
        __classPrivateFieldGet(this, _app).listen(process.env.PORT);
        console.log(`listening on ${process.env.PORT}`);
        console.log(`live on ${process.env.URI}`);
    }
}
exports.default = Router;
_app = new WeakMap();
