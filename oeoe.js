/*  oeoe.js
    app-magics off the ö-ö.net very secure messenger/chat app
    (c)opyright 2014, Andreas Briese, eduToolbox@Bri-C GmbH
    4 company:
    see http://edutoolbox.de
    4 messenger:
    see http://ö-ö.net/info.html
    License LGP2 plus: for inspection and noncommercial use only.There are NO WARRENTIES anyway!
*/
  
  // globals
    var input, output, eingaben, chooser, sKey, lKey, audio, audioPlay, userNick,
        body = document.body || $tag('body')[0],
        $ = function(elem){try{return document.getElementById(elem);}catch(e){return NaN;}},// = document.getElementById(args),
        $tag = function(tag){try{return document.getElementsByTagName(tag);}catch(e){return NaN;}},
        audioSupport = {canPlayOgg: false, canPlayMp3: false,},
        recording = false, 
        websocket = NaN,
        sessKey = null, sessSecret, cipherKey, primeBits = 2048, sessPrime, sessionType = null,
        recv = (function(){var rc=document.location.href.split("?");return ((rc.length===2)?"?"+rc[1]:"");})(), 
        cllr = (function(){return recv[0]!="?";})(),
        longMessage, msgLen, multiFrame = false, sp = "",
        storedMssg = [],
        kpflen = 3,
        outMssgNum = 0,
        inMssgNum = 0;
        window.URL = window.URL || window.webkitURL;

    // Navigator
    navigator.info = (function(){
        var N= navigator.appName, ua= navigator.userAgent, tem;
        var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (ua.match(/OPR/i)) M[0]="Opera";
        if(M && (tem= ua.match(/version\/([\.\d]+)/i)) !== null) M[2]= tem[1];
        M= M? [M[1], parseFloat(M[2])]: [N, parseFloat(navigator.appVersion), '-?'];
        return M;
    })();
    navigator.mobile = (function(){
        var N= navigator.appName+navigator.userAgent;
        var M= N.match(/(mobi|ipod|phone|blackb|ios).*(\.?\d+(\.\d+)*)/i);
        return !!M;
    })();
    if(navigator.mobile){
        var meta = document.createElement("meta");
        meta.setAttribute("name","viewport");
        var scle = Math.round((window.innerWidth||window.scrollWidth)/420 ,2);
        if(scle<2.1) {
            meta.setAttribute("content","width=device-width,initial-scale=1,user-scalable=no");
            document.body.style.WebkitTransformOrigin = "0% 0%";
            document.body.style.WebkitTransform = "scale("+scle-0.1+","+scle-0.1+")";
        }else{
            meta.setAttribute("content","width=device-width,initial-scale=0.9,minimum-scale=0.9,user-scalable=yes");
        }
        (document.head||document.childNodes[0][0]).appendChild(meta);
        }

// Audio-play detect 
    try {
        var audioObj = new Audio(""); 
        if (audioObj.canPlayType) {
            audioSupport = {
                canPlayOgg: ("no" != audioObj.canPlayType("audio/ogg")) && ("" != audioObj.canPlayType("audio/ogg")),
                canPlayMp3: ("no" != audioObj.canPlayType("audio/mpeg")) && ("" != audioObj.canPlayType("audio/mpeg")),
            };
            if(!audioSupport.canPlayOgg || sessionType==="bot"){
                audio = $('audio');
                body.removeChild(audio);
                audioPlay = false;
                $("buttons").removeChild($("buttons").childNodes[0]);
            }else{
                var aPlay = $("audioPlay");
                audioPlay = aPlay.checked;
                aPlay.addEventListener("click", function(){
                    audioPlay = this.checked;
                }, false);
                aPlay.addEventListener("touchstart", function(){
                    audioPlay = this.checked;
                }, false);
            }
        }

    } catch (e) {
        try{
            audio = $("audioPlay");
            body.removeChild(audio);
            audioPlay = false;
            $("buttons").removeChild($("buttons").childNodes[0]);
        }catch(e){}
    }

// app-Magics

    Function.prototype.applier = function (argLst) {
        var constr = this, func = function () { constr.apply(this, argLst); };
        func.prototype = this.prototype;
        return new func();
    };

    function scrollDown(){
        footer.style.marginTop = "0px";
        window.scrollTo(0, body.offsetHeight);
        window.scrollTo(0, body.offsetHeight);
        footer.style.marginTop = "-112px";
    }

    function showMedia(hrefLinks, imgLinks, mediaLinks, parentNode){    
        for (var i=0, l = hrefLinks.length; i<l; i++){
            var linker = document.createElement("li");
            var link = document.createElement("a");
            var protoMatch = hrefLinks[i].substr(2,8).match(/(http.*:\/\/)/);
            var protokoll = (protoMatch)?protoMatch[0]:"http://";
            link.href = protokoll + hrefLinks[i].replace(protokoll,"").replace("((","").replace("))","");
            link.target = "_blank";
            link.textContent = link;
            linker.appendChild(link);
            parentNode.appendChild(linker);
        }
        for (var i=0, l = imgLinks.length; i<l; i++){
            var linker = document.createElement("center");
            var showImageChoos = document.createElement("div");
            showImageChoos.innerHTML = "Bild-Link mitgeschickt. Klick zum Ansehen.";
            showImageChoos.className = "showImageChoos";
            showImageChoos.setAttribute("url", imgLinks[i].replace(/@@/g, ""))
            showImageChoos.onclick = function(){
                this.nextSibling.src = this.getAttribute("url");
                this.nextSibling.style.width = "280px";
            };
            linker.appendChild(showImageChoos);
            var img = document.createElement("img");
            linker.appendChild(img);
            img.addEventListener("load", scrollDown, false);
            parentNode.appendChild(linker);
        }
        for (var i=0, l = mediaLinks.length; i<l; i++){
            var linker = document.createElement("center");
            var idx = (mediaLinks[i].lastIndexOf("=")>mediaLinks[i].length-20)?mediaLinks[i].lastIndexOf("="):mediaLinks[i].lastIndexOf("/"); 
            var videolink = '<center><iframe src="//www.youtube.com/embed/' + mediaLinks[i].substring(idx+1,mediaLinks[i].length-2) + '" width="280px" height="auto"></iframe></center>';
            var showImageChoos = document.createElement("div");
            showImageChoos.innerHTML = "Youtube-Link mitgeschickt. Klick zum Ansehen.";
            showImageChoos.className = "showImageChoos";
            linker.style.overflow = "hidden";
            showImageChoos.setAttribute("videolink", videolink)
            showImageChoos.onclick = function(){
                // console.log(mediaLinks[i], idx, videolink)
                this.className = "";
                linker.innerHTML = this.getAttribute("videolink");
            };
            linker.appendChild(showImageChoos);
            parentNode.appendChild(linker);
        }
        return true;
    }


    function appendMssg(msg, client, zeit, parentNode){
        if (typeof(msg)=="undefined" || !msg || msg.length === 0) 
            return true;
        try{
            var hrefLinks = msg.match(/\(\(.*?\)\)/g) || [];
            var imgLinks = msg.match(/@@.*?@@/g) || [];
            var mediaLinks = msg.match(/::.*?::/g) || [];
            var p = document.createElement("p");
            var tp = document.createElement("textarea");
            if(imgLinks || hrefLinks || mediaLinks){
                for(var i=0, l=hrefLinks.length; i<l; i++){
                    msg = msg.replace(hrefLinks[i],"");
                }
                for(var i=0, l=imgLinks.length; i<l; i++){
                    msg = msg.replace(imgLinks[i],"");
                }
                for(var i=0, l=mediaLinks.length; i<l; i++){
                    msg = msg.replace(mediaLinks[i],"");
                }
            }
            if(!(navigator.info[0]=="Opera"&&navigator.info[1]<19)){
                if(sessionType==="chat" && msg.split('__').length === 2){
                    var nickName = msg.split('__')[0];
                    var bg = document.createElement("textarea");
                    bg.value = nickName;
                    bg.style.position = "absolute";
                    bg.style.color = "rgba(180, 100, 250, 1)";
                    bg.style.fontWeight = "750";
                    bg.style.paddingTop = "0px";
                    bg.setAttribute('readonly', '');
                    p.appendChild(bg);
                }
            }
            tp.value = msg.replace(/__/g,": ");
            tp.style.height = "0px";
            tp.setAttribute('readonly', '');
            p.appendChild(tp);
            var tm = document.createElement("textarea");
            var localTime = new Date;
            localTime.setTime(zeit); 
            tm.value = localTime.toLocaleTimeString().split(' ')[0] + " " + localTime.toLocaleDateString();
            tm.className = "zeiten";
            p.appendChild(tm);
            if(client){
                p.className = "client";
            }else{
                p.className = "server";
            };
            if(hrefLinks || imgLinks || mediaLinks){
                !showMedia(hrefLinks, imgLinks, mediaLinks, p);
                scrollDown();
            }
            parentNode.appendChild(p);
            scrollDown();
            tp.style.height = tp.scrollHeight + "px";
            if (bg) {
                bg.style.top = tp.offsetTop - 2 + "px !important";
            }
        }catch(e){}
        return true;
    }

// draw the connect-Info Image
    drawConnectInfo = function(txt){
        var cvs = document.createElement("canvas");
        cvs.id = "connInfo";
        cvs.height = "50";
        var ctx = cvs.getContext("2d");
        ctx.fillStyle = "rgba(190,190,205,1)";
        ctx.fillRect(0,0,300,30);
        ctx.fillStyle = "rgba(236,236,236,1)";
        ctx.fillRect(0,28,300,22);
        for (var i=0;i<35;i++){
            ctx.beginPath();
            ctx.arc(5+300*Math.random(), 5+20*Math.random(), 5+7*Math.random(), 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(95,120,130,0.35)";
            ctx.fill();
            ctx.strokeWidth = "1px";
            ctx.strokeStyle =  "rgba(95,120,130,0.45)";
            ctx.stroke();
        }
        ctx.fillStyle = "rgba(90,90,110,0.9)";
        ctx.font = "20px _sans";
        ctx.textBaseline = "top";
        ctx.fillText(txt||"BlaBlaBlaBla", 3, 3);
        return cvs.toDataURL("image/jpeg", 0.9);;
    }

    function infoOverlay(content){
        var oo = document.createElement("div");
        oo.innerHTML += 'Hallo <i style="font-family:Arial,sans-serif;font-size:104%;color:rgba(0,150,0,1.0);">' + userNick + '</i><br/><span style="line-height:20px">Das ist die Adresse Deines Chats:</span><br/>';
        var ta = document.createElement("textarea");
        oo.appendChild(ta);
        overlay.appendChild(oo);
        oo.innerHTML += '<br/><span style="font-size:90%;">Bitte kopieren und dem Chatpartner mitteilen.</span><br/><span style="font-size:90%;">oder als Bild kopieren & senden</span><br/><u><b>Achtung! Wenn Du das Fenster schliesst, wird Dein Kanal geschlossen!</b></u>';
        var cvs = document.createElement("img");
        cvs.src = drawConnectInfo(content);
        oo.insertBefore(cvs, oo.getElementsByTagName("br")[4]);
        ta = overlay.getElementsByTagName("textarea")[0];
        ta.value = content;
        ta.focus();
        ta.select();
        window.scrollTo(0, 0);
    }

    function showMessage(msg, client, closer) {
        if (typeof(msg)==="undefined" || msg.substr(0,3)===":::") return;
        if (msg.substr(0,3)==="???"){
            recv = msg.substr(3);
            nickPopUP(recv);
            recv = recv.substr(recv.indexOf("?")+1);
            return;
        }
        if (msg.substr(0,msg.indexOf('__')) === userNick){
            msg = msg.substr(msg.indexOf('__')+2)
        }
        if (msg==="!!!DISCONNECT!"){
            websocket.close();
            return true;
        }
        var msgs = output.getElementsByTagName("p");
        if(!client && !closer){
            if (sessionType==="chat"){
                if(sessKey){
                    if (msgs.length > kpflen-3){
                        msg = processMessage(msg);
                        if (msg){
                            inMssgNum++;
                            try{
                                var cmsg = JSON.parse(LZString2.decompressFromBase64(msg));
                                try{
                                    msg = (CryptoJS.Rabbit.decrypt(CryptoJS.lib.CipherParams.create({
                                            ciphertext: {words:cmsg[0], sigBytes:cmsg[1]},
                                            salt: {words:cmsg[2], sigBytes:cmsg[3]}
                                        }), (lKey||siteKey)+sessKey));
                                } catch(e) {
                                    throw e;
                                }
                                sKey = sha(((((sha(inMssgNum)+msg.words[0]).concat(msg.words[1] || msg.words[0]).concat(msg.words[2] || msg.words[1] || msg.words[0]))).concat(msg.words[3] || msg.words[2] || msg.words[1] || msg.words[0])).concat(msg.words[4] || msg.words[3] || msg.words[2] || msg.words[1] || msg.words[0]));
                                msg = msg.toString(CryptoJS.enc.Utf8);
                            }catch(e){
                                websocket.send('!!!DISCONNECT!');
                                websocket.close();
                                // console.log(e);
                                alert("Connection down !\nBei langsamen Netzverbindungen (z.B. Tor, JonDonym, FreeProxies) bitte unter about:config die Einstellung network.websocket.timeout.open und .close auf 1000 hochsetzen.");
                                return;
                            }
                        }
                    }
                }
            } 
        }
        // console.log(msg,recv)
        if (!cipherKey && !!msg && msg.substr(0,3)==="---") {
            sKey = "";
            if(!dhExchge(msg.substr(3)))
                alert("Eine abgesicherte Verbindung konnte nicht hergestellt werden.");
        }else if(msg===recv||msg===recv.substr(1)){
            // skip
        }else{
            var showTime = (new Date).getTime();
            if (appendMssg(msg, client, showTime, output)) {
                if(msgs.length === kpflen){
                    output.removeChild(msgs[0]);
                    output.removeChild(msgs[0]);
                    kpflen = -1;
                };
                if(!client && audioPlay)audio.play();
            };
            scrollDown();
            if(!navigator.mobile){
                input.focus();
            }
        }
        return true;
    }

    function reload(){
        document.location.href = document.location.href;
    }

    function processMessage(msg){
        msg = msg.split('#');
        firstFrame = msg.length == 2;
        msgLen = (firstFrame)?msg[0]:msgLen;
        multiFrame = (firstFrame)?(msg[1].length < msgLen):multiFrame;
        if (firstFrame) {
            if (multiFrame) {
                longMessage = msg[1];
                return false;
            } else {
                return msg[1];
            }
        } else if(multiFrame){
            longMessage += msg[0];
            if(longMessage.length >= msgLen){   
                multiFrame = false;
                return longMessage;
            } else {
                return false;
            }
        }
    }
    
    s20seedBuf = function(idx){
        var i = 0, 
            C32 = [], 
            C8 = []; 
        for(;i<32;){
            C32.push(cipherKey[(idx+i++)%(cipherKey.length-30)]);
        }
        for(;i<40;){
            C8.push(cipherKey[(idx+i++)%(cipherKey.length-30)]);
        }
        return [C32,C8]
    };
    
    function onMessage(e) {
        if (typeof(e.data)==="string") {
            if(sessionType==="chat" && (e.data.substr(0,3)===":::" || sp.length>0)){
                if (!sessKey) {
                    sp += e.data
                    if(sp.length>619){
                        overlay.innerHTML = "";
                        if(cllr)websocket.send(sp);
                        sessPrime = sp.substr(3)
                        sp = "";
                        sessKey = sha(sessPrime);
                        if (dhKeys(sessPrime)) {
                            var mkey = siteKey+sessKey;
                            var cmsg = CryptoJS.Rabbit.encrypt(publicKey, mkey);
                            cmsg = LZString2.compressToBase64(JSON.stringify([cmsg.ciphertext.words, cmsg.ciphertext.sigBytes, cmsg.salt.words, cmsg.salt.sigBytes]));
                            websocket.send(cmsg.length + '#' + cmsg);
                        } else{
                            websocket.send('!!!DISCONNECT!');
                            websocket.close();
                        }
                    }
                } else if(sessPrime){
                          openInput();
                          appendMssg("Verbindung abgesichert.", false, (new Date).getTime(), output);
                          sessPrime = null;
                }
            } else if (e.data==="&&&"){
                websocket.send(recv);
            } else if (e.data.length<8){
                // discard
            } else {
                showMessage(e.data, false, false);
            }
        } else {
            var reader = new FileReader();
            reader.addEventListener("loadend", function(){
                var i = 1,
                    j = 0,
                    a = (new Uint8Array(reader.result)),
                    l = a.length,
                    bab = new ArrayBuffer(l-171),
                    // b = []
                    b = new Uint8Array(bab),
                    encBuf = s20seedBuf(a[0]),
                    S20 = Salsa20.init(encBuf[0],encBuf[1]),
                    name = "", 
                    type = "";
                for (;i<121;i++){
                    name+=String.fromCharCode(a[i]^S20.getBytes(1)[0]);
                }
                name = name.replace(/ /g,"");
                for (;i<171;i++){
                    type+=String.fromCharCode(a[i]^S20.getBytes(1)[0]);
                }
                type = type.replace(/ /g,"");
                for(;i<l;b[j++]=a[i++]^S20.getBytes(1)[0]){}
                var imgShown = false;
                if(type==="canvas/png"){
                    var imgStr = "", 
                        bl = b.length, 
                        i = 0;
                    showMessage("Bild hochgeladen. (image/png :" + parseInt(bl/1000) +"kb)", false, true)
                    for(;i<bl;imgStr+=String.fromCharCode(b[i++])){}
                    var centerer = document.createElement('center'),
                        showCanvasAsImg = document.createElement('img');
                    showCanvasAsImg.src = imgStr;
                    imgShown = true;
                    centerer.appendChild(showCanvasAsImg);
                    output.appendChild(centerer);
                    imgStr = atob(imgStr.split(',')[1]);
                    bl = imgStr.length;
                    bab = new ArrayBuffer(bl);
                    b = new Uint8Array(bab);
                    for(i=0;i<bl;b[i]=imgStr.charCodeAt(i++)){}
                    type = "image/png";
                }else{
                    // Ausgabe als Link oder Object
                    var blob = new Blob( [b.buffer], {type: type});
                    url = window.URL.createObjectURL(blob);
                    link = document.createElement("a");
                    link.textContent = name+"_("+parseInt((a.length-170)/1000)+" kb)";
                    link.innerHTML += "</br>";
                    if(showMessage("Datei hochgeladen. ("+type+")", false, true)){
                        var msgs = output.getElementsByTagName("p");
                        msgs[msgs.length-1].insertBefore(link, msgs[msgs.length-1].childNodes[1]);
                    };
                    if(navigator.info[0]!=="Chrome" && ((type.search(/html/i)===-1 && type.search(/appl/i)===-1) || type.search(/pdf/i)!==-1) ){
                        showUpload(msgs, url, type);
                    }
                    // safari
                    if(navigator.info[0].search(/safari/i)!=-1&&navigator.mobile){}else{
                        link.setAttribute("download", name);
                        link.href = url;
                        link.addEventListener("click", function(){
                            delay(window.URL.revokeObjectURL, 120000, url); // 2 min
                            var ta = this.previousElementSibling || this.previousElement;
                            if(ta.type==="submit"){
                                this.parentNode.removeChild(ta)
                            }
                            ta = this.previousElementSibling || this.previousElement;
                            if(ta.type==="textarea"){
                                ta.value = "Datei im Download-Ordner.";
                            }
                            this.parentNode.removeChild(this);
                        }, false);
                    }
                }
            });
            reader.readAsArrayBuffer(e.data);
        }
    }

    showUpload = function(msgs, url, type){
        var buttn = document.createElement("button");
        buttn.typ = type;
        buttn.url = url;
        buttn.className = "vorschau";
        buttn.innerHTML = "Vorschau";
        buttn.onclick = function(){
            type = this.typ;
            url = this.url;
            try{
                if(type.search(/image/i)!==-1){
                    var obj = document.createElement("center");
                    var cImg = document.createElement("img");
                    cImg.setAttribute("src", encodeURI(url));
                    cImg.setAttribute("type", type);
                    cImg.style.maxWidth = "360px";
                    cImg.style.maxHeight = "360px";
                    obj.appendChild(cImg);
                }else if(type.search(/pdf/i)!==-1){
                    var obj = document.createElement("iframe");
                    obj.setAttribute("src", encodeURI(url));
                    // obj.setAttribute("sandbox", "");
                    obj.setAttribute("type", type);
                    obj.setAttribute("width","360");
                    obj.setAttribute("height","360");
                }else {
                    var obj = document.createElement("object");
                    obj.setAttribute("data", encodeURI(url));
                    obj.setAttribute("sandbox", "");
                    obj.setAttribute("type", type);
                    obj.setAttribute("width","360");
                    obj.setAttribute("max-height","360");
                }
                output.appendChild(obj);
            }catch(e){}
            try{
                this.parentNode.removeChild(this);
            }catch(e){}
        }
        msgs[msgs.length-1].insertBefore(buttn, msgs[msgs.length-1].childNodes[1]);;
    };
    
    log2input = function(e){
        if(e.target!=input&&e.target.id!="nick"){
            e.preventDefault();
            input.focus();
        }else if((e.key=="Enter"&&e.shiftKey)||(e.charCode===13&&(e.ctrlKey||e.shiftKey||e.altKey))){
            if (sendMessage()) e.preventDefault();
            input.value = "";
        }
    }
    
    preventEvent = function(event){
        if (event && event.preventDefault) {
            event.preventDefault();
        } else if (window.event && window.event.preventDefault()) {
            window.event.preventDefault();
        }else if (window.event && window.event.returnValue) {
            window.event.returnValue = false;
        }
    };
    
    function openInput(){
        body.removeChild(overlay);
        eingaben.className = "showEingaben";
        input.value = "";
        input.focus();
        overlay.style.backgroundImage = "";
        if(!navigator.mobile){
            window.onresize = scrollDown;
            window.onkeypress = log2input;
            window.onkeyup = log2input;
            window.onkeydown = log2input;
            input.onkeypress = log2input;
            input.onkeyup = log2input;
            input.onkeydown = log2input;
        };
    }

    function onClose() {
        showMessage("Verbindung unterbrochen.", false, true)
        eingaben.className = "hideEingaben";
    }

    function sendMessage() {
        if(multiFrame){
            delay(sendMessage, 100);
        } else {
            var msg = input.value;
            input.value = "";
            if(!!msg){
                outMssgNum++;
                msg = ((!!userNick)?(userNick + "__"):"") +  msg;
                var mkey = (sKey||siteKey)+sessKey;
                var cmsg = CryptoJS.Rabbit.encrypt(msg, mkey);
                var dcmsg = CryptoJS.Rabbit.decrypt(cmsg, mkey);
                lKey = sha(((((sha(outMssgNum)+dcmsg.words[0]).concat(dcmsg.words[1] || dcmsg.words[0]).concat(dcmsg.words[2] || dcmsg.words[1] || dcmsg.words[0]))).concat(dcmsg.words[3] || dcmsg.words[2] || dcmsg.words[1] || dcmsg.words[0])).concat(dcmsg.words[4] || dcmsg.words[3] || dcmsg.words[2] || dcmsg.words[1] || dcmsg.words[0]));
                cmsg = LZString2.compressToBase64(JSON.stringify([cmsg.ciphertext.words, cmsg.ciphertext.sigBytes, cmsg.salt.words, cmsg.salt.sigBytes]));
                websocket.send(cmsg.length + '#' + cmsg);
                if(showMessage(msg, true, false))
                    delay(scrollDown, 200);
            }else if(!navigator.mobile){
                input.focus();
            };
        }
        return true;
    }

    nickPopUP = function(content){
        body.style.backgroundImage = overlay.style.backgroundImage;
        body.style.backgroundSize = overlay.style.backgroundSize;
        if((window.innerHeight||window.scrollHeight)<670){
            var yscale = (window.innerHeight||window.scrollHeight)/900;
            body.style.backgroundPosition = parseInt(74/yscale) + "px "+parseInt(window.innerHeight-525*yscale)+"px, 34px "+(window.innerHeight-15)+"px";
        } else {
            body.style.backgroundPosition = "74px "+(window.innerHeight-525)+"px, 34px "+(window.innerHeight-15)+"px"; 
        }
        var popUp = document.createElement('div');
        popUp.id = "popUp";
        popUp.style.top = (output.lastChild.offsetTop + ((navigator.mobile)?1.1:2.2)* output.lastChild.offsetHeight) + "px" ;
        popUp.innerHTML = 'Hey! Wie willst Du heissen?<input id="nick" type="text" value="... <return>"></input>';
        body.appendChild(popUp);
        var nick = $('nick');
        nick.onfocus = function(){this.value="";};
        nick.addEventListener("keypress", function(e){
            if(e.charCode===13||e.key=="Enter"){
              userNick = this.value;
              if(userNick)
                  try{
                    body.removeChild(this.parentNode)
                    if(cllr)infoOverlay(content);
                  }catch(e){};
            }
        }, false);
    };

    delay = function(func, wait) {    // borrowed from the underscore library
        var args = Array.prototype.slice.call(arguments, 2);
        return setTimeout(function(){ return func.apply(null, args); }, wait);
    };

    function warten(){
        return true;
    }

    function dhKeys(sPrime){
        if(!!warten()){
            try{
                sessPrime = str2bigInt(sPrime, 10, 200);
                if(bitSize(sessPrime)<2056){
                    if(websocket.readyState===websocket.OPEN){
                        websocket.send('!!!DISCONNECT!');
                        websocket.close();
                        alert('illegal DH param')
                    }
                }
                sessSecret = int2bigInt(0, 1);
                for(;(bitSize(sessSecret)<370&&(greater(sessPrime, sub(sessSecret,int2bigInt(2, 1)))));){
                    sessSecret = randBigInt(primeBits, 0);
                }
                var sessGen = powMod(int2bigInt(2, 1), sessSecret, sessPrime);
                publicKey = "---" + bigInt2str(sessGen, 10);
                // console.log(sPrime, publicKey);
                return true;
            }catch(e){
                throw e;
                return false;
            }
        }
    }

    function dhExchge(pKey){
        var partnerKey = str2bigInt(pKey, 10, 200);
        if(greater(int2bigInt(2, 1), partnerKey) || greater(partnerKey, sub(sessPrime, int2bigInt(2, 1)))){
            if(websocket.readyState===websocket.OPEN){
                websocket.send('!!!DISCONNECT!');
                websocket.close()
            }
            alert("Unsichere Schluesselsequenz! Sitzung wird abgebrochen!");
        }
        cipherKey = powMod(partnerKey, sessSecret, sessPrime);
        sessKey = sha(bigInt2str(cipherKey, 10));
        //console.log("ourSecret:", cipherKey);
        var l = cipherKey.length-2;
        var ba = new ArrayBuffer(2*l);
        var ab = new Uint16Array(ba);
        for(;l;ab[--l]=cipherKey[l]){}
        cipherKey = new Uint8Array(ba);
        //console.log("compare:", cipherKey, ab);
        sessSecret = null;
        websocket.send(":::"+bigInt2str(sessPrime,10));
        if(!cllr) nickPopUP();
        return true;
    }

    function makeWebsocket(sock){
        try{
            if(!(typeof(websocket)==="undefined"||isNaN(websocket))){
                if(websocket.readyState===websocket.OPEN) {
                    websocket.send('!!!DISCONNECT!');
                    websocket.close();
                }
            }
        }catch(e){
            console.log(e);
        }
        try{
            websocket = new WebSocket(sock);
        }catch(e){
            try{
                sock = sock.replace(/wss:/i,"ws:");
                websocket = new WebSocket(sock);
            }catch(e){
                console.log(e);
            }
        }
        websocket.onclose = onClose;
        document.onclose = function(){
            websocket.send('!!!DISCONNECT!');
            websocket.close();
        };
        websocket.onmessage = function(e){
            if (typeof(e.data)==="string") try{
                // console.log(e.data.length);
                if (e.data.length<8){
                    websocket.send(recv);
                } else eval(e.data);
            }catch(e){
                try{
                    websocket.send('!!!DISCONNECT!');
                    websocket.close();
                }catch(e){}
                console.log(e);
            }
        };
    }

    function prepareUploadFile(url, file) {
        var fle = file;
        if (!!fle){
            if(multiFrame){
                delay(prepareUploadFile, 100, url, fle);
            } else {
                // input.value = " ... sendet die Datei: " + fle.name;
                // sendMessage();
                delay(uploadFile, 100, url, fle);
            }
        }
    }
    
    function sendXHR(imgData, type, name, url){
        try{
            var a = new Uint8Array(imgData),
                l = a.length,
                b = [],
                blb, 
                i = 0, j = 0, 
                idx = randomBitInt(8),
                encBuf = s20seedBuf(idx),
                S20 = Salsa20.init(encBuf[0],encBuf[1]);
            for(;j<400;b.push(recv.charCodeAt(j++)||32)){}
            b.push(idx);
            for (j=0;i<120;i++){
                b.push((name.charCodeAt(j++)||32) ^S20.getBytes(1)[0]);
            }
            for (j=0;i<170;i++){
                b.push((type.charCodeAt(j++)||32)^S20.getBytes(1)[0]);
            }
            for(i=0;i<l;b.push(a[i++]^S20.getBytes(1)[0])){}
            var blb = new Blob( [(new Uint8Array(b))], {type: type});
            // send via XHR
            var formData = new FormData();
            formData.append("dataFile", blb);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.send(formData);
        }catch(e){alert("Sorry, upload abgebrochen. War die Datei kleiner als 1 MB?");}
        showMessage("Datei gesendet.\n"+name+" ("+type+")", true, false);
    }
    
    function uploadFile(url, file){
        fle = file || $("fle").files[0];
        if (!!fle){               
            reader = new FileReader();
            reader.onprogress = function(e){
            }; 
            if (navigator.mobile&&!(navigator.userAgent.match(/ipad|tablet|android/i)&&navigator.info[1]>=6)){
                reader.addEventListener("load", function(){
                    try{
                        convert2Canvas(this.result, 320, 350, function(canvasData){
                            var imgData = []
                            for(var i=0;i<canvasData.length;imgData.push(canvasData.charCodeAt(i++))){}
                            var name = fle.name.split(".")[0] + ".png";
                            sendXHR(imgData, "canvas/png", name, url);
                            var centerer = document.createElement('center'),
                                showCanvasAsImg = document.createElement('img');
                            showCanvasAsImg.src = canvasData;
                            showCanvasAsImg.style.border = "1px solid #fff";
                            centerer.appendChild(showCanvasAsImg);
                            output.appendChild(centerer);
                        })
                    }catch(e){alert("Upload abgebrochen. War die Datei kleiner als 1 MB?");}
                }, false);
                reader.readAsDataURL(fle);
            }else{
                reader.addEventListener("loadend", function() {
                    if(fle.size<5){
                        alert("File not found.")
                        return;
                    }
                    try{
                        if(fle.size>1500000){
                            alert("Upload abgebrochen. War die Datei kleiner als 1 MB?");
                            return false;
                        };
                        fle.name = fle.name || "dataFile";
                        sendXHR(reader.result, fle.type, fle.name, url);
                    }catch(e){alert("Upload abgebrochen. War die Datei kleiner als 1 MB?");}
                }, false);
                reader.readAsArrayBuffer(fle);
            }
             // clean-up progressbar
        }
    };

    
    convert2Canvas = function(readerResult, maxW, maxH, func){
        var cvs = document.createElement('canvas'),
            ctx = cvs.getContext("2d"),
            img = new Image();
        this.func = func;
        img.onload = function () {
            var imgW = this.width,
                imgH = this.height;
            if (imgW > imgH) {
                if (imgW > maxW) {
                    imgH *= maxW/imgW;
                    imgW = maxW;
                }
            } else {
                if (imgH > maxH) {
                    imgW *= maxH/imgH;
                    imgH = maxH;
                }
            }
            cvs.width = imgW;
            cvs.height = imgH;
            ctx.drawImage(this, 0, 0, imgW, imgH);
            func(cvs.toDataURL("image/png"));
        };
        img.src = readerResult;
    };

    function init() {
        if(!window.WebSocket){
            alert("Dein Webbrowser ist zu alt. Nimm bitte einen neuen - etwa Chrome 26+ oder Safari 6+");
            return;
        }
        sessionType = "chat";
        siteKey = sha("{{.SiteKey}}");
        eingaben = $("eingaben");
        input = $("input");
        if(!navigator.mobile){
            input.focus();
        }
        send = $("send");
        container = $("container")
        overlay  = $("overlay");
        output = $("output");
        audio = $("audio");
        fileUploader = $("fle");
        if(navigator.mobile && navigator.userAgent.match(/(ipad|ipod|iphone)/i) && navigator.info[1]<7){
            fileUploader.parentNode.removeChild(fileUploader);
        } else {          
            fileUploader.onchange = function(e) {
                    prepareUploadFile('https://{{.XHR}}', this.files[0]);
            };
        }
        makeWebsocket("{{.WSproto}}//{{.WSListenAddr}}/chatSocket"+recv);
        if(!!window.ontouchstart){
            send.addEventListener("touchstart", sendMessage, false);
        } else {
            send.addEventListener("click", sendMessage, false);
        }
        var cvsFirma = function(){
            var cvs = document.createElement("canvas");
            cvs.height = 20;
            cvs.width = 300;
            var ctx = cvs.getContext("2d");
            ctx.fillStyle = "rgba(50,171,50,1)";
            ctx.font = "9px Helvetica";
            ctx.textBaseline = "top";
            ctx.fillText("eduToolbox@Bri-C GmbH - Auf der Bleiche 2a - 31157 Sarstedt", 20, 3);
            return cvs.toDataURL();
        }
        if((window.innerHeight||window.scrollHeight)<670){
            var yscale = (window.innerHeight||window.scrollHeight)/900;
            overlay.style.backgroundSize = parseInt(yscale*220) + "px " + parseInt(yscale*374) + "px, " + "300px 20px";
        }
        overlay.style.backgroundImage = "url(data:image/png;base64,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), url(" + cvsFirma() + ")";
    }
    
    init();
