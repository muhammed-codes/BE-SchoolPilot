require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT,
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  try {
    await client.query('UPDATE users SET "isEmailVerified" = true');
    console.log("Updated all existing users to have isEmailVerified = true");
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
});
