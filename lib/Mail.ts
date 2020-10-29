import nodemailer, { Transporter } from 'nodemailer'
import path from 'path';
import { readFile } from 'fs-extra';

interface Variables{
    [name: string]: string 
}

export default class Mail{

    protected static transporter: Transporter = nodemailer.createTransport({
        host: 'ssl0.ovh.net',
        port: 465,
        secure: true,
        auth: {
            user: process.env.NOREPLY,
            pass: process.env.NOREPLY_PASSWORD
        }
    });

    private to: string;
    private html_template: string;
    private subject: string;
    private variables: Variables;

    constructor(to: string, subject: string, html_template: string, vars: Variables){

        this.to = to;
        this.html_template = html_template;
        this.subject = subject;
        this.variables = vars;       

    }

    async send(): Promise<void> {

        let html = (await readFile(this.html_template)).toString('utf-8');
        html = this._tokenize(html);
        
        let info = await Mail.transporter.sendMail({

            from: `"appunti.me — noreply" <${process.env.NOREPLY}>`,
            to: this.to,
            subject: this.subject,
            html

        })

        console.log("Mail sent to %s", this.to);
        

    }

    private _tokenize(string: string) {
        
        let str = string;
        Object.keys(this.variables)
            .forEach(variable => {

                let value = this.variables[variable];
                str = str.replace(
                    new RegExp(`%${variable}%`, 'g'),
                    value
                )

            })

        return str;

    }

}