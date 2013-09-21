var print = function (msg) {
    console.log(msg);
};

var assert = function (condition) {
    if (condition) {
	print("PASS");
    } else  {
	print("FAIL");
    };
};


var test = function (type, value) {
    var buffer;
    var m = new OSCMessage();
    var result;
    var receive;

    m.address = '/test-' + type;

    if (type == 'i') {
	m.addInt(value);
    } else if (type == 'f') {
	m.addFloat(value);
    } else if (type == 's') {
	m.addString(value);
    }

    result = m.uIntByteArray();

    receive = new OSCReceiver(result);
    var argType = receive.asObject.args[0][0];
    var argValue = receive.asObject.args[0][1];

    print("testing type '" + type + "' with value: " + value + "\n");
    print("expected arg type: " + type + " " + "received: " + argType);
    print("expected arg value: " + value + " " + "received: " + argValue);
    assert((argType === type));
};

test('i', 5);
test('f', 5.5);
test('s', 'jsox is good');
