import fastify from "fastify"

export class RestServer {
    static server = fastify({ logger: true })

    static async init () {
        try {
            await RestServer.server.listen(8888)
        }catch(e) {
            RestServer.server.log.error(e)
            process.exit(1)
        }
    }
}