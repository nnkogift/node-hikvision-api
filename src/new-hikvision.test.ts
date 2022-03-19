import Hikvision from "./new-hikvision";
import {ConnectionOptions} from "./interfaces/connect";

const options: ConnectionOptions = {
    host: "localhost",
    port: 3000,
    password: "pass",
    user: "user",
    log: true
}

describe('new-hikvision', () => {
    it('can be instantiated', () => {
        const hikvision = new Hikvision();
        expect(hikvision).toBeTruthy();
    });

    it('can connect', () => {
        const hikvision = new Hikvision();
        hikvision.connect(options);
        expect(hikvision.connected).toBe(true);
    });

    it("emits a 'connect' event", (done) => {
        const hikvision = new Hikvision();
        hikvision.on('connect', () => {
            done();
        });
        hikvision.connect(options);
    });

    it('can disconnect', () => {
        const hikvision = new Hikvision();
        hikvision.connect(options);
        hikvision.disconnect()
        expect(hikvision.connected).toBe(false);
    });

    it("emits a 'disconnect' event", (done) => {
        const hikvision = new Hikvision();
        hikvision.on('disconnect', () => {
            done();
        });
        hikvision.connect(options);
        hikvision.disconnect();
    });

    it("emits a 'error' event", (done) => {
        const hikvision = new Hikvision();
        hikvision.on('error', () => {
            done();
        });
        hikvision.connect(options);
        hikvision.disconnect();
    });


});
