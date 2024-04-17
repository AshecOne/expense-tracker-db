"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.herokuConfig = exports.localConfig = void 0;
const localConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
exports.localConfig = localConfig;
const herokuConfig = process.env.JAWSDB_URL;
exports.herokuConfig = herokuConfig;
