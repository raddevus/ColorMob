// pawns.js

var connection = new signalR.HubConnectionBuilder().withUrl("/colorMobHub").build();
var ctx = null;
var theCanvas = null;
var firebaseTokenRef = null;
var currentUuid = null;
const GRID_SIZE = 800;
var allSquares = [];

window.addEventListener("load", initApp);
var mouseIsCaptured = false;
var LINES = 20;
var lineInterval = 0;

var allTokens = [];

// hoverToken -- token being hovered over with mouse
var hoverToken = null;
var pawnR = null;

function token(userToken) {

    this.size = userToken.size;
    this.imgSourceX = userToken.imgSourceX;
    this.imgSourceY = userToken.imgSourceY;
    this.imgSourceSize = userToken.imgSourceSize;
    this.imgIdTag = userToken.imgIdTag;
    this.gridLocation = userToken.gridLocation;
    this.color = userToken.color;
}

function gridlocation(value) {
    this.x = value.x;
    this.y = value.y
}


function initApp() {
    theCanvas = document.getElementById("gamescreen");
    ctx = theCanvas.getContext("2d");

    ctx.canvas.height = GRID_SIZE;
    ctx.canvas.width = ctx.canvas.height;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", mouseDownHandler);

    connection.on("ReceiveData", handleData);

    function handleData(drawData) {
        if (currentUuid == ""){
            allTokens[drawData.idx].gridLocation.x = drawData.x;
            allTokens[drawData.idx].gridLocation.y = drawData.y;
            draw();
        }
        else{
            if (currentUuid == drawData.uuid){
                allTokens[drawData.idx].gridLocation.x = drawData.x;
                allTokens[drawData.idx].gridLocation.y = drawData.y;
                draw();
            }
        }
    };

    connection.start().then(function () {
        console.log("Hub is started.");
    }).catch(function (err) {
        return console.error(err.toString());
    });

    initBoard();
}

function initBoard() {
    lineInterval = Math.floor(ctx.canvas.width / LINES);
    console.log(lineInterval);
    initTokens();
}

function uuidv4() {
    // got this from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    return (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(
        /[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    ));
}

function genUuid(){
    if (document.querySelector("#uuid").value != ""){
        currentUuid = document.querySelector("#uuid").value;
        return;
    }
    currentUuid = uuidv4();
    document.querySelector("#uuid").value = currentUuid;
}

function initTokens() {

    if (allTokens.length == 0) {
        allTokens = [];

        var currentToken = null;
        // add 3 pawns
        var tokenColors = ["red","blue","green"];
        for (var i = 0; i < 3; i++) {
            currentToken = new token({
                size: lineInterval,
                imgSourceX: i * 128,
                imgSourceY: 0 * 128,
                imgSourceSize: 128,
                imgIdTag: 'allPawns',
                gridLocation: new gridlocation({ x: i * lineInterval, y: 3 * lineInterval }),
                color: tokenColors[i]
            });
            allTokens.push(currentToken);
        }
        console.log(allTokens);
    }
    draw();
}

function draw() {

    ctx.globalAlpha = 1;

    // fill the canvas background with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.height, ctx.canvas.width);

    // draw the blue grid background
    for (var lineCount = 0; lineCount < LINES; lineCount++) {
        ctx.fillStyle = "blue";
        ctx.fillRect(0, lineInterval * (lineCount + 1), ctx.canvas.width, 2);
        ctx.fillRect(lineInterval * (lineCount + 1), 0, 2, ctx.canvas.width);
    }
    drawAllSquares();
    // draw each token it its current location
    for (var tokenCount = 0; tokenCount < allTokens.length; tokenCount++) {

        drawClippedAsset(
            allTokens[tokenCount].imgSourceX,
            allTokens[tokenCount].imgSourceY,
            allTokens[tokenCount].imgSourceSize,
            allTokens[tokenCount].imgSourceSize,
            allTokens[tokenCount].gridLocation.x,
            allTokens[tokenCount].gridLocation.y,
            allTokens[tokenCount].size,
            allTokens[tokenCount].size,
            allTokens[tokenCount].imgIdTag
        );
    }
    
    // if the mouse is hovering over the location of a token, show yellow highlight
    if (hoverToken !== null) {
        ctx.fillStyle = "yellow";
        ctx.globalAlpha = .5
        ctx.fillRect(hoverToken.gridLocation.x, hoverToken.gridLocation.y, hoverToken.size, hoverToken.size);
        ctx.globalAlpha = 1;

        drawClippedAsset(
            hoverToken.imgSourceX,
            hoverToken.imgSourceY,
            hoverToken.imgSourceSize,
            hoverToken.imgSourceSize,
            hoverToken.gridLocation.x,
            hoverToken.gridLocation.y,
            hoverToken.size,
            hoverToken.size,
            hoverToken.imgIdTag
        );
    }
    
}

function drawAllSquares(){

    allSquares.forEach( item => {
        console.log(`${item.color}`);
        roundRect(ctx,item.x,item.y,item.width,item.height,item.radius,item.color,"black");
    });

}

function drawClippedAsset(sx, sy, swidth, sheight, x, y, w, h, imageId) {
    var img = document.getElementById(imageId);
    if (img != null) {
        ctx.drawImage(img, sx, sy, swidth, sheight, x, y, w, h);
    }
    else {
        console.log("couldn't get element");
    }
}

function handleMouseMove(e) {
    if (mouseIsCaptured) {
        if (hoverItem.isMoving) {
            var tempx = e.clientX - hoverItem.offSetX;
            var tempy = e.clientY - hoverItem.offSetY;
            hoverItem.gridLocation.x = tempx;
            hoverItem.gridLocation.y = tempy;
            if (tempx < 0) {
                hoverItem.gridLocation.x = 0;
            }
            if (tempx + lineInterval > GRID_SIZE) {
                hoverItem.gridLocation.x = GRID_SIZE - lineInterval;
            }
            if (tempy < 0) {
                hoverItem.gridLocation.y = 0;
            }
            if (lineInterval + tempy > GRID_SIZE) {
                hoverItem.gridLocation.y = GRID_SIZE - lineInterval;
            }

            allTokens[hoverItem.idx] = hoverItem;

            if (currentUuid == ""){
                connection.invoke("SendData", hoverItem.gridLocation.x, hoverItem.gridLocation.y, hoverItem.idx, "")
                    .catch(function (error){
                        return console.error(error.toString());
                });
            }
            else{
                connection.invoke("SendData", hoverItem.gridLocation.x, hoverItem.gridLocation.y, hoverItem.idx, currentUuid)
                    .catch(function (error){
                        return console.error(error.toString());
                });
            }

        }
        draw();
    }
    // otherwise user is just moving mouse / highlight tokens
    else {
        hoverToken = hitTestHoverItem({ x: e.clientX, y: e.clientY }, allTokens);
        draw();
    }
}

function mouseDownHandler(event) {

    var currentPoint = getMousePos(event);
    
    for (var tokenCount = allTokens.length - 1; tokenCount >= 0; tokenCount--) {
        if (hitTest(currentPoint, allTokens[tokenCount])) {
            currentToken = allTokens[tokenCount];
            // the offset value is the diff. between the place inside the token
            // where the user clicked and the token's xy origin.
            currentToken.offSetX = currentPoint.x - currentToken.gridLocation.x;
            currentToken.offSetY = currentPoint.y - currentToken.gridLocation.y;
            currentToken.isMoving = true;
            currentToken.idx = tokenCount;
            hoverItem = currentToken;
            console.log("b.x : " + currentToken.gridLocation.x + "  b.y : " + currentToken.gridLocation.y);
            mouseIsCaptured = true;
            window.addEventListener("mouseup", mouseUpHandler);
            break;
        }
    }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
      ctx.fillStyle = fill;
    }

    if (stroke) {
      ctx.stroke();
    }
  
  }

function mouseUpHandler() {
    mouseIsCaptured = false;
    for (var j = 0; j < allTokens.length; j++) {
        allTokens[j].isMoving = false;
    }
    allSquares.push({x:currentToken.gridLocation.x,y:currentToken.gridLocation.y,height:LINES*2,width:LINES*2,radius:5,color:currentToken.color})
}

function hitTest(mouseLocation, hitTestObject) {
    var testObjXmax = hitTestObject.gridLocation.x + hitTestObject.size;
    var testObjYmax = hitTestObject.gridLocation.y + hitTestObject.size;
    if (((mouseLocation.x >= hitTestObject.gridLocation.x) && (mouseLocation.x <= testObjXmax)) &&
        ((mouseLocation.y >= hitTestObject.gridLocation.y) && (mouseLocation.y <= testObjYmax))) {
        return true;
    }
    return false;
}

function hitTestHoverItem(mouseLocation, hitTestObjArray) {
    for (var k = 0; k < hitTestObjArray.length; k++) {
        var testObjXmax = hitTestObjArray[k].gridLocation.x + hitTestObjArray[k].size;
        var testObjYmax = hitTestObjArray[k].gridLocation.y + hitTestObjArray[k].size;
        if (((mouseLocation.x >= hitTestObjArray[k].gridLocation.x) && (mouseLocation.x <= testObjXmax)) &&
            ((mouseLocation.y >= hitTestObjArray[k].gridLocation.y) && (mouseLocation.y <= testObjYmax))) {
            return hitTestObjArray[k];
        }

    }
    return null;
}

function getMousePos(evt) {

    var rect = theCanvas.getBoundingClientRect();
    var currentPoint = new point();
    currentPoint.x = evt.clientX - rect.left;
    currentPoint.y = evt.clientY - rect.top;
    return currentPoint;
}

var point = function (x, y) {
    this.x = x;
    this.y = y;
};