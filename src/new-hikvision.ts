import {EventEmitter} from "events";
import {ConnectionOptions} from "./interfaces/connect";


class Hikvision extends EventEmitter{
    constructor() {
        super();
    }

    connect(options: ConnectionOptions){
    }

    disconnect(){
    }


}
