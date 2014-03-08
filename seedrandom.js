    /* seedrandom originally from 
    * http://davidbau.com/encode/seedrandom.js
    *
    * seedrandom is basically a emitter of stringified bytes
    * deriving from a stream cipher algorithm (crypto bit/byte generator)  
    * seeded with/on the browsers crypto.randomValues implementation
    * 
    * the original uses RC4 as bit/byte-Emitter
    * this implementation uses Bernsteins Salsa20 instead 
    */
  
    function seedRand(buf) {
        // initialize Salsa20
        var state = Salsa20.init([
            buf[ 0], buf[ 1], buf[ 2], buf[ 3], buf[ 4], buf[ 5], buf[ 6], buf[ 7],
            buf[ 8], buf[ 9], buf[10], buf[11], buf[12], buf[13], buf[14], buf[15],
            buf[16], buf[17], buf[18], buf[19], buf[20], buf[21], buf[22], buf[23],
            buf[24], buf[25], buf[26], buf[27], buf[28], buf[29], buf[30], buf[31]
        ],[
            buf[32], buf[33], buf[34], buf[35], buf[36], buf[37], buf[38], buf[39]
        ]);

        var width = 256,
            chunks = 6,
            significance = Math.pow(2, 52),
            overflow = significance * 2;

        function numerator() {
          var bytes = state.getBytes(chunks);
          var i = 0,
              r = 0;
          for (; i < chunks; i++) {
              r = r * width + bytes[i];
          }
          return r;
        }

        function randomByte() {
          return state.getBytes(1)[0];
        }

        this.randomBitInt = function (k) {
            if (k > 31) throw new Error("Too many bits.");
            var i = 0, r = 0;
            var b = Math.floor(k / 8);
            var mask = (1 << (k % 8)) - 1;
            if (mask) r = randomByte() & mask;
            for (; i < b; i++){
                r = (256 * r) + randomByte();
            }
            return r;
        }
        
        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        return function () {               
            var n = numerator(),
                d = Math.pow(width, chunks),
                x = 0; 
            for (;n<significance;) {       
                n = (n + x) * width;           
                d *= width;                    
                x = randomByte();              
            }
            for (;n>=overflow;) {          
                n /= 2;                        
                d /= 2;                        
                x >>>= 1;                      
                }
            return (n + x) / d;              
        }

    }

    function getSeed() {
    var buf;
    if ( (typeof crypto !== 'undefined') &&
         (typeof crypto.randomBytes === 'function')
    ) {
      try {
        buf = crypto.randomBytes(40);
      } catch (e) { throw e; }
    } else if ( (typeof crypto !== 'undefined') &&
                (typeof crypto.getRandomValues === 'function')
    ) {
      buf = new Uint8Array(40);
      crypto.getRandomValues(buf);
    } else {
      if (confirm('Browser hat keinen crypto-Pseudo-Zufallszahlengenerator (CSPRNG). Stattdessen wird der siteKey genommen. Okay?')){
        var ints = mult(randBigInt(256,1),str2bigInt("{{.SiteKey}}",16)), l=ints.length, bab = new ArrayBuffer(l*2), ab = new Uint16Array(bab);
        for(;l;ab[--l]=ints[l]){}
        buf = (new Uint8Array(ab)).subarray(0,40);        
      } else throw new Error("CSPRNG-Generation failed!")
      
    }
    return Array.prototype.slice.call(buf, 0);
    }

    Math.random = seedRand(getSeed());
    
    /* sha object based on: 
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-256
     * Version 0.3 Copyright Angel Marin 2003-2004
     * BSD Style License: http://anmar.eu.org/
     * Some bits taken from Paul Johnston's SHA-1 implementation
    */
    var sha = function(s){
        var F={
            a:function(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);},
            S:function(X,n){return(X>>>n)|(X<<(32-n));},
            R:function(X,n){return(X>>>n);},
            Ch:function(x,y,z){return((x&y)^((~x)&z));},
            Maj:function(x,y,z){return((x&y)^(x&z)^(y&z));},
            S0:function(x){return(F.S(x,2)^F.S(x,13)^F.S(x,22));},
            S1:function(x){return(F.S(x,6)^F.S(x,11)^F.S(x,25));},
            G0:function(x){return(F.S(x,7)^F.S(x,18)^F.R(x,3));},
            G1:function(x){return(F.S(x,17)^F.S(x,19)^F.R(x,10));},
            core:function(m,l){var K=[0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2],H=[0x6A09E667,0xBB67AE85,0x3C6EF372,0xA54FF53A,0x510E527F,0x9B05688C,0x1F83D9AB,0x5BE0CD19],W=new Array(64),a,b,c,d,e,f,g,h,i,j,T1,T2;m[l>>5]|=0x80<<(24-l%32);m[((l+64>>9)<<4)+15]=l;for(var i=0;i<m.length;i+=16){a=H[0];b=H[1];c=H[2];d=H[3];e=H[4];f=H[5];g=H[6];h=H[7];for(var j=0;j<64;j++){if(j<16)W[j]=m[j+i];else W[j]=F.a(F.a(F.a(F.G1(W[j-2]),W[j-7]),F.G0(W[j-15])),W[j-16]);T1=F.a(F.a(F.a(F.a(h,F.S1(e)),F.Ch(e,f,g)),K[j]),W[j]);T2=F.a(F.S0(a),F.Maj(a,b,c));h=g;g=f;f=e;e=F.a(d,T1);d=c;c=b;b=a;a=F.a(T1,T2);}H[0]=F.a(a,H[0]);H[1]=F.a(b,H[1]);H[2]=F.a(c,H[2]);H[3]=F.a(d,H[3]);H[4]=F.a(e,H[4]);H[5]=F.a(f,H[5]);H[6]=F.a(g,H[6]);H[7]=F.a(h,H[7]);}return H;},
            s2b:function(s){var b=[],m=(1<<8)-1;for(var i=0;i<s.length*8;i+=8)b[i>>5]|=(s.charCodeAt(i/8)&m)<<(24-i%32);return b;},
            b2h:function(b){var t="0123456789abcdef",s="";for(var i=0;i<b.length*4;i++){s+=t.charAt((b[i>>2]>>((3-i%4)*8+4))&0xF)+t.charAt((b[i>>2]>>((3-i%4)*8))&0xF);}return s;},
            hex:function(s){return F.b2h(F.core(F.s2b(s),s.length*8));}
        };
        return F.hex(s)
    }
    
