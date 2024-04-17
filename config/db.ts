import mysql from "mysql2";

const pool = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ellss010599!',
    database: 'money_tracker',
});

export default pool;