import { connectToSQLite, closeSQLite } from "./sqlite.js";
export async function connectToDB() {
    try {
        await connectToSQLite();
        console.log("Connected to SQLite");
    }
    catch (err) {
        console.error("Error connecting to SQLite:", err);
        throw err;
    }
}
export function closeDB() {
    closeSQLite();
}
