import {EventEmitter} from "events";
import {ConnectionOptions} from "./interfaces/connect";
import {generateHeader, requestConnection, setupClientListeners} from "./services/hikvision";


export default class Hikvision extends EventEmitter {
    constructor() {
        super();
        this._emitDataEvent = this._emitDataEvent.bind(this);
        this._emitErrorEvent = this._emitErrorEvent.bind(this);
    }

    connected: boolean = false;
    client: any;

    _emitDataEvent(data: any) {
        this.emit("data", data);
    }

    _emitErrorEvent(error: any) {
        this.emit("error", error);
    }

    async connect(options: ConnectionOptions, path: string = "/ISAPI/Event/notification/alertStream") {
        console.info(`Connecting to camera at ${options.host}:${options.port}...`);
        const headers = generateHeader(options, path);
        requestConnection(options, headers, {
            onClose: () => {
                this.connected = false;
                this.emit("disconnect", this);
            },
            onError: this._emitErrorEvent,
            onData: this._emitDataEvent,
            onSuccess: (client: any) => {
                this.connected = true;
                this.client = client;
                this.emit('connect', this);
                console.info(`Connected to camera at ${options.host}:${options.port}!`);
            }
        });
    }

    disconnect() {
        console.info(`Disconnecting from camera...`);

        this.connected = false;
        console.info(`Disconnected from camera`);
        this.emit("disconnect")
    }


}
