function usernamefill() {
    var username = localStorage.getItem("username");
    var userbutton = document.getElementById("username");
    console.log("Username:"+username);
    if (username == "none"||username==null) {
        userbutton.innerHTML = "Login";
        userbutton.setAttribute('href', 'login.html');
    }
    else {
        userbutton.innerHTML = username;
        userbutton.setAttribute('href', 'profile.html');
    }
}
function profilefiller() {
    //TODO allow the user to set location
    usernamefill();
    document.getElementById("ranknum").innerHTML = localStorage.getItem('rank');
    document.getElementById("pointval").innerHTML = localStorage.getItem('points');
    document.getElementById("compscore").innerHTML = parseInt(localStorage.getItem('compScore'))-parseInt(localStorage.getItem('points'));
}


function login() {
    var username = document.getElementById("usernamefield");
    username = username.value.toUpperCase().trim().replace(" ", "_");
    if (username === "") {
        alert("Please enter a username")
    }
    else {
        $.ajax({
            async: true,
            type: 'GET',
            url: "http://54.183.22.36/users/app.user:" + username,
            success: function (response) {
                var jso = JSON.parse(response);
                if (response.substring(2, 5) == '_id') {
                    localStorage.setItem("username", username);
                    localStorage.setItem("points",jso.points);
                    localStorage.setItem("rev", jso._rev);
                    window.location.assign("index.html");
                }
            },
            error: function () {
                document.querySelector("#confirm").style.visibility="visible";
            }
        })
    }

}

function createUser(){
    var username = document.getElementById("usernamefield");
    username = username.value.toUpperCase().trim().replace(" ", "_");
    $.ajax({
        async: true,
        type: 'PUT',
        url: "http://54.183.22.36/users/app.user:" + username,
        contentType: "application/json",
        data: JSON.stringify({"name":username,"points":"0"}),
        success: function () {
            console.log("User Created!");
            localStorage.setItem("username",username);
            window.location.assign("index.html");
        }
    });
    //TODO initiate ajax put user
    //TODO set locastorage value of username to username
}

function logout() {
    localStorage.setItem("username", "none");
    window.location.assign("index.html");
}


function syncSidekick(url1) {
    var username = localStorage.getItem('username');
    var points = localStorage.getItem('points');
    var rev = localStorage.getItem('rev');
    var putURL = 'http://54.183.22.36/users/app.user:' + username;

    $.ajax({
            async: true,
            type: 'GET',
            url: url1,
            error: function () {
                var syncButton = document.getElementById('syncButton');
                syncButton.innerHTML = "Network Error,Running in offline mode";
                syncButton.style.background = "red";
                localStorage.setItem('online','false');
            },
            success: function (response) {
                syncCallback(response);
            }
        }
    );

    $.ajax({
            async: true,
            type: 'PUT',
            url: putURL,
            contentType: "application/json",
            data: JSON.stringify({"_rev": rev, "name": username, "points": parseInt(points)}),
            success: function (response) {
                var prs = JSON.parse(response);
                localStorage.setItem('rev', prs.rev);

            }
        }
    )

    $.ajax({
            async:true,
            type:'GET',
            url:"http://54.183.22.36/users/_design/users/_view/UsersByPoints",
            data:{startkey:parseInt(points)},
            success:function(response){
                var res = JSON.parse(response);
                var len = res.rows.length;
                var compScore = res.rows[1].key;
                localStorage.setItem("rank",len);
                localStorage.setItem("compScore",compScore)
            }
        }
    )
}

function syncCallback(response) {

    //The sync function checks the location that the user has currently set and
    //then synchronises the local database with the cloud database that match that
    //location
    var store = "Store"; //TODO add location setting
    try {
        var dbname = store + "-DB";
        var db = window.sqlitePlugin.openDatabase({name: dbname, location: 1});
    }
    catch(err){
        alert(err);

        var syncButton = document.getElementById('syncButton');
        syncButton.innerHTML = "Sync Failed, Touch to Retry Manually";
        syncButton.style.background = "red";
    }
    dropDB(db);
    initializeDB(db);
    var docsj = JSON.parse(response);
    var len = docsj.rows.length;
    var list = [];
    for (var i = 0; i < len; i++) {
        var obj = docsj.rows[i];
        var item = obj.value.item;
        var aisle = obj.value.aisle;
        var itemString = JSON.stringify(item);
        var aisleString = JSON.stringify(aisle);
        var thing = {
            item: itemString,
            aisle: aisleString
        };
        list.push(thing);
        //TODO sync user points
    }
    insertDB(db, list);
}


function search() {
    usernamefill();
    search = document.getElementById('searchfield').value;
    localStorage.setItem('search', search.trim());
    window.location.assign("results.html");
    console.log("redirecting");
}

function addCallback(uuid,submitString){
    //var putURL = 'http://54.183.22.36/small/';
    var putURL = 'http://54.183.22.36/items_la-crescenta_vons/';
    var aisle = document.getElementById('aisle').value.toString().trim();
    var username = localStorage.getItem('username');

    $.ajax({
        async: true,
        type: 'PUT',
        url: putURL + uuid.toString(),
        contentType: "application/json",
        data: JSON.stringify({"aisle": aisle, "author": username, "item": itemvalidate(submitString),"timestamp":Date.now()}),
        success: function () {
            console.log("Success!");
            window.location.assign("index.html");
        }
    });
}

function addSidekickItem() {
    var username = localStorage.getItem('username');
    var space = ' ';
    var brand = document.getElementById('brand').value.toString().trim();
    var item = document.getElementById('item').value.toString().trim();
    var flavor = document.getElementById('flavor').value.toString().trim();
    var submitString = brand + space + item + space + flavor;

    $.ajax({
        async: true,
        type: 'GET',
        url: 'http://54.183.22.36/_uuids',
        success: function (response) {
            var jso = JSON.parse(response);
            var uuid = jso.uuids[0].toString();
            addCallback(uuid,submitString);
        }
    });
}
function itemvalidate(item) {
    var itemString = item.toString();
    itemString = itemString.trim().replace("\\\"","");
    itemString = toTitleCase(itemString);
    return itemString
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function displayResults() {
    var query = localStorage.getItem('search');
    var db = window.sqlitePlugin.openDatabase({name: "Store-DB", location: 1});
    queryDB(db, query);
}

//DB Handler
//
//Block Start

// Query the success callback
//
function querySuccess(tx, results) {
    var i;
    var len = results.rows.length;
    document.body.removeChild(document.getElementById('placeholder'));
    //Iterate through the results
    if (len != 0) {
        for (i = 0; i < len; i++) {
            //Get the current row
            var row = results.rows.item(i);
            var div = document.createElement("div");
            div.setAttribute('class', 'resultItem');
            var item = toTitleCase(row.item.trim());
            var aisle = row.aisle;
            div.innerHTML = item.substring(1, item.length - 1) + "| Aisle:" + aisle.substring(1, aisle.length - 1);

            document.body.appendChild(div);
        }
    }
    else {

        var div = document.createElement("div");
        div.setAttribute('class', 'resultItem');
        div.innerHTML = "Nothing was found";
        document.body.appendChild(div);
    }
}

// Transaction error callback
//
function errorCB(err) {
    console.log("Error processing SQL: " + err.message + ' ' + err.stack);
}

// Database initiate success callback
//
function initiateSuccessCB() {
    console.log("Database Initialized");
}


function addSuccessCB(num,len) {
    console.log("Item Added");
    if (num==len){
        var syncButton = document.getElementById('syncButton');
        syncButton.innerHTML = "Synced!";
        syncButton.style.background = "green";
    }
}

function dropDB(db) {
    db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS DB');
            console.log("Dropped");
        }
    );
}

function initializeDB(db) {
    db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS DB (id INTEGER PRIMARY KEY AUTOINCREMENT , item TEXT, aisle TEXT)', [], initiateSuccessCB(), errorCB);
        }
    );
}

function insertDB(db, list) {
    db.transaction(function (tx) {
        console.log("Insert");
        var i;
        for (i = 0; i < list.length; i++) {
            var item = list[i].item;
            var aisle = list[i].aisle;
            tx.executeSql('INSERT INTO DB (item,aisle) VALUES (?,?)', [item, aisle], function (){addSuccessCB(i,list.length)} , errorCB);
            }

    });

}

function queryDB(db, query) {
    db.transaction(function (tx) {
            var queryList = query.split(" ");
            var sqlText = "SELECT * FROM DB WHERE item LIKE '%" + queryList[0] + "%'";
            for (i = 1; i < queryList.length; i++) {
                sqlText += " OR item LIKE '%" + queryList[i] + "%'";
            }
            tx.executeSql(sqlText, [], querySuccess);
        }
    );
}
