function makeClient() {
    let mk = MusicKit.getInstance()
    const clientInstance = {
        ws: null,
        play() {
            mk.play()
            ws.send(JSON.stringify({
                type: "sendEvent",
                event: {
                    type: 'playbackStateDidChange',
                    state: 2
                }
            }))
        },
        pause() {
            mk.pause()
            ws.send(JSON.stringify({
                type: "sendEvent",
                event: {
                    type: 'playbackStateDidChange',
                    state: 3
                }
            }))
        }
    }

    mk.addEventListener(MusicKit.Events.playbackTimeDidChange, () => {
        ws.send(JSON.stringify({
            type: "sendEvent",
            event: {
                type: 'playbackTimeDidChange',
                playbackTime: mk.currentPlaybackTime
            }
        }))
    })

    mk.addEventListener(MusicKit.Events.nowPlayingItemDidChange, (e) => {
        if(mk.nowPlayingItem != "undefined") {
            ws.send(JSON.stringify({
                type: "sendEvent",
                event: {
                    type: 'nowPlayingItemDidChange',
                    item: mk.nowPlayingItem
                }
            }))
        }
    })

    const ws = new WebSocket(`ws://localhost:8888`);

    ws.onopen = function (e) {
        console.log('connected');
    };
    ws.onclose = function (e) {
        console.log('disconnected');
    };

    ws.onerror = function (err) {
        console.log(err);
    }

    ws.onmessage = function (data) {
        console.log(data.data)
        let msg = JSON.parse(data.data)
        switch (msg.type) {
            case "sendEvent":
                let event = msg.event
                switch (event.type) {
                    case "playbackTimeDidChange":
                        // if the playback time changed by more than 2 seconds then update the time
                        if (Math.abs(mk.currentPlaybackTime - event.playbackTime) > 2) {
                            mk.seekToTime(event.playbackTime)
                        }
                        break;
                    case "nowPlayingItemDidChange":
                        console.warn()
                        if(typeof event.item != "undefined") {
                            let kind = event.item.attributes.playParams.kind
                            if (kind.substr(-1) != 's') {
                                kind += 's'
                            }

                            mk.setQueue({ [kind]: [event.item.attributes.playParams.id] }).then(function (queue) {
                                MusicKit.getInstance().play()
                            })
                        }

                        break;
                    case "playbackStateDidChange":
                        switch (msg.state) {
                            default:

                                break;
                            case 2: // playing
                                mk.play()
                                break;
                            case 3: // paused
                                mk.pause()
                                break;
                        }
                        break;
                }
                break;
        }

    };


    clientInstance.ws = ws

    return clientInstance
};let mk = makeClient()