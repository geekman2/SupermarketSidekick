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

function login(){
    var username = document.getElementById("usernamefield").value;
    if (username === ""){
    alert("please enter a valid username");
    }
    else{
        var response = httpGet("http://54.183.22.36/users/app.user:"+username.toUpperCase().trim().replace(" ","_"));
        if (response.substring(2,5)== '_id'){
            localStorage.setItem("username", username.toUpperCase().trim().replace(" ","_"));
            window.location.replace("index.html");
            alert("If you're seeing this, something is wrong"); //The redirect does not work without this line, I have no idea why
        }
        else{
        confirm('It looks like you are new here, did you want to register the new user "'+username.toUpperCase().replace(" ","_")+'"?');
        }
    }
}
function logout(){
    localStorage.setItem("username","none");
    window.location.replace("index.html");
}

function syncCallback(response){

    //The sync function checks the location that the user has currently set and
    //then synchronises the local database with the cloud database that match that
    //location
    var store = "la-crescenta-vons"; //TODO add location setting
    var dbname = store+"-DB";
    var db = window.sqlitePlugin.openDatabase({name: dbname, location: 1});
    dropDB(db);
    initializeDB(db);
    var docsj= JSON.parse(response);

    for(var i = 0; i < docsj.rows.length; i++) {
        var obj = docsj.rows[i];
        var item = obj.value.item;
        var aisle = obj.value.aisle;
        var itemString = JSON.stringify(item);
        var aisleString = JSON.stringify(aisle);
        insertDB(db,itemString,aisleString);
        //TODO add local database support
        //TODO add item value pairs to local database
        //TODO sync user points
    }
    queryDB(db);
}

function syncSidekick(url){
    $.ajax({
     async: false,
     type: 'GET',
     url: url,
     success: function(response) {
          syncCallback(response);
     }
});
}

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.send();
    var allText = rawFile.responseText;
    return allText;

}
// Query the success callback
//
function querySuccess(tx,results) {
    var i;
    //Iterate through the results
    for (i = 0; i < results.rows.length; i++) {
        //Get the current row
        var row = results.rows.item(i);
        console.log(row);
    }
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

function insertDB(db,itemString,aisleString){
    db.transaction(function(tx){
        tx.executeSql('INSERT INTO DB (item,aisle) VALUES (?,?)',[itemString,aisleString,],successCB,errorCB);
        console.log("Added");
    });
}

function queryDB(db){
    db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM DB", [], querySuccess);
        });
    }

function search(){
    //TODO search local database and return results
    }

function additem(){
    //TODO allow users to PUT new items in
    }
function itemvalidate(){
    //TODO validate items to make sure they don't have illegal characters, etc
    }