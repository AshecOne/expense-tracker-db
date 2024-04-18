"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controller/user");
const router = express_1.default.Router();
router.get("/", user_1.getUsers);
router.post("/signup", user_1.signUp);
router.post("/signin", user_1.signIn);
router.get("/transactions", user_1.getTransactions);
router.delete("/transactions/:id", user_1.deleteTransaction);
router.put("/:id", user_1.updateProfile);
router.put("/:id/change-password", user_1.changePassword);
router.post("/transactions", user_1.addTransaction);
router.get('/transactions/filter', user_1.filterTransaction);
router.get('/transactions', user_1.getAllTransactions);
exports.default = router;
