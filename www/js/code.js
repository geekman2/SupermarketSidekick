function usernamefill() {
    var username = localStorage.getItem("username");
    var userbutton = document.getElementById("username");
    if (username == "none"){
        userbutton.innerHTML = "Login";
        userbutton.setAttribute('href','login.html');
        }
    else{
        userbutton.innerHTML = username;
        userbutton.setAttribute('href','profile.html');
    }
}
function profilefiller(){
    //TODO obtain values from "users" database
    //TODO allow the user to set location
    usernamefill();
    document.getElementById("ranknum").innerHTML = 1;
    document.getElementById("pointval").innerHTML = 1791;
    document.getElementById("compscore").innerHTML = "America";
}

function loginCallback(){
    alert("stub");
    }

function login(){
    var username = document.getElementById("usernamefield");
    username = username.value.toUpperCase().trim().replace(" ","_");
    if (username === ""){
    alert("please enter a valid username");
        }
    else{
        $.ajax({
            async:true,
            type:'GET',
            url:"http://54.183.22.36/users/app.user:"+username,
            success:function(response){
                    var jso = JSON.parse(response);
                    if (response.substring(2,5)== '_id'){
                        localStorage.setItem("username", username);
                        localStorage.setItem("rev",jso._rev);
                        window.location.replace("index.html");
                    }
                },
            error:function(){
                alert("Invalid Username");
                }
            })
        }

    }

function logout(){
    localStorage.setItem("username","none");
    window.location.replace("index.html");
}


function syncSidekick(url1){
    var username = localStorage.getItem('username');
    var points = localStorage.getItem('points');
    var rev = localStorage.getItem('rev');
    var putURL = 'http://54.183.22.36/users/app.user:'+username;

    $.ajax({
         async: true,
         type: 'GET',
         url: url1,
         success: function(response) {
              syncCallback(response);
            }
        }
    );

    $.ajax({
        async: true,
        type: 'PUT',
        url: putURL,
        contentType: "application/json",
        data:JSON.stringify({"_rev":rev,"name":username,"points":points}),
        success: function(response){
                var prs = JSON.parse(response);
                localStorage.setItem('rev',prs.rev);
                document.getElementById('syncButton').innerHTML = "Synced!";
            }
        }
    )
}

function syncCallback(response){

    //The sync function checks the location that the user has currently set and
    //then synchronises the local database with the cloud database that match that
    //location
    var store = "Store"; //TODO add location setting
    var dbname = store+"-DB";
    var db = window.sqlitePlugin.openDatabase({name: dbname, location: 1});
    dropDB(db);
    initializeDB(db);
    var docsj= JSON.parse(response);
    var len = docsj.rows.length;
    var list = new Array();
    for(var i = 0; i < len; i++) {
        var obj = docsj.rows[i];
        var item = obj.value.item;
        var aisle = obj.value.aisle;
        var itemString = JSON.stringify(item);
        var aisleString = JSON.stringify(aisle);
        var thing = {
        item:itemString,
        aisle:aisleString
        };
        list.push(thing);
        //console.log('dummy add');
        //TODO add local database support
        //TODO add item value pairs to local database
        //TODO sync user points
    }
    insertDB(db,list);
}



function search(){
    usernamefill();
    search = document.getElementById('searchfield').value;
    localStorage.setItem('search',search.trim());
    window.location.replace("results.html");
    console.log("redirecting");
    }

function additem(){
    //TODO allow users to PUT new items in
    }
function itemvalidate(){
    //TODO validate items to make sure they don't have illegal characters, etc
    }

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function displayResults(){
    var query = localStorage.getItem('search');
    var db = window.sqlitePlugin.openDatabase({name:"Store-DB", location: 1});
    queryDB(db,query);
    }

//DB Handler
//
//Block Start

// Query the success callback
//
function querySuccess(tx,results) {
    var i;
    var len = results.rows.length;
    document.body.removeChild(document.getElementById('placeholder'));
    //Iterate through the results
    if (len != 0){
        for (i = 0; i < len; i++) {
            //Get the current row
            var row = results.rows.item(i);
            var div = document.createElement("div");
            div.setAttribute('class','resultItem');
            var item = toTitleCase(row.item.trim());
            var aisle = row.aisle;
            div.innerHTML = item.substring(1,item.length-1)+"| Aisle:"+aisle.substring(1,aisle.length-1);

            document.body.appendChild(div);
        }
    }
    else{

        var div = document.createElement("div");
        div.setAttribute('class','resultItem');
        div.innerHTML = "Nothing was found";
        document.body.appendChild(div);
        }
}

// Transaction error callback
//
function errorCB(err) {
    console.log("Error processing SQL: "+err.message+' '+err.stack);
}

// Database initiate success callback
//
function initiateSuccessCB() {
    console.log("Database Initialized");
}

function dropDB(db){
    db.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS DB');
        console.log("Database Dropped \n Like it's hot");
        }
    );
}

function initializeDB(db){
    db.transaction(function(tx){

        tx.executeSql('CREATE TABLE IF NOT EXISTS DB (id INTEGER PRIMARY KEY AUTOINCREMENT , item TEXT, aisle TEXT)',[],initiateSuccessCB,errorCB);
        }
    );
}

// Transaction error callback
//
function errorCB(err) {
    console.log("Error processing SQL: "+err.message+' '+err.stack);
}

// Transaction success callback
//
function successCB() {
    console.log("Database Initialized");
}

function addSuccessCB() {
    console.log("Item Added");
}

function dropDB(db){
    db.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS DB');
        console.log("Dropped");
        }
    );
}

function initializeDB(db){
    db.transaction(function(tx){
        tx.executeSql('CREATE TABLE IF NOT EXISTS DB (id INTEGER PRIMARY KEY AUTOINCREMENT , item TEXT, aisle TEXT)',[],successCB,errorCB);
        }
    );
}

function insertDB(db,list){
    db.transaction(function(tx){
        console.log("Insert");
        var i;
        for (i = 0; i < list.length; i++) {
            var item = list[i].item;
            var aisle = list[i].aisle;
            tx.executeSql('INSERT INTO DB (item,aisle) VALUES (?,?)',[item,aisle],addSuccessCB,errorCB);
    }
    });
}

function queryDB(db,query){
    db.transaction(function(tx) {
            var queryList = query.split(" ");
            var sqlText = "SELECT * FROM DB WHERE item LIKE '%"+queryList[0]+"%'";
            for (i = 1; i < queryList.length; i++) {
                    sqlText += " OR item LIKE '%"+queryList[i]+"%'";
            }
            tx.executeSql(sqlText, [], querySuccess);
        }
        );
    }
