import net from "net";
import events, {EventEmitter} from "events";
import NetKeepAlive from "net-keepalive";
import xml2js from "xml2js";
import util from "util";
import {ConnectionOptions} from "./interfaces/connect";


// Define Globals
let TRACE = false;
let BASE_URI: string = ""
let parser = new xml2js.Parser();

// Module Loader
let hikvision = function (this: any, options: ConnectionOptions) {
    EventEmitter.call(this)
    this.client = this.connect(options)
    if (options.log) TRACE = options.log;
    BASE_URI = 'http://' + options.host + ':' + options.port
    this.activeEvents = {};
    this.triggerActive = false
};

util.inherits(hikvision, events.EventEmitter);

// Attach to camera
hikvision.prototype.connect = function (options: ConnectionOptions) {
    let self = this
    let authHeader = 'Authorization: Basic ' + new Buffer(options.user + ':' + options.password).toString('base64');
    // Connect
    let client = net.connect(options, function () {
        let header = 'GET /ISAPI/Event/notification/alertStream HTTP/1.1\r\n' +
            'Host: ' + options.host + ':' + options.port + '\r\n' +
            authHeader + '\r\n' +
            'Accept: multipart/x-mixed-replace\r\n\r\n';
        client.write(header)
        client.setKeepAlive(true, 1000)
        NetKeepAlive.setKeepAliveInterval(client, 5000)	// sets TCP_KEEPINTVL to 5s
        NetKeepAlive.setKeepAliveProbes(client, 12)	// 60s and kill the connection.
        handleConnection(self, options);
    });

    client.on('data', function (data) {
        handleData(self, data)
    });

    client.on('close', function () {		// Try to reconnect after 30s
        setTimeout(function () {
            self.connect(options)
        }, 30000);
        handleEnd(self)
    });

    client.on('error', function (err) {
        handleError(self, err)
    });
}

// Handle alarms
function handleData(self: { triggerActive: boolean; activeEvents: { [x: string]: any; hasOwnProperty?: any; }; emit: (arg0: string, arg1: any, arg2: string, arg3: number) => void; }, data: xml2js.convertableToString | Buffer) {
    parser.parseString(data, function (err: any, result: { [x: string]: { [x: string]: string[]; }; }) {
        if (result) {
            let code = result['EventNotificationAlert']['eventType'][0]
            let action = result['EventNotificationAlert']['eventState'][0]
            let index = parseInt(result['EventNotificationAlert']['channelID'][0])
            let count = parseInt(result['EventNotificationAlert']['activePostCount'][0])

            // give codes returned by camera prettier and standardized description
            if (code === 'IO') code = 'AlarmLocal';
            if (code === 'VMD') code = 'VideoMotion';
            if (code === 'linedetection') code = 'LineDetection';
            if (code === 'videoloss') code = 'VideoLoss';
            if (code === 'shelteralarm') code = 'VideoBlind';
            if (action === 'active') action = 'Start'
            if (action === 'inactive') action = 'Stop'

            // create and event identifier for each recieved event
            // This allows multiple detection types with multiple indexes for DVR or multihead devices
            let eventIdentifier = code + index

            // Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
            // if triggerActive is true, lets step through the activeEvents
            // If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive
            if (count == 0) {
                if (self.triggerActive) {
                    for (let i in self.activeEvents) {
                        if (self.activeEvents.hasOwnProperty(i)) {
                            let eventDetails = self.activeEvents[i]
                            if (TRACE) console.log('Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"]) / 1000));
                            self.emit("alarm", eventDetails["code"], 'Stop', eventDetails["index"]);
                        }
                    }
                    self.activeEvents = {};
                    self.triggerActive = false

                } else {
                    // should be the most common result
                    // Nothing interesting happening and we haven't seen any events
                    if (TRACE) self.emit("alarm", code, action, index);
                }
            }

                // if the first instance of an eventIdentifier, lets emit it,
            // add to activeEvents and set triggerActive
            else if (typeof self.activeEvents[eventIdentifier] == 'undefined' || self.activeEvents[eventIdentifier] == null) {
                let eventDetails: any = {}
                eventDetails["code"] = code
                eventDetails["index"] = index
                eventDetails["lasttimestamp"] = Date.now();

                self.activeEvents[eventIdentifier] = eventDetails
                self.emit("alarm", code, action, index);
                self.triggerActive = true

                // known active events
            } else {
                if (TRACE) console.log('    Skipped Event: ' + code + ' ' + action + ' ' + index + ' ' + count);

                // Update lasttimestamp
                let eventDetails: any = {}
                eventDetails["code"] = code
                eventDetails["index"] = index
                eventDetails["lasttimestamp"] = Date.now();
                self.activeEvents[eventIdentifier] = eventDetails

                // step through activeEvents
                // if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
                for (let i in self.activeEvents) {
                    if (self.activeEvents.hasOwnProperty(i)) {
                        let eventDetails = self.activeEvents[i]
                        if (((Date.now() - eventDetails["lasttimestamp"]) / 1000) > 2) {
                            if (TRACE) console.log('    Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"]) / 1000));
                            self.emit("alarm", eventDetails["code"], 'Stop', eventDetails["index"]);
                            delete self.activeEvents[i]
                        }
                    }
                }
            }
        }
    });
}

// Handle connection
function handleConnection(self: { emit: (arg0: string) => void; }, options: ConnectionOptions) {
    if (TRACE) console.log('Connected to ' + options.host + ':' + options.port)
    //self.socket = socket;
    self.emit("connect");
}

// Handle connection ended
function handleEnd(self: { emit: (arg0: string) => void; }) {
    if (TRACE) console.log("Connection closed!");
    self.emit("end");
}

// Handle Errors
function handleError(self: { emit: (arg0: string, arg1: any) => void; }, err: string | Error) {
    if (TRACE) console.log("Connection error: " + err);
    self.emit("error", err);
}

// Prototype to see if string starts with string
String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
};

export default hikvision;
