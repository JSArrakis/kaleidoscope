import { connectToSQLite, closeSQLite } from './sqlite';

export async function connectToDB() {
  try {
    await connectToSQLite();
    console.log('Connected to SQLite');
  } catch (err) {
    console.log('Error connecting to SQLite: ', err);
    throw err;
  }
}

export function closeDB() {
  closeSQLite();
}
