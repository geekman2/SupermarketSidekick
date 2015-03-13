


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

