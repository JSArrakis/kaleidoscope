"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = connectToDB;
exports.closeDB = closeDB;
const sqlite_1 = require("./sqlite");
async function connectToDB() {
    try {
        await (0, sqlite_1.connectToSQLite)();
        console.log('Connected to SQLite');
    }
    catch (err) {
        console.log('Error connecting to SQLite: ', err);
        throw err;
    }
}
function closeDB() {
    (0, sqlite_1.closeSQLite)();
}
