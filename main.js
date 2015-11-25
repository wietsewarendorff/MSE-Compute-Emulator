var socket = io();

var COMMANDS = ["addplayer [player]", "go", "setplayer [playerID]", "reloadlog", "buy [propertyID] [shares]", "startgame", "updateplayers", "tradeshares [PlayerID] [propertyID] [number]", "pay [amount]", "add [amount]"];

var playerColours = ["lightblue", "lightpink", "lightgreen", "orange", "yellow", "mediumpurple", "saddlebrown", "olive"];

var playerID = -1;
var playerName;
var playerNames = [];
var pageNumber = 1;
var gamestarted = false;

$('#commandform').submit(function () {
    socket.emit('command', playerID + " " + $('#commandbox').val());
    $('#commandbox').val('');
    $('#alertbox').hide();
    return false;
});

socket.emit('command', "-1 updateplayers");
socket.emit('command', '-1 reloadlog');

setTimeout(updateCommandBox,1000);

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

function sendCommand(command) {
    socket.emit('command', playerID + ' ' + command);
}

$("#startgamebutton").click(function () {
    sendCommand('startgame');
    reloadCommandSections();
});

$("#canceladdplayerbutton").click(function () {
    updateCommandBox();
});


$(".loadmaincommandsbutton").click(function () {
    reloadCommandSections();
});

$("#addplayerbutton").click(function () {
    addPlayerView();
});

$("#setplayerbutton").click(function () {
    $('#setplayerbuttonblock').show();
});

$("#buypropertybutton").click(function () {
    hideAllCommandSections();
    $('#buypropertybuttonblock').show();
});

$("#payrentbutton").click(function () {
    hideAllCommandSections();
    $('#payrentbuttonblock').show();
});

$("#addmoneybutton").click(function () {
    hideAllCommandSections();
    $('#moneyaddbuttonblock').show();
});

$("#removemoneybutton").click(function () {
    hideAllCommandSections();
    $('#moneyremovebuttonblock').show();
});

$("#buysharesbutton").click(function () {
    hideAllCommandSections();
    $('#sharesaddbuttonblock').show();
});

$("#sellsharesbutton").click(function () {
    hideAllCommandSections();
    $('#sharesremovebuttonblock').show();
});

$("#sellhousesbutton").click(function () {
    hideAllCommandSections();
    $('#housesremovebuttonblock').show();
});

$("#buyhousesbutton").click(function () {
    hideAllCommandSections();
    $('#housesaddbuttonblock').show();
});

$("#trademoneybutton").click(function () {
    hideAllCommandSections();
    $('#trademoneybuttonblock').show();
});

$("#tradesharesbutton").click(function () {
    hideAllCommandSections();
    $('#tradesharesbuttonblock').show();
});


$("#gobutton").click(function () {
    sendCommand('go');
});

$("#payrentsubmit").click(function () {
    if ($('#payrentinput').val() != '' && isInt($('#payrentinput').val())) {
        sendCommand('rent ' + $('#payrentinput').val());
        $('#payrentinput').val('');
        reloadCommandSections();
    }
});

$("#buypropertysubmit").click(function () {
    if ($('#buypropertyinput').val() != '' && isInt($('#buypropertyinput').val())) {
        sendCommand('buy ' + $('#buypropertyinput').val());
        $('#buypropertyinput').val('');
        reloadCommandSections();
    }
});

$("#moneyaddsubmit").click(function () {
    if ($('#moneyaddinput').val() != '' && isInt($('#moneyaddinput').val())) {
        sendCommand('add ' + $('#moneyaddinput').val());
        $('#moneyaddinput').val('');
        reloadCommandSections();
    }
});

$("#setplayersubmit").click(function () {
    if (isInt($('#setplayerinput').val())) {
        sendCommand('setplayer ' + $('#setplayerinput').val());
        $('#setplayerinput').val('');
        reloadCommandSections();
    }
});

$("#moneyremovesubmit").click(function () {
    if ($('#moneyremoveinput').val() != '' && isInt($('#moneyremoveinput').val())) {
        sendCommand('pay ' + $('#moneyremoveinput').val());
        $('#moneyremoveinput').val('');
        reloadCommandSections();
    }
});

$("#trademoneysubmit").click(function () {
    if (isInt($('#trademoneyamountinput').val()) && isInt($('#trademoneytoinput').val())) {
        sendCommand('pay ' + $('#trademoneytoinput').val() + ' ' + $('#trademoneyamountinput').val());
        $('#trademoneyamountinput').val('');
        $('#trademoneytoinput').val('');
        reloadCommandSections();
    }
});

$("#tradesharessubmit").click(function () {
    if (isInt($('#tradesharesamountinput').val()) && isInt($('#tradesharestoinput').val())) {
        sendCommand('tradeshares ' + $('#tradesharestoinput').val() + ' ' + $('#tradesharespropertyinput').val() + ' ' + $('#tradesharesamountinput').val());
        $('#tradesharesamountinput').val('');
        $('#tradesharestoinput').val('');
        $('#tradesharespropertyinput').val('');
        reloadCommandSections();
    }
});


$("#sharesremovesubmit").click(function () {
    if ($('#sharesremovepropertyinput').val() != '' && isInt($('#sharesremovepropertyinput').val()) && $('#sharesremovenumberinput').val() != '' && isInt($('#sharesremovenumberinput').val())) {
        sendCommand('sell ' + $('#sharesremovepropertyinput').val() + ' ' + $('#sharesremovenumberinput').val());
        $('#sharesremovepropertyinput').val('');
        $('#sharesremovenumberinput').val('');
        reloadCommandSections();
    }
});

$("#sharesaddsubmit").click(function () {
    if ($('#sharesaddpropertyinput').val() != '' && isInt($('#sharesaddpropertyinput').val()) && $('#sharesaddnumberinput').val() != '' && isInt($('#sharesaddnumberinput').val())) {
        sendCommand('buy ' + $('#sharesaddpropertyinput').val() + ' ' + $('#sharesaddnumberinput').val());
        $('#sharesaddpropertyinput').val('');
        $('#sharesaddnumberinput').val('');
        reloadCommandSections();
    }
});

$("#housesaddsubmit").click(function () {
    if ($('#housesaddpropertyinput').val() != '' && isInt($('#housesaddpropertyinput').val()) && $('#housesaddnumberinput').val() != '' && isInt($('#housesaddnumberinput').val())) {
        sendCommand('buyhouses ' + $('#housesaddpropertyinput').val() + ' ' + $('#housesaddnumberinput').val());
        $('#housesaddpropertyinput').val('');
        $('#housesaddnumberinput').val('');
        reloadCommandSections();
    }
});

$("#housesremovesubmit").click(function () {
    if ($('#housesremovepropertyinput').val() != '' && isInt($('#housesremovepropertyinput').val()) && $('#housesremovenumberinput').val() != '' && isInt($('#housesremovenumberinput').val())) {
        sendCommand('sellhouses ' + $('#housesremovepropertyinput').val() + ' ' + $('#housesremovenumberinput').val());
        $('#housesremovepropertyinput').val('');
        $('#housesremovenumberinput').val('');
        reloadCommandSections();
    }
});

$("#addplayersubmit").click(function () {
    if ($('#playernameinput').val() != '') {
        sendCommand('addplayer ' + $('#playernameinput').val());
        $('#playernameinput').val('');
    }
});

function addPlayerView() {
    hideAllCommandSections();
    $("#addplayerbuttonblock").show();
}

function updateCommandBox() {
    if (gamestarted == false) {
        hideAllCommandSections();
        $("#beginblock").show();
        //$("#setplayerbutton").show();
        if (playerNames.length == 0 && playerName == null) {
            $("#startgamebutton").hide();
        } else {
            $("#startgamebutton").show();
        }
    } else {
        hideAllCommandSections();
        if (playerName != null) {
            showAllCommandSections();
        } else {
            $("#setplayerbutton").show();
        }
    }
}

function reloadCommandSections() {
    hideAllCommandSections();
    showAllCommandSections();
}

function showAllCommandSections() {
    $("#mainblock").show();
    $("#sharesblock").show();
    $("#housesblock").show();
    $("#tradeblock").show();
    $("#moneyblock").show();
}

function hideAllCommandSections() {
    $("#beginblock").hide();
    $("#mainblock").hide();
    $("#sharesblock").hide();
    $("#housesblock").hide();
    $("#tradeblock").hide();
    $("#moneyblock").hide();
    $("#setplayerbutton").hide();
    $('#addplayerbuttonblock').hide();
    $('#buypropertybuttonblock').hide();
    $('#payrentbuttonblock').hide();
    $('#moneyaddbuttonblock').hide();
    $('#moneyremovebuttonblock').hide();
    $('#sharesaddbuttonblock').hide();
    $('#sharesremovebuttonblock').hide();
    $('#housesaddbuttonblock').hide();
    $('#housesremovebuttonblock').hide();
    $('#trademoneybuttonblock').hide();
    $('#tradesharesbuttonblock').hide();
    $('#setplayerbuttonblock').hide();
}


function updateGameInfo(msg) {
    gamestarted = true;
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
        if (msg[i].goingup == true) {
            line = line + '<span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span>';
        } else if (msg[i].goingup == false) {
            line = line + '<span class="glyphicon glyphicon-arrow-down" aria-hidden="true" ></span>';
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
        //console.log(line);
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
        $(players).append("<tr style='background-color:" + playerColours[i] + "'><td>" + (i + 1) + "</td><td>" + toTitleCase(msg.players[i]) + "</td><td>$" + msg.moneys[i] + "</td></tr>");
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
    $('#setplayerbutton').hide();
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
    updateCommandBox();
}

function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}