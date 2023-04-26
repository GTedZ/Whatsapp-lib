const axios = require('axios');
const express = require('express');
const { EventEmitter } = require('events');

class Whatsapp extends EventEmitter {

    app = null;

    handle_errors = false;

    api = 'https://graph.facebook.com/'

    AccessToken;

    from_phone_number_id;

    API_version;

    whatsapp_headers;

    constructor(AccessToken, from_phone_number_id, API_version = 16, handle_errors = false) {
        super();

        this.AccessToken = AccessToken;

        this.from_phone_number_id = from_phone_number_id;

        this.set_API_version(API_version);

        this.whatsapp_headers = { Authorization: this.AccessToken };

        this.set_errorHandling(handle_errors);
    }

    listen(...args) {
        if (this.app == null) {
            this.app = express();
            this.app.use(express.json());
        }
        return this.app.listen(...args);
    }

    open_webhook_verification(path, verify_token) {
        this.app.get(path, (req, res) => {
            if (
                req.query['hub.mode'] == 'subscribe' &&
                req.query['hub.verify_token'] == verify_token
            ) {
                res.send(req.query['hub.challenge']);
            } else {
                res.sendStatus(400);
            }
        });
    }

    set_API_version(API_version) {
        if (typeof API_version === 'string') {
            const version_match = API_version.match(/(v)?(\d\d)(\.0)?(\/)?/);
            if (version_match == null) throw new Error(`'API_version' is invalid.`)
            this.API_version = `v${parseInt(version_match[2]).toFixed(1)}`;
        } else if (typeof API_version === 'number') this.API_version = `v${API_version.toFixed(1)}`;
        else throw new Error(`'version' must be of type 'number' or 'string', instead received '${typeof API_version}': ${API_version}`)
    }

    set_errorHandling(handle_errors) {
        if (typeof handle_errors === 'boolean') {
            this.handle_errors = handle_errors;
        } else if (typeof handle_errors === 'string') {
            if (handle_errors == 'true') this.handle_errors = true;
            else if (handle_errors == 'false') this.handle_errors = false;
            else throw new Error(`Boolean value 'handle_errors' must be either true or false, instead received a variable of type '${typeof handle_errors}': ${handle_errors}`);
        } else throw new Error(`Boolean value 'handle_errors' must be either true or false, instead received a variable of type '${typeof handle_errors}': ${handle_errors}`);
    }

    sendMessage(phoneNumber_or_waID, textBody, messageID_reply = undefined) {
        const URL = this.api + this.API_version + '/' + this.from_phone_number_id + '/messages';

        const payload = {
            "messaging_product": "whatsapp",

            "context": prepContext(messageID_reply),

            "to": phoneNumber_or_waID,
            "type": "text",
            "text": {
                "preview_url": false,
                "body": textBody
            }
        }

        return request('POST', URL, payload)
    }

}

async function request(method, url, payload) {
    method = method.toLowerCase();

    return method == 'get'
        ?
        axios[method](url, { headers: this.whatsapp_headers })
        :
        axios[method](url, payload, { headers: this.whatsapp_headers })
}

function prepContext(messageID_reply) {
    if (typeof messageID_reply === 'undefined') return undefined;   // undefined so that the 'context' property is omitted when stringified
    if (typeof messageID_reply === 'boolean') return undefined;     // undefined so that the 'context' property is omitted when stringified

    return {
        "message_id": messageID_reply
    }

}

module.exports = Whatsapp;