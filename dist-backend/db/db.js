"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = connectToDB;
exports.closeDB = closeDB;
const sqlite_1 = require("./sqlite");
function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, sqlite_1.connectToSQLite)();
            console.log('Connected to SQLite');
        }
        catch (err) {
            console.log('Error connecting to SQLite: ', err);
            throw err;
        }
    });
}
function closeDB() {
    (0, sqlite_1.closeSQLite)();
}
