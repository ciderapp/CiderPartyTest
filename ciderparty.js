import { RestServer } from './rest.js';
import { WSServer } from './websockets.js';

export class CiderParty {
    static async start() {
        RestServer.server.get("/party/:id/play", async (req, reply) => {
            if (!WSServer.channelExists(req.params.id)) {
                reply.send({
                    success: false,
                    message: "channel does not exist"
                })
                return;
            }
            reply.send({ type: "playback", success: true })
            WSServer.sendEvent(req.params.id, { 
                type: "playback",
                action: "play" 
            })
        })

        RestServer.server.get("/party/:id/pause", async (req, reply) => {
            if (!WSServer.channelExists(req.params.id)) {
                reply.send({
                    success: false,
                    message: "channel does not exist"
                })
                return;
            }
            reply.send({ type: "playback", success: true })
            WSServer.sendEvent(req.params.id, { 
                type: "playback",
                action: "pause" 
            })
        })

        await RestServer.init()
        await WSServer.init()
    }
}