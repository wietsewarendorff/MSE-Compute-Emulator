var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var STARTING_MONEY = 1500;
var BASE_GO_MONEY = 200;
var TICKS_PER_SECOND = 1;
var SELL_FEE_FIXED = 5;
var SELL_FEE_VAR = 0.1;

var propertyNames = ["Gillette", "Unilever", "KLM", "Swissair", "British Airways", "United Colors of Benetton", "Swatch", "Marks & Spencer", "T.G.I Friday's", "Pizza Hut", "Burger King", "MG Rover Group", "Peugeot", "Daimler Chrysler", "Electrolux", "Mitsubishi Electric", "Toshiba", "Alcatel", "Siemens", "Nokia", "Telefonica", "BT"];

var propertyRents = [[2, 10, 30, 90, 160, 250], [4, 20, 60, 180, 320, 450], [6, 30, 90, 270, 400, 550], [6, 30, 90, 270, 400, 550], [8, 40, 100, 300, 450, 600], [10, 50, 150, 450, 625, 750], [10, 50, 150, 450, 625, 750], [12, 60, 180, 500, 700, 900], [14, 70, 200, 550, 750, 950], [14, 70, 200, 550, 750, 950], [16, 80, 220, 600, 800, 1000], [18, 90, 250, 700, 875, 1050], [18, 90, 250, 700, 875, 1050], [20, 100, 300, 750, 925, 1100], [22, 110, 330, 800, 975, 1150], [22, 110, 330, 800, 975, 1150], [22, 120, 360, 850, 1025, 1200], [26, 130, 390, 900, 1100, 1275], [26, 130, 390, 900, 1100, 1275], [28, 150, 450, 1000, 1200, 1400], [35, 175, 500, 1100, 1300, 1500], [50, 200, 600, 1400, 1700, 2000]];

var housePrices = [50, 50, 50, 50, 50, 100, 100, 100, 100, 100, 100, 150, 150, 150, 150, 150, 150, 200, 200, 200, 200, 200];

var propertyColors = ["Brown", "Brown", "Dodgerblue", "Dodgerblue", "Dodgerblue", "Magenta", "Magenta", "Magenta", "Orange", "Orange", "Orange", "Red", "Red", "Red", "Yellow", "Yellow", "Yellow", "Green", "Green", "Green", "Darkblue", "Darkblue"];

var propertyValues = [60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 260, 280, 300, 300, 320, 350, 400];

var gameRunning = false;
var shares = [];
var players = [];
var moneys = [];
var goMoneys = [];
var properties = [];
var logs = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/main.js', function (req, res) {
    res.sendFile(__dirname + '/main.js');
});

app.get('/main.css', function (req, res) {
    res.sendFile(__dirname + '/main.css');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

io.on('connection', function (socket) {
    socket.on('command', function (msg) {
        parseCommand(msg, socket);
    });
});

function parseCommand(msg, recsocket) {
    msg = msg.toLowerCase();
    parameters = msg.split(" ");
    playersource = parameters.shift();
    console.log("request Received from " + playersource);
    if (parameters[0] == "go") {
        passGo(playersource);
    } else if (parameters[0] == "addplayer") {
        id = addPlayer(parameters[1]);
        recsocket.emit('set player', {
            id: id,
            name: parameters[1]
        });
    } else if (parameters[0] == "setplayer") {
        recsocket.emit('set player', {
            id: parameters[1] - 1,
            name: players[parameters[1] - 1]
        });
    } else if (parameters[0] == "updateplayers") {
        sendUpdatePlayers();
    } else if (parameters[0] == "sharesowned") {
        log(toTitleCase(players[playersource]) + " owns " + getSharesOwned(parseInt(playersource)) + " shares");
    } else if (parameters[0] == "add") {
        if (parameters.length == 2 && isInt(parameters[1])) {
            addMoney(playersource, parseInt(parameters[1]));
            log("Player " + toTitleCase(players[playersource]) + " added $" + parameters[1] + " to their account");
        }
    } else if (parameters[0] == "pay") {
        if (parameters.length == 2 && isInt(parameters[1])) {
            addMoney(playersource, parseInt(parameters[1]) * -1);
            log("Player " + toTitleCase(players[playersource]) + " removed $" + parameters[1] + " from their account");
        } else if (parameters.length == 3 && isInt(parameters[1]) && isInt(parameters[2])) {
            addMoney(playersource, parseInt(parameters[2]) * -1);
            addMoney(parameters[1]-1, parseInt(parameters[2]));
            log("Player " + toTitleCase(players[playersource]) + " paid $" + parameters[2] + " to " + toTitleCase(players[parameters[1]-1]));
        }
    } else if (parameters[0] == "tradeshares") {
        if (parameters.length == 4) {
            console.log('asdaasdadsasd');
            tradeShares(parseInt(playersource), parseInt(parameters[1]) - 1, parseInt(parameters[2]) - 1, parseInt(parameters[3]));
        }
    } else if (parameters[0] == "reloadlog") {
        sendBulkLog(recsocket);
    } else if (parameters[0] == "getrent") {
        if (parameters.length == 2) {
            getRent(playersource, parseInt(parameters[1]) - 1);
        }
    } else if (parameters[0] == "rent") {
        if (parameters.length == 2 && properties[parseInt(parameters[1]) - 1].owner != null) {
            payRent(playersource, parseInt(parameters[1]) - 1);
        }
    } else if (parameters[0] == "buy") {
        if (parameters.length == 2 && parameters[1] < 23) {
            console.info("fullbuy selected");
            buyPropertyFull(playersource, parameters[1] - 1);
        } else if (parameters.length == 3 && parameters[1] < 23) {
            console.info(playersource, parameters[1] - 1, parameters[2]);
            console.info("sharebuy selected");
            buyPropertyShares(playersource, parameters[1] - 1, parameters[2]);
        }
    } else if (parameters[0] == "buyhouses") {
        if (parameters.length == 3 && parameters[1] < 23 && parameters[2] > 0) {
            console.info(playersource, parameters[1] - 1, parameters[2]);
            buyPropertyHouses(playersource, parameters[1] - 1, parseInt(parameters[2]));
        }
    } else if (parameters[0] == "sellhouses") {
        if (parameters.length == 3 && parameters[1] < 23 && parameters[2] > 0) {
            console.info(playersource, parameters[1] - 1, parameters[2]);
            sellPropertyHouses(playersource, parameters[1] - 1, parseInt(parameters[2]));
        }
    } else if (parameters[0] == "sell") {
        if (parameters.length == 3 && parameters[1] < 23) {
            console.info(playersource, parameters[1] - 1, parameters[2]);
            console.info("sharesell selected");
            sellPropertyShares(playersource, parameters[1] - 1, parameters[2]);
        }
    } else if (parameters[0] == "startgame") {
        startGame();
    } else {
        console.log("--Command Not Recognised");
        recsocket.emit('invalid command', 'Command Not Recognised');
    }
}

function passGo(playerID) {
    log(toTitleCase(players[playerID]) + " passed GO for $" + goMoneys[playerID]);
    addMoney(playerID, goMoneys[playerID]);
    goMoneys[playerID] = BASE_GO_MONEY;
    sendUpdatePlayers();
}

function addMoney(playerID, amount) {
    moneys[playerID] += amount;
    sendUpdatePlayers();
}

function addGoMoney(playerID, amount) {
    goMoneys[playerID] += amount;
}

function sendUpdatePlayers() {
    io.emit('player update', {
        players: players,
        moneys: moneys
    });
}

function log(string) {
    console.log(string);
    io.emit('log item', string);
    logs.push(string);
}

function sendBulkLog(socket) {
    for (var i = 0; i < logs.length; i++) {
        socket.emit('log item', logs[i]);
    }
}

function addPlayer(player) {
    players.push(player);
    id = moneys.length;

    moneys.push(STARTING_MONEY);
    goMoneys.push(BASE_GO_MONEY);

    log(toTitleCase(player) + " added with $" + STARTING_MONEY);
    io.emit('player update', {
        players: players,
        moneys: moneys
    });
    return id;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

//Properties = {Card Number ,Name ,Value ,Shares ,Houses ,Hotels ,isSet ,Owner ,Color}
function initProperties() {
    for (var i = 0; i < 22; i++) {
        properties[i] = {
            cardnumber: i + 1,
            name: propertyNames[i],
            value: propertyValues[i],
            shares: 9,
            houses: 0,
            isSet: false,
            owner: null,
            color: propertyColors[i],
            rent: propertyRents[i],
            houseprice: housePrices[i],
            goingup: null
        };
    }
}

function getRent(playerID, propertyID) {
    var rent = properties[propertyID].rent[properties[propertyID].houses];
    console.log(rent);
}

function payRent(playerID, propertyID) {
    console.log("playerID=" + playerID);
    console.log("propertyID=" + propertyID);
    var rent;
    if (properties[propertyID].isSet == true && properties[propertyID].houses == 0) {
        rent = properties[propertyID].rent[0] * 2;
    } else {
        rent = properties[propertyID].rent[properties[propertyID].houses];
    }
    var ownership = (shares[playerID][propertyID] / (9 - properties[propertyID].shares));
    var rentDiscount = rent * ownership;
    rent = rent - rentDiscount;
    rent = Math.round(rent);
    addMoney(playerID, rent * -1);
    distributeRent(playerID, propertyID, rent);
    log(toTitleCase(players[playerID] + " paid $" + rent + " rent on " + properties[propertyID].name));
}

function distributeRent(fromPlayerID, propertyID, amount) {
    var totalShares = 9 - properties[propertyID].shares - shares[fromPlayerID][propertyID];
    for (var i = 0; i < players.length; i++) {
        console.log("--------");
        console.log(fromPlayerID);
        console.log(id);
        console.log(shares[i][propertyID]);
        if (i != fromPlayerID && shares[i][propertyID] > 0) {
            addGoMoney(i, Math.round(amount * (shares[i][propertyID] / totalShares)));
        }
    }
}

//shares [playerid[properties],[]]
function initShares() {
    for (var i = 0; i < players.length; i++) {
        shares[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
}

function startGame() {
    if (!gameRunning) {
        initProperties();
        initShares();
        gameRunning = true;
        log("~~Game Started!~~");
    }
}

function updatePropertyOwnership(propertyID) {
    var player = null;
    var prevmax = 0;

    if (properties[propertyID].owner != null) {
        player = properties[propertyID].owner;
        prevmax = shares[player][propertyID];
    }

    for (var i = 0; i < players.length; i++) {
        if (shares[i][propertyID] > prevmax) {
            player = i;
            prevmax = shares[i][propertyID];
        }
    }
    if (prevmax != 0) {
        properties[propertyID].owner = player;
    } else {
        properties[propertyID].owner = null;
    }
}

function updatePropertyRemainingShares(propertyID) {
    currshares = 0;
    for (var i = 0; i < players.length; i++) {
        currshares += shares[i][propertyID];
    }
    remainingshares = 9 - currshares;
    properties[propertyID].shares = remainingshares;
}

function updateProperty(propertyID) {
    updatePropertyOwnership(propertyID);
    updatePropertyRemainingShares(propertyID);
    isSet(propertyID);
}

function tradeShares(fromID, toID, propertyID, num) {
    console.log('asdasd');
    if (shares[fromID][propertyID] >= num && fromID < players.length && toID < players.length && num > 0) {
        shares[fromID][propertyID] -= num;
        shares[toID][propertyID] += num;
        log(toTitleCase(players[fromID]) + " traded " + num + " shares in " + properties[propertyID].name + " to " + toTitleCase(players[toID]));
        updateProperty(propertyID);
    }
}

function buyPropertyFull(playerID, propertyID) {
    if (properties[propertyID].owner == null) {
        shares[playerID][propertyID] = 5;
        addMoney(playerID, properties[propertyID].value * -1);
        console.info("PROPERTY BOUGHT");
        log(toTitleCase(players[playerID]) + " Bought " + properties[propertyID].name + " for $" + properties[propertyID].value);
        updateProperty(propertyID);
    }
}

function buyPropertyHouses(playerID, propertyID, n) {
    if (properties[propertyID].houses <= (5 - n)) {
        properties[propertyID].houses += n;
        addMoney(playerID, (properties[propertyID].houseprice * n) * -1);
        log(toTitleCase(players[playerID]) + " Bought " + n + " houses on " + properties[propertyID].name + " for $" + (properties[propertyID].houseprice * n));
    }
}

function sellPropertyHouses(playerID, propertyID, n) {
    if (properties[propertyID].houses >= n) {
        properties[propertyID].houses -= n;
        addMoney(playerID, (properties[propertyID].houseprice * n) * 0.5);
        log(toTitleCase(players[playerID]) + " sold " + n + " houses on " + properties[propertyID].name + " for $" + (properties[propertyID].houseprice * n) * 0.5);
    }
}

function isSet(propertyID) {
    var player = properties[propertyID].owner;
    /*if (player==null){
        updatePropertySet([propertyID],false);
        return false;   
    }*/
    var toCheck = [];
    var correct = true;
    var checking = [[0, 1], [2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 12, 13], [14, 15, 16], [17, 18, 19], [20, 21]];

    if (player == null) {
        correct = false;
    }

    for (var i = 0; i < 8; i++) {
        if (checking[i].indexOf(propertyID) > -1) {
            toCheck = checking[i];
        }
    }
    for (var i = 0; i < toCheck.length; i++) {
        console.log("PropertyID " + toCheck[i] + " is owned by " + properties[toCheck[i]].owner);
        if (properties[toCheck[i]].owner != player) {
            correct = false;
        }
    }
    if (correct == true) {
        console.info(propertyID + ' is part of a set');
        updatePropertySet(toCheck, true);
        return true;
    } else {
        console.info(propertyID + ' is not part of a set');
        updatePropertySet(toCheck, false);
        return false;
    }
}

function updatePropertySet(set, setting) {
    for (var i = 0; i < set.length; i++) {
        properties[set[i]].isSet = setting;
    }
}

function sellPropertyShares(playerID, propertyID, n) {
    console.log(n);
    if (shares[playerID][propertyID] >= n) {
        totalcost = 0;
        for (var i = 0; i < n; i++) {
            var x = sellPropertyShare(playerID, propertyID);
            totalcost = totalcost + x;
            console.log("sell --=" + x);
            calculatePropertyValues();
        }
        log(toTitleCase(players[playerID]) + " Sold " + n + " shares in " + properties[propertyID].name + " for $" + totalcost);
        updateProperty(propertyID);
    }
}

function buyPropertyShares(playerID, propertyID, n) {
    console.log(n);
    if (properties[propertyID].shares >= n && properties[propertyID].owner != null) {
        totalcost = 0;
        for (var i = 0; i < n; i++) {
            var x = buyPropertyShare(playerID, propertyID);
            totalcost = totalcost + x;
            console.log("buy --=" + x);
            calculatePropertyValues();
        }
        log(toTitleCase(players[playerID]) + " Bought " + n + " shares in " + properties[propertyID].name + " for $" + totalcost);
        updateProperty(propertyID);
    }
}

function sellPropertyShare(playerID, propertyID) {
    shares[playerID][propertyID] -= 1;
    calculatePropertyValues();
    cost = properties[propertyID].value;
    console.log("$$" + cost);
    cost = Math.round(cost - (cost * SELL_FEE_VAR + SELL_FEE_FIXED));
    addMoney(playerID, cost * 1);
    updateProperty(propertyID);
    calculatePropertyValues();
    console.log("$$$" + cost);
    return cost;
}

function buyPropertyShare(playerID, propertyID) {
    shares[playerID][propertyID] += 1;
    calculatePropertyValues();
    cost = properties[propertyID].value;
    addMoney(playerID, cost * -1);
    updateProperty(propertyID);
    calculatePropertyValues();
    console.log("$$" + cost);
    return cost;
}


function sendGameInfo() {
    gameinfo = [];
    for (var i = 0; i < 22; i++) {
        playershares = [];
        for (var j = 0; j < players.length; j++) {
            playershares.push(shares[j][i]);
        }
        gameinfo[i] = {
            cardnumber: properties[i].cardnumber,
            cardname: properties[i].name,
            value: properties[i].value,
            shares: properties[i].shares,
            playershares: playershares,
            color: properties[i].color,
            houses: properties[i].houses,
            isset: properties[i].isSet,
            ownerid: properties[i].owner,
            goingup: properties[i].goingup
        };
    }
    io.emit('game info', gameinfo);
}

function calculatePropertyValues() {
    for (var i = 0; i < properties.length; i++) {
        if (properties[i].shares < 9) {
            var insettonum;
            if (properties[i].isSet == true) {
                insettonum = 1;
            } else {
                insettonum = 0;
            }
            var previousvalue = properties[i].value;
            var value = ((Math.pow(1.5, (((9 - properties[i].shares) / 5) - 1)) * (propertyValues[i] / 5)) * (1 + insettonum + properties[i].houses));
            var beforemod = value;

            var randomseed = getRandomArbitrary(1, 100);
            if (properties[i].goingup == true) {
                if (randomseed < 75) {
                    value = value + (previousvalue - value + 1);
                } else {
                    value = value + (previousvalue - value - 1);
                }
            } else {
                if (randomseed < 75) {
                    value = value + (previousvalue - value - 1);
                } else {
                    value = value + (previousvalue - value + 1);
                }
            }

            if (value > beforemod * 1.05) {
                value = beforemod * 1.05
            } else if (value < beforemod * .95) {
                value = beforemod * .95
            }

            if (value > previousvalue) {
                properties[i].goingup = true;
            } else if (value < previousvalue) {
                properties[i].goingup = false;
            }


            //value = Math.round(value * getRandomArbitrary(0.95, 1.05));
            properties[i].value = Math.round(value);
        } else {
            properties[i].value = propertyValues[i];
        }
    }
}

function getSharesOwned(playerid) {
    var totalshares = 0;
    for (var i = 0; i < shares[playerid].length; i++) {
        totalshares += shares[playerid][i];
    }
    return totalshares;
}

function tick() {
    if (gameRunning) {
        //console.info("tick");
        calculatePropertyValues();
        sendGameInfo();
    }
}

function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

setInterval(tick, 1000 / TICKS_PER_SECOND);