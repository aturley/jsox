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
    console.log(byteArray[3]);
    byteArray[1] = (this.value & 0xFF0000) >> 16;
    console.log(byteArray[2]);
    byteArray[2] = (this.value & 0xFF00) >> 8;
    console.log(byteArray[1]);
    byteArray[3] = this.value & 0xFF;
    console.log(byteArray[0]);
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
    var padding = ["\x00\x00\x00\x00", "\x00\x00\x00", "\x00\x00", "\x00"];
    
    var byteString = this.value + padding[this.value.length % 4];
    var byteArray = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
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

var OSCMessage = function() {
  this.address = "";
  this.args = [];
};

OSCMessage.prototype.parseString = function (s) {
  this.args = [];

  // Parse the address and store it.
  var remainder = s;

  var addressEnd = remainder.indexOf("\x00");
  this.address = remainder.substr(0, addressEnd);
  // Chop off the left side of the string up to the argument type list.
  // This can be done by rounding the addressEnd up to the next multiple 
  // of 4 and removing that many characters from the left. I'm not sure if
  // bitwise operations are the best thing here, but I'm hoping it's marginally
  // faster than rounding.
  remainder = remainder.substr(((addressEnd >> 2) + 1 ) << 2);

  // Parse the argument type list.
  var typeListEnd = remainder.indexOf("\x00");
  var typeList = remainder.substr(0, typeListEnd);
  remainder = remainder.substr(((typeListEnd >> 2) + 1 ) << 2);

  // Parse the arguments on at a time.
  for (var i = 0; i < typeList.length; i++) {
    if (typeList[i] == 'f') {
      var floatArg = new OSCFloatArg(0.0);
      floatArg.setFromString(remainder.substr(0, 4));
      this.args.push(floatArg);
      remainder = remainder.substr(4);
    } else if (typeList[i] == 'i') {
      var intArg = new OSCIntArg(0);
      intArg.setFromString(remainder.substr(0, 4));
      this.args.push(intArg);
      remainder = remainder.substr(4);
    } else if (typeList[i] == 's') {
      var stringArg = new OSCStringArg("");
      var stringEnd = ((remainder.indexOf("\x00") >> 2) + 1) << 2;
      stringArg.setFromString(remainder.substr(0, stringEnd));
      this.args.push(stringArg);
      remainder = remainder.substr(stringEnd);
    }
  }
  return this;
};

OSCMessage.prototype.getString = function() {
    var bytes = [];
    // address
    bytes.push((new OSCStringArg(this.address)).getString());
    // types
    bytes.push((new OSCStringArg("," + this.getTypes().join(""))).getString());
    // args
    for (var i = 0; i < this.args.length; i++) {
        bytes.push(this.args[i].getString());
    }
    var totalLength = 0;
    for (var i = 0; i< bytes.length; i++) {
        totalLength += bytes[i].length;
    }
    var byteArray = new Uint8Array(totalLength);
    var currentPosition = 0;
    for (var i = 0; i< bytes.length; i++) {
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
  var types = [];
  var argc = this.args.length;
  for (var i = 0; i < argc; i++) {
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