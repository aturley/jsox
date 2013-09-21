`JSOX`
=====

**Send and receive OSC messages in the modern web browser.**

Example over websockets:

    var host = "ws://localhost:9000";
    var ws = new WebSocket(host);
    var fr = new FileReader();

    // sending
    var m = new OSCMessage();
    m.address = "/synth/freq";
    m.addString("Changing to 89!");
    m.addInt(89);
    m.addFloat(Math.PI);
    ws.send(m.getString().buffer);

    // receiving
    ws.onmessage = function (evt) {
        try {
            fr.readAsArrayBuffer(evt.data);
        } catch(err) {
            console.log(err);
        }
    };

    fr.onload = function(evt) {
        var recv = new OSCReceiver(fr.result);
        console.log(recv.asObject);
    };
