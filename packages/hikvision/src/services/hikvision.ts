import {ConnectionOptions} from "../interfaces/connect";
import net from "net";
import NetKeepAlive from "net-keepalive";


export function generateHeader(options: ConnectionOptions, path: string): string {
    const urlHeader = `GET ${path} HTTP/1.1`
    const authHeader = `Authorization: Basic ${Buffer.from(`${options.user}:${options.password}`).toString('base64')}`;
    const hostHeader = `Host: ${options.host}:${options.port}`;
    const acceptHeader = `Accept: multipart/x-mixed-replace\r\n`;

    return `${urlHeader}\r\n${authHeader}\r\n${hostHeader}\r\n${acceptHeader}`;
}

export function requestConnection(options: ConnectionOptions, headers: string, {
    onError,
    onSuccess,
    onData,
    onClose,

}: { onSuccess: (data: any) => void, onError: (error: any) => void, onData: (data: any) => void, onClose: () => void }): any {
    const client: any = net.connect(options, () => {
        client.write(headers);
        client.setKeepAlive(true, 1000);
        NetKeepAlive.setKeepAliveInterval(client, 1000);
        NetKeepAlive.setKeepAliveProbes(client, 12);
        setupClientListeners(client, {onData, onError, onClose});
        onSuccess(client);
        return client;
    });
}

export function setupClientListeners(client: any, {
    onData,
    onError,
    onClose
}: { onData: (data: any) => void, onError: (error: any) => void, onClose: () => void }): void {
    console.info("Setting up client listeners");
    client.on('data', (data: any) => {
        onData(data);
    });
    client.on('error', (error: any) => {
        onError(error);
    });
    client.on('close', () => {
        onClose()
    });
}

