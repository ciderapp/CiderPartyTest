import { WebSocketServer } from 'ws';

class Channel {
    constructor(name) {
        this.id = generateUUID()
        this.name = name
        this.clients = []
        this.messages = []
        this.isPrivate = false
        this.currentPlaybackTime = 0
        this.isPlaying = false
        this.queue = []
        this.MediaItem = {}
    }
}

export class WSServer {
    static server = null
    static clients = []
    static channels = []

    static channelExists(channelId) {
        return WSServer.channels.find(channel => channel.id === channelId)
    }

    static async init() {
        const testChannel = new Channel("Default Testing Channel")
        testChannel.id = "test"
        WSServer.channels.push(testChannel)

        WSServer.server = new WebSocketServer({
            port: 8889,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    // See zlib defaults.
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            }
        });

        WSServer.server.on('connection', function (client) {
            WSServer.clients.push(client);
            console.log('client connected');
            client.id = generateUUID()

            // add a paramater to the first client for isHost
            if (WSServer.clients.length === 1) {
                client.isHost = true;
            }

            let isHostMsg = "you are the host"
            if (!client.isHost) {
                isHostMsg = "you are not the host"
            }
            client.send(JSON.stringify({
                type: 'welcome',
                message: 'Welcome to the Cider Party Prototype, ' + isHostMsg
            }));

            // add the user to the default channel
            // let defaultChannel = WSServer.channels[0]
            // defaultChannel.clients.push(client)

            // when the client sends a message
            client.on('message', function (message) {
                let msg = {};
                try {
                    msg = JSON.parse(message)
                } catch (e) {
                    return;
                }
                console.log(msg)
                // only accept messages from the first client
                switch (msg.type) {
                    case 'listChannels':
                        let channelsList = []
                        WSServer.channels.forEach(channel => {
                            channelsList.push({
                                id: channel.id,
                                name: channel.name,
                                isPrivate: channel.isPrivate,
                                userCount: channel.clients.length
                            })
                        })
                        client.send(JSON.stringify({
                            type: 'listChannels',
                            channels: channelsList
                        }))
                        break;
                    case 'createChannel':
                        let channel = new Channel(msg.name)
                        WSServer.channels.push(channel)
                        client.send(JSON.stringify({
                            type: 'channelCreated',
                            channel: channel
                        }))
                        break;
                    case 'joinChannel':
                        let channelToJoin = WSServer.channels.find(channel => channel.id === msg.channelId)
                        if (channelToJoin) {
                            channelToJoin.clients.push(client)
                            client.send(JSON.stringify({
                                type: 'channelJoined',
                                channel: channelToJoin
                            }))
                        }
                        break;
                    case 'leaveChannel':
                        let channelToLeave = WSServer.channels.find(channel => channel.id === msg.channelId)
                        if (channelToLeave) {
                            channelToLeave.clients.splice(channelToLeave.clients.indexOf(client), 1)
                            client.send(JSON.stringify({
                                type: 'channelLeft',
                                channel: channelToLeave
                            }))
                        }
                        break;
                    case 'sendEvent':
                        // send the event to all clients in the default channel
                        let defaultChannel = WSServer.channels[0]
                        defaultChannel.clients.forEach(client => {
                            // if the client is not the sender
                            if (client !== this) {
                                if (msg.event.type == "nowPlayingItemDidChange" && !client.isHost) {
                                    return
                                }
                                client.send(JSON.stringify({
                                    type: 'sendEvent',
                                    event: msg.event
                                }))
                            }
                        })
                        break;
                }
            })
            // when the client disconnects remove them from the list of clients and any channels they are in
            client.on('close', function () {
                WSServer.clients.splice(WSServer.clients.indexOf(client), 1);
                WSServer.channels.forEach(channel => {
                    if (channel.clients.indexOf(client) > -1) {
                        channel.clients.splice(channel.clients.indexOf(client), 1)
                    }
                })
            })
        });

        WSServer.server.on('message', function (message) {

        })

        WSServer.server.on('close', function (client) {

        })
    }

    static sendEvent(channelId, event, data = {}) {
        // send the event to all clients in the channel
        let channel = WSServer.channels.find(channel => channel.id === channelId)
        channel.clients.forEach(client => {
            // if (client !== this) {
                client.send(JSON.stringify({
                    type: 'sendEvent',
                    event: event
                }))
            // }
        })
    }
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
