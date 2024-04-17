import mysql from 'mysql2';

const localConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const herokuConfig = process.env.JAWSDB_URL;

export { localConfig, herokuConfig };