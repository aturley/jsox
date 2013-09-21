var OSCArg=function(a){this.value=a};OSCArg.prototype.set=function(a){this.value=a};var OSCFloatArg=function(a){this.value=a};OSCFloatArg.prototype=new OSCArg;OSCFloatArg.prototype.getType=function(){return"f"};OSCFloatArg.prototype.getBytes=function(){return ieee754.floatToBytes(this.value)};OSCFloatArg.prototype.getString=function(){return ieee754.floatToBytes(this.value)};OSCFloatArg.prototype.setFromBytes=function(a){this.value=ieee754.bytesToFloat(a)};
OSCFloatArg.prototype.setFromString=function(a){a=[a[0].charCodeAt(),a[1].charCodeAt(),a[2].charCodeAt(),a[3].charCodeAt()];this.setFromBytes(a)};var OSCIntArg=function(a){this.value=a};OSCIntArg.prototype=new OSCArg;OSCIntArg.prototype.getType=function(){return"i"};OSCIntArg.prototype.getBytes=function(){return[this.value>>24&255,this.value>>16&255,this.value>>8&255,this.value&255]};
OSCIntArg.prototype.getString=function(){var a=new Uint8Array(4);a[0]=(this.value&2130706432)>>24;a[1]=(this.value&16711680)>>16;a[2]=(this.value&65280)>>8;a[3]=this.value&255;0>this.value&&(a[0]|=128);return a};OSCIntArg.prototype.setFromBytes=function(a){this.value=(a[0]&127)<<24|a[1]<<16|a[2]<<8|a[3];0!=(a[0]&128)&&(this.value=-2147483648+this.value)};OSCIntArg.prototype.setFromString=function(a){a=[a[0].charCodeAt(),a[1].charCodeAt(),a[2].charCodeAt(),a[3].charCodeAt()];this.setFromBytes(a)};
var OSCStringArg=function(a){this.value=a};OSCStringArg.prototype=new OSCArg;OSCStringArg.prototype.getType=function(){return"s"};OSCStringArg.prototype.getString=function(){var a,b,c;b=this.value+["\x00\x00\x00\x00","\x00\x00\x00","\x00\x00","\x00"][this.value.length%4];a=new Uint8Array(b.length);for(c=0;c<b.length;c++)a[c]=b.charCodeAt(c);return a};OSCStringArg.prototype.setFromBytes=function(a){this.value=a.replace("\x00","");return this};
OSCStringArg.prototype.setFromString=function(a){this.value=a.replace("\x00","");return this};var OSCMessage=function(){this.address="";this.args=[]};
OSCMessage.prototype.parseString=function(a){var b=e.indexOf("\x00"),c,d,e=a;a=e.substr(0,c);c=e.indexOf("\x00");this.args=[];this.address=e.substr(0,b);e=e.substr((b>>2)+1<<2);e=e.substr((c>>2)+1<<2);for(b=0;b<a.length;b++)"f"==a[b]?(c=new OSCFloatArg(0),c.setFromString(e.substr(0,4)),this.args.push(c),e=e.substr(4)):"i"==a[b]?(c=new OSCIntArg(0),c.setFromString(e.substr(0,4)),this.args.push(c),e=e.substr(4)):"s"==a[b]&&(c=new OSCStringArg(""),d=(e.indexOf("\x00")>>2)+1<<2,c.setFromString(e.substr(0,
d)),this.args.push(c),e=e.substr(d));return this};OSCMessage.prototype.uIntByteArray=function(){var a=[],b,c,d;a.push((new OSCStringArg(this.address)).getString());a.push((new OSCStringArg(","+this.getTypes().join(""))).getString());for(d=0;d<this.args.length;d++)a.push(this.args[d].getString());for(d=b=0;d<a.length;d++)b+=a[d].length;b=new Uint8Array(b);for(d=c=0;d<a.length;d++)for(var e=0;e<a[d].length;e++)b[c]=a[d][e],c++;return b};OSCMessage.prototype.getArg=function(a){return this.args[a]};
OSCMessage.prototype.getType=function(a){return this.args[a].getType()};OSCMessage.prototype.getTypes=function(){var a=this.args.length,b,c=[];for(b=0;b<a;b++)c.push(this.args[b].getType());return c};OSCMessage.prototype.addInt=function(a){this.args.push(new OSCIntArg(a))};OSCMessage.prototype.addFloat=function(a){this.args.push(new OSCFloatArg(a))};OSCMessage.prototype.addString=function(a){this.args.push(new OSCStringArg(a))};
var OSCReceiver=function(a){this.uint8array=new Uint8Array(a);this.address="";this.oscArgs=[];this.asObject={};this.translateMessage();this.toObject()};OSCReceiver.prototype.parseInteger=function(a){var b;b=0|this.uint8array[a]<<24&4278190080;b|=this.uint8array[a+1]<<16&16711680;b|=this.uint8array[a+2]<<8&65280;return b|=this.uint8array[a+3]&255};
OSCReceiver.prototype.parseFloat=function(a){var b;b=0|this.uint8array[a]<<24&4278190080;b|=this.uint8array[a+1]<<16&16711680;b|=this.uint8array[a+2]<<8&65280;b|=this.uint8array[a+3]&255;return ieee754.hexToFloat(b)};OSCReceiver.prototype.parseString=function(a){for(var b=0,c=0,d="";0!=this.uint8array[a+b];)d+=String.fromCharCode(this.uint8array[a+b]),b++;c=b+[4,3,2,1][b%4];return{offset:c,value:d}};
OSCReceiver.prototype.parseArg=function(a,b,c){if("i"===a)return this.oscArgs[b][1]=this.parseInteger(c),c+4;if("f"===a)return this.oscArgs[b][1]=this.parseFloat(c),c+4;if("s"===a)return a=this.parseString(c),this.oscArgs[b][1]=a.value,c+a.offset;throw Error("argument "+a+" not supported");};OSCReceiver.prototype.parseArgs=function(a){for(var b=0,b=0;b<this.oscArgs.length;b++)a=this.parseArg(this.oscArgs[b][0],b,a)};
OSCReceiver.prototype.translateMessage=function(){var a=!1,b="",c=!1,d,e=0;for(d=0;d<this.uint8array.length;d++)if(e=parseInt(this.uint8array[d]),0===e)if(!1===a&&""!=this.address)a=!0;else if(!1===c&&""!=b){for(c=0;c<b.length;c++)this.oscArgs[c]=[b[c]];c=!0}else{if(0===d%4){this.parseArgs(d);break}}else if(!1===a)this.address+=String.fromCharCode(e);else if(!1===c)44!=e&&(b+=String.fromCharCode(e));else{this.parseArgs(d);break}};
OSCReceiver.prototype.toObject=function(){this.asObject={address:this.address,args:this.oscArgs}};
var ieee754={log2:Math.log(2),floatToBytes:function(a){var b=0>a?1:0,c=0>a?-a:a,d=Math.floor(Math.log(c)/this.log2);a=d+127;c/=Math.pow(2,d);c=Math.ceil((c-1)*Math.pow(2,23));d=new Uint8Array(4);d[0]=b<<7|a>>1&127;d[1]=(a&1)<<7|c>>16&255;d[2]=c>>8&255;d[3]=c&255;return d},bytesToFloatDetails:function(a){var b=a[0]>>7&1?-1:1,c=(a[0]&127)<<1|a[1]>>7;a=(a[1]&127)<<16|a[2]<<8|a[3];var d=c-127,e=a/Math.pow(2,23)+1;return{s:b,bq:c,nc:a,q:d,c:e,bytes:b*e*Math.pow(2,d)}},bytesToFloat:function(a){return this.bytesToFloatDetails(a).bytes},
hexToFloat:function(a){var b=a&8388607|8388608;return(a&2147483648?-1:1)*Math.pow(2,((a&2139095040)>>23)-127)*(b/8388608)}};
