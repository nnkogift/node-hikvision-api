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

    connect(options: ConnectionOptions) {
        console.info(`Connecting to camera at ${options.host}:${options.port}...`);
        const headers = generateHeader(options);
        const client = requestConnection(options, headers);
        this.connected = true;
        this.client = client;
        setupClientListeners(this.client, this._emitDataEvent, this._emitErrorEvent);
        this.emit('connect', this);
        console.info(`Connected to camera at ${options.host}:${options.port}!`);

    }

    disconnect() {
        console.info(`Disconnecting from camera...`);

        this.connected = false;
        console.info(`Disconnected from camera`);
        this.emit("disconnect")
    }


}
