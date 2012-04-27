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