import { RestServer } from './rest.js';
import { WSServer } from './websockets.js';

export class CiderParty {
    static async start() {
        RestServer.server.get("/party/:id/play", async (req, reply) => {
            reply.send({ hello: req.params.id })
            WSServer.sendEvent(req.params.id, {content: "hello"})
        })

        await RestServer.init()
        await WSServer.init()
    }
}