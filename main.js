var socket = io();

var COMMANDS = ["addplayer [player]", "go", "setplayer [playerID]", "reloadlog", "buy [propertyID] [shares]", "startgame", "updateplayers", "tradeshares [PlayerID] [propertyID] [number]", "pay [amount]", "add [amount]"];

var playerColours = ["lightblue", "lightpink", "lightgreen", "orange", "yellow", "mediumpurple", "saddlebrown", "olive"];

var playerID = -1;
var playerName;
var playerNames = [];
var pageNumber = 1;

$('form').submit(function () {
    socket.emit('command', playerID + " " + $('#commandbox').val());
    $('#commandbox').val('');
    $('#alertbox').hide();
    return false;
});

writeCommands();

socket.emit('command', "-1 updateplayers");

socket.on('log item', function (data) {
    addLogItem(data);
});

socket.on('player update', function (data) {
    updatePlayerData(data);
});

socket.on('set player', function (data) {
    setPlayer(data);
});

socket.on('invalid command', function (data) {
    invalidCommand(data);
});

socket.on('game info', function (data) {
    updateGameInfo(data);
});

function updateGameInfo(msg) {
    headings = "<tr><th>Property #</th><th>$</th><th>Shares Left</th>";
    for (var i = 0; i < msg[i].playershares.length; i++) {
        headings = headings + "<th>" + playerNames[i] + "</th>";
    }
    headings = headings + "</tr>";
    $('#gameinfotitle').html(headings);
    $('#gameinfolist').html("");
    if (pageNumber == 1) {
        start = 0;
        end = 11;
    } else if (pageNumber == 2) {
        start = 11;
        end = 22;
    }
    for (var i = start; i < end; i++) {
        var line;
        if (msg[i].isset == true) {
            //line = "<tr class='warning'>";
            line = "<tr style='background-color:" + playerColours[msg[i].ownerid] + ";'>";
        } else {
            line = "<tr>";
        }
        line = line + "<td><div class='colorbox' style='background-color:" + msg[i].color + "'></div>" + msg[i].cardnumber + " <div id='houses'>";

        //add Houses
        if (msg[i].houses == 5) {
            line = line + "<div class='colorbox' style='background-color:Red'></div>";
        } else {
            for (var x = 0; x < msg[i].houses; x++) {
                line = line + "<div class='colorbox' style='background-color:Green'></div>";
                console.log(x, msg[i].houses);
            }
        }

        line = line + "</div></td><td>";
        line = line + msg[i].value;
        if (msg[i].goingup==true){
            line=line+'<span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span>';   
        } else if (msg[i].goingup==false){
            line=line+'<span class="glyphicon glyphicon-arrow-down" aria-hidden="true" ></span>';
        }
        line = line + "</td><td>" + msg[i].shares + "</td>";
        for (j = 0; j < msg[i].playershares.length; j++) {
            line = line + "<td>";
            if (msg[i].ownerid == j) {
                line = line + '<span class="badge">';
            }
            line = line + msg[i].playershares[j];
            if (msg[i].ownerid == j) {
                line = line + '</span>';
            }
            line = line + "</td>";
        }
        line = line + "</tr>";
        console.log(line);
        $('#gameinfolist').append(line);
    }
}

function addLogItem(msg) {
    $('#gamelog').prepend("<tr><td>" + msg + "</td></tr>");
}

function updatePlayerData(msg) {
    $('#players').html("");
    playerNames = [];
    for (i = 0; i < msg.players.length; i++) {
        $(players).append("<tr style='background-color:"+ playerColours[i]+"'><td>" + (i + 1) + "</td><td>" + toTitleCase(msg.players[i]) + "</td><td>$" + msg.moneys[i] + "</td></tr>");
        playerNames.push(toTitleCase(msg.players[i]));
    }
}

function invalidCommand(msg) {
    $('#alerttext').text(msg);
    $('#alertbox').show();
}

function setPlayer(msg) {
    playerID = msg.id;
    playerName = msg.name;
    drawPlayerName();
}

function writeCommands() {
    $('#commands').html("");
    for (i = 0; i < COMMANDS.length; i++) {
        $('#commands').append("<tr><td><code>" + COMMANDS[i] + "</code></td></tr>");
    }
}

function setPage(i) {
    pageNumber = i;
    if (i == 1) {
        $('#page1button').attr("class", "btn btn-primary");
        $('#page2button').attr("class", "btn btn-default");
    } else if (i == 2) {
        $('#page2button').attr("class", "btn btn-primary");
        $('#page1button').attr("class", "btn btn-default");
    }
}

function drawPlayerName() {
    $('#playername').text(toTitleCase(playerName));
    $('#playernamelabel').attr("class", "label label-success pull-right");
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}