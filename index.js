"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./router/user"));
const dotenv_1 = __importDefault(require("dotenv"));
const PORT = process.env.PORT || 3400;
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, cors_1.default)({
    origin: 'https://ashecone.github.io',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
app.use("/users", user_1.default);
app.get('/', (req, res) => {
    res.send('Server is running');
});
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
