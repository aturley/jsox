var OSCArg = function (v) {
    this.value = v;
};

OSCArg.prototype.set = function(v) {
    this.value = v;
};

var OSCFloatArg = function (v) {
    this.value = v;
};

OSCFloatArg.prototype = new OSCArg();

OSCFloatArg.prototype.getType = function() {
    return "f";
};

OSCFloatArg.prototype.getBytes = function() {
    return ieee754.floatToBytes(this.value);
};

OSCFloatArg.prototype.getString = function() {
    return ieee754.floatToBytes(this.value);
};

OSCFloatArg.prototype.setFromBytes = function(b) {
    this.value = ieee754.bytesToFloat(b);
};

OSCFloatArg.prototype.setFromString = function(s) {
    var b = [s[0].charCodeAt(), s[1].charCodeAt(), s[2].charCodeAt(), s[3].charCodeAt()];
    this.setFromBytes(b);
};

var OSCIntArg = function (v) {
    this.value = v;
};

OSCIntArg.prototype = new OSCArg();

OSCIntArg.prototype.getType = function() {
    return "i";
};

OSCIntArg.prototype.getBytes = function() {
    return [((this.value >> 24) & 0xFF), ((this.value >> 16) & 0xFF), ((this.value >> 8) & 0xFF), this.value & 0xFF];
};

OSCIntArg.prototype.getString = function() {
    var byteArray = new Uint8Array(4);
    byteArray[0] = (this.value & 0x7F000000) >> 24;
    byteArray[1] = (this.value & 0xFF0000) >> 16;
    byteArray[2] = (this.value & 0xFF00) >> 8;
    byteArray[3] = this.value & 0xFF;
    if (this.value < 0) {
        byteArray[0] = byteArray[0] | 0x80;
    }
    return byteArray;
};

OSCIntArg.prototype.setFromBytes = function(b) {
    this.value = ((b[0] & 0x7F) << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
    // If the high bit is set then the number is
    if ((b[0] & 0x80) != 0) {
	this.value = -(0x80000000) + this.value;
    }
};

OSCIntArg.prototype.setFromString = function(s) {
    var b = [s[0].charCodeAt(), s[1].charCodeAt(), s[2].charCodeAt(), s[3].charCodeAt()];
    this.setFromBytes(b);
};

var OSCStringArg = function (v) {
    this.value = v;
};

OSCStringArg.prototype = new OSCArg();

OSCStringArg.prototype.getType = function() {
    return "s";
};

OSCStringArg.prototype.getString = function() {
    var byteArray;
    var byteString;
    var i;
    var padding = ["\x00\x00\x00\x00", "\x00\x00\x00", "\x00\x00", "\x00"];
    byteString = this.value + padding[this.value.length % 4];
    byteArray = new Uint8Array(byteString.length);
    for (i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }
    return byteArray;
};

OSCStringArg.prototype.setFromBytes = function(b) {
    this.value = b.replace("\x00", "");
    return this;
};

OSCStringArg.prototype.setFromString = function(s) {
    this.value = s.replace("\x00", "");
    return this;
};


// OSCMessage
var OSCMessage = function() {
    this.address = "";
    this.args = [];
};

OSCMessage.prototype.parseString = function (s) {
    var addressEnd = remainder.indexOf("\x00");
    var floatArg;
    var i;
    var intArg;
    var stringArg;
    var stringEnd;

    // Parse the address and store it.
    var remainder = s;
    var typeList = remainder.substr(0, typeListEnd);
    var typeListEnd = remainder.indexOf("\x00");

    this.args = [];
    this.address = remainder.substr(0, addressEnd);
    // Chop off the left side of the string up to the argument type list.
    // This can be done by rounding the addressEnd up to the next multiple
    // of 4 and removing that many characters from the left. I'm not sure if
    // bitwise operations are the best thing here, but I'm hoping it's marginally
    // faster than rounding.
    remainder = remainder.substr(((addressEnd >> 2) + 1 ) << 2);

    // Parse the argument type list.
    remainder = remainder.substr(((typeListEnd >> 2) + 1 ) << 2);

    // Parse the arguments on at a time.
    for (i = 0; i < typeList.length; i++) {
	if (typeList[i] == 'f') {
	    floatArg = new OSCFloatArg(0.0);
	    floatArg.setFromString(remainder.substr(0, 4));
	    this.args.push(floatArg);
	    remainder = remainder.substr(4);
	} else if (typeList[i] == 'i') {
	    intArg = new OSCIntArg(0);
	    intArg.setFromString(remainder.substr(0, 4));
	    this.args.push(intArg);
	    remainder = remainder.substr(4);
	} else if (typeList[i] == 's') {
	    stringArg = new OSCStringArg("");
	    stringEnd = ((remainder.indexOf("\x00") >> 2) + 1) << 2;
	    stringArg.setFromString(remainder.substr(0, stringEnd));
	    this.args.push(stringArg);
	    remainder = remainder.substr(stringEnd);
	}
    }
    return this;
};

OSCMessage.prototype.uIntByteArray = function() {
    var bytes = [];
    var byteArray;
    var currentPosition;
    var i;
    var totalLength;

    // address
    bytes.push((new OSCStringArg(this.address)).getString());

    // types
    bytes.push((new OSCStringArg("," + this.getTypes().join(""))).getString());

    // args
    for (i = 0; i < this.args.length; i++) {
	bytes.push(this.args[i].getString());
    }

    totalLength = 0;
    for (i = 0; i< bytes.length; i++) {
	totalLength += bytes[i].length;
    }

    byteArray = new Uint8Array(totalLength);
    currentPosition = 0;
    for (i = 0; i< bytes.length; i++) {
	for (var j = 0; j< bytes[i].length; j++) {
	    byteArray[currentPosition] = bytes[i][j];
	    currentPosition++;
	}
    }
    return byteArray;
};

OSCMessage.prototype.getArg = function(idx) {
    return this.args[idx];
};

OSCMessage.prototype.getType = function(idx) {
    return this.args[idx].getType();
};

OSCMessage.prototype.getTypes = function() {

    var argc = this.args.length;
    var i;
    var types = [];
    for (i = 0; i < argc; i++) {
	types.push(this.args[i].getType());
    }
    return types;
};

OSCMessage.prototype.addInt = function(v) {
    this.args.push(new OSCIntArg(v));
};

OSCMessage.prototype.addFloat = function(v) {
    this.args.push(new OSCFloatArg(v));
};

OSCMessage.prototype.addString = function(v) {
    this.args.push(new OSCStringArg(v));
};

var OSCReceiver = function(message) {
    // message is an ArrayBuffer
    this.uint8array = new Uint8Array(message);
    this.address = '';
    this.oscArgs = [];
    this.asObject = {};
    this.translateMessage();
    this.toObject();
};

OSCReceiver.prototype.parseInteger = function (index) {
    var value = 0; // holds 32 bit integer
    value |= (this.uint8array[index] << 24) & 0xFF000000;
    value |= (this.uint8array[index + 1] << 16) & 0xFF0000;
    value |= (this.uint8array[index + 2] << 8) & 0xFF00;
    value |= this.uint8array[index + 3] & 0xFF;
    return value;
};

OSCReceiver.prototype.parseFloat = function (index) {
    var value = 0;
    value |= (this.uint8array[index] << 24) & 0xFF000000;
    value |= (this.uint8array[index + 1] << 16) & 0xFF0000;
    value |= (this.uint8array[index + 2] << 8) & 0xFF00;
    value |= this.uint8array[index + 3] & 0xFF;
    return ieee754.hexToFloat(value);
};

OSCReceiver.prototype.parseString = function (index) {
    var i = 0;
    var nullOffset = [4, 3, 2, 1];
    var offset = 0;
    var value = '';

    while (this.uint8array[index + i] != 0) {
        value += String.fromCharCode(this.uint8array[index + i]);
        i++;
    }
    offset = i + nullOffset[i%4];
    return {'offset':offset, 'value':value};
};

OSCReceiver.prototype.parseArg = function (argType, argsIndex, dataIndex) {
    var stringResultObject;
    if (argType === 'i') {
        this.oscArgs[argsIndex][1] = this.parseInteger(dataIndex);
        return dataIndex + 4;
    } else if (argType === 'f') {
        this.oscArgs[argsIndex][1] = this.parseFloat(dataIndex);
        return dataIndex + 4;
    } else if (argType === 's') {
        stringResultObject = this.parseString(dataIndex);
        this.oscArgs[argsIndex][1] = stringResultObject['value'];
        return dataIndex + stringResultObject['offset'];
    } else {
        throw new Error("argument " + argType + " not supported");
    }
};

OSCReceiver.prototype.parseArgs = function (dataIndex) {
    var i = 0;
    for (i = 0; i < this.oscArgs.length; i++) {
        dataIndex = this.parseArg(this.oscArgs[i][0], i, dataIndex);
    }
};

OSCReceiver.prototype.translateMessage = function () {
    var addressParsed = false;
    var argsParsed = false;
    var argsString = '';
    var argTypesParsed = false;
    var i;
    var value = 0;

    for (i = 0; i < this.uint8array.length; i++) {
        value = parseInt(this.uint8array[i]);
        if (value === 0) {
            if ((addressParsed === false) && (this.address != '')){
                addressParsed = true;
            } else if ((argTypesParsed === false) && (argsString != '')){
                for (var j = 0; j < argsString.length; j++) {
                    this.oscArgs[j] = [argsString[j]];
                }
                argTypesParsed = true;
            } else if (i%4 === 0) {
                this.parseArgs(i);
                break;
            }
        } else if (addressParsed === false) {
            this.address += String.fromCharCode(value);
        } else if (argTypesParsed === false) {
            if (value != 44) { // skip the comma
                argsString += String.fromCharCode(value);
            }
        } else if (argsParsed === false) {
            this.parseArgs(i);
            break;
        }
    }
};

OSCReceiver.prototype.toObject = function () {
    this.asObject = {
	'address': this.address,
        'args': this.oscArgs
    };
};


var ieee754 = {
    log2: Math.log(2),
    floatToBytes: function (n) {
	// (-1)^s * c * b ^ q
	// 1.0 <= c < 2
	// c will be normalized when it is stored in the IEEE 745 format
	// nc = c - 1
	// s:1
	// q:7
	// q will be biased by 127
	// bq = q + 127
	// nc:23
	// [s[0] + bq[7:1]] [q[0] + nc[22:16]] + [nc[15:8]] + [nc[7:0]]
	var s = ((n < 0) ? 1 : 0);
	var un = (n < 0) ? -n : n;
	var q = Math.floor(Math.log(un) / this.log2);
	var bq = q + 127;
	var c = un / Math.pow(2, q);
	var nc = Math.ceil((c - 1) * Math.pow(2, 23));

	// Get the sign of the exponent, modify q


	var bytes = new Uint8Array(4);
	bytes[0] = s << 7 | ((bq >> 1) & 0x7F);
	bytes[1] = ((bq & 0x01) << 7) | ((nc >> 16) & 0xFF);
	bytes[2] = (nc >> 8) & 0xFF;
	bytes[3] = nc & 0xFF;

	return bytes;
    },
    bytesToFloatDetails: function (b) {
	var s = ((b[0] >> 7) & 0x01 == 1) ? -1 : 1;
	var bq = ((b[0] & 0x7F) << 1) | (b[1] >> 7);
	var nc = ((b[1] & 0x7F) << 16) | (b[2] << 8) | b[3];
	var q = bq - 127;
	var c = nc / Math.pow(2, 23) + 1;
	return {s:s, bq:bq, nc:nc, q:q, c:c, bytes: s * c * Math.pow(2, q)};
    },
    bytesToFloat: function (b) {
	return this.bytesToFloatDetails(b).bytes;
    },
    hexToFloat: function (hex) {
	// via http://stackoverflow.com/questions/770342/how-can-i-convert-four-characters-into-a-32-bit-ieee-754-float-in-perl
	var sign = (hex & 0x80000000) ? -1 : 1;
	var exp = ((hex & 0x7f800000) >> 23) - 127;
	var man = (hex & 0x007fffff | 0x00800000);
	return sign * Math.pow(2, exp) * (man/(1<<23));
    }
};
