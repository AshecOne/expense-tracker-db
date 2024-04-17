import express from "express";
import { getUsers, signUp, signIn, getTransactions, updateProfile, changePassword, addTransaction, filterTransaction, getAllTransactions } from "../controller/user";

const router = express.Router();

router.get("/", getUsers);
router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/transactions", getTransactions);
router.put("/:id", updateProfile);
router.put("/:id/change-password", changePassword);
router.post("/transactions", addTransaction);
router.get('/transactions/filter', filterTransaction);
router.get('/transactions', getAllTransactions);

export default router;