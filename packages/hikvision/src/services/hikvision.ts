import {ConnectionOptions} from "../interfaces/connect";
import net from "net";
import NetKeepAlive from "net-keepalive";


export function generateHeader(options: ConnectionOptions): string {
    const urlHeader = `GET /ISAPI/Event/notification/alertStream HTTP/1.1`
    const authHeader = `Authorization: Basic ${Buffer.from(`${options.user}:${options.password}`).toString('base64')}`;
    const hostHeader = `Host: ${options.host}:${options.port}`;
    const acceptHeader = `Accept: multipart/x-mixed-replace\r\n`;

    return `${urlHeader}\r\n${authHeader}\r\n${hostHeader}\r\n${acceptHeader}`;
}

export function requestConnection(options: ConnectionOptions, headers: string): any {
    const client = net.connect(options, () => {
        client.write(headers);
        client.setKeepAlive(true, 1000);
        NetKeepAlive.setKeepAliveInterval(client, 1000);
        NetKeepAlive.setKeepAliveInterval(client, 12);
    });
    return client;
}

export function setupClientListeners(client: any, callback: (data: any) => void, errorCallback: (error: any) => void): void {
    client.on('data', (data: any) => {
        callback(data);
    });
    client.on('error', (error: any) => {
        errorCallback(error);
    });
}

