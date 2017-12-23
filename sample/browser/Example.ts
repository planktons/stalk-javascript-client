/**
 * Copyright 2016 Ahoo Studio.co.th.
 *
 */

import {
    Stalk, API, StalkEvents, PushEvents, ChatEvents, StalkJS
}
    // from "stalk-js";
    from "../../lib/browser/index";

export namespace StalkCodeExam {

    /**
     * Preparing connection... 
     */
    export class Factory {
        stalk: Stalk.ServerImplemented;

        constructor(host: string, port: number) {
            this.stalk = StalkJS.create(host, port);
        }

        async stalkInit() {
            let socket = await StalkJS.init(this.stalk);
            return socket;
        }

        async handshake(uid: string) {
            try {
                // @ get connector server.
                let msg = {} as Stalk.IDictionary;
                msg["uid"] = uid;
                msg["x-api-key"] = ""; /* your api key*/;
                let connector = await StalkJS.geteEnter(this.stalk, msg);

                let params = { host: connector.host, port: connector.port, reconnect: false } as Stalk.ServerParam;
                await StalkJS.handshake(this.stalk, params);

                return await connector;
            } catch (ex) {
                throw new Error("handshake fail: " + ex.message);
            }
        }

        async checkIn(user: any) {
            let msg = {} as Stalk.IDictionary;
            msg["user"] = user;
            msg["x-api-key"] = ""; /* your api key*/;
            let result = await StalkJS.checkIn(this.stalk, msg);
            return result;
        }

        async checkOut() {
            await StalkJS.checkOut(this.stalk);
        }
    }

    /**
     * Listenning for messages...
     */
    export class ServerListener {
        socket: Stalk.IPomelo;
        private pushServerListener: PushEvents.IPushServerListener;
        private serverListener: StalkEvents.BaseEvents;
        private chatServerListener: ChatEvents.IChatServerEvents;

        constructor(socket: Stalk.IPomelo) {
            this.socket = socket;

            this.pushServerListener = undefined;
            this.serverListener = undefined;
            this.chatServerListener = undefined;
        }

        public addPushListener(obj: PushEvents.IPushServerListener) {
            this.pushServerListener = obj;

            let self = this;

            self.socket.on(PushEvents.ON_PUSH, function (data) {
                console.log(PushEvents.ON_PUSH, JSON.stringify(data));

                self.pushServerListener.onPush(data);
            });
        }

        public addServerListener(obj: StalkEvents.BaseEvents): void {
            this.serverListener = obj;

            let self = this;

            // <!-- User -->
            self.socket.on(StalkEvents.ON_USER_LOGIN, data => {
                console.log(StalkEvents.ON_USER_LOGIN);

                self.serverListener.onUserLogin(data);
            });
            self.socket.on(StalkEvents.ON_USER_LOGOUT, data => {
                console.log(StalkEvents.ON_USER_LOGOUT);

                self.serverListener.onUserLogout(data);
            });
        }

        public addChatListener(obj: ChatEvents.IChatServerEvents): void {
            this.chatServerListener = obj;

            let self = this;

            self.socket.on(ChatEvents.ON_CHAT, function (data) {
                console.log(ChatEvents.ON_CHAT, JSON.stringify(data));

                self.chatServerListener.onChat(data);
            });
            self.socket.on(ChatEvents.ON_ADD, (data) => {
                console.log(ChatEvents.ON_ADD, data);

                self.chatServerListener.onRoomJoin(data);
            });
            self.socket.on(ChatEvents.ON_LEAVE, (data) => {
                console.log(ChatEvents.ON_LEAVE, data);

                self.chatServerListener.onLeaveRoom(data);
            });
        }
    }
}

export class YourApp {

    exam: StalkCodeExam.Factory;
    listeners: StalkCodeExam.ServerListener;
    chatApi: API.ChatRoomAPI;
    pushApi: API.PushAPI;

    constructor() {
        this.exam = new StalkCodeExam.Factory("stalk.com", 3010);
        this.chatApi = new API.ChatRoomAPI(this.exam.stalk);
        this.pushApi = new API.PushAPI(this.exam.stalk);

        delete this.listeners;
    }
    /**
     * 
     * login to stalk.
     */
    stalkLogin(user: any) {
        this.exam.stalkInit().then(socket => {
            this.exam.handshake(user._id).then((connector) => {
                this.exam.checkIn(user).then((value: any) => {
                    console.log("Joined stalk-service success", value);
                    let result: { success: boolean, token: any } = JSON.parse(JSON.stringify(value.data));
                    if (result.success) {
                        // Save token for your session..

                        // Listen for message...
                        this.listeners = new StalkCodeExam.ServerListener(this.exam.stalk.getSocket());
                    }
                    else {
                        console.warn("Joined chat-server fail: ", result);
                    }
                }).catch(err => {
                    console.warn("Cannot checkIn", err);
                });
            }).catch(err => {
                console.warn("Hanshake fail: ", err);
            });
        }).catch(err => {
            console.log("StalkInit Fail.", err);
        });
    }

    /**
     * logout and disconnections.
     */
    stalkLogout() {
        this.exam.checkOut();
    }

    chat(message: any) {
        this.chatApi.chat("*", message, (err, res) => {

        });
    }

    push(message: Stalk.IDictionary) {
        // let msg: IDictionary = {};
        // msg["event"] = "Test api.";
        // msg["message"] = "test api from express.js client.";
        // msg["timestamp"] = new Date();
        // msg["members"] = "*";

        this.pushApi.push(message).then(result => {

        }).catch(err => {

        });
    }
}