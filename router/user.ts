import express from "express";
import {
  getUsers,
  signUp,
  signIn,
  updateProfile,
  changePassword,
  addTransaction,
  filterTransaction,
  getAllTransactions,
  deleteTransaction,
  updateTransaction,
  getTransactionById,
  getLimitedTransactions,
} from "../controller/user";

const router = express.Router();

router.get("/", getUsers);
router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/transactions/filter", filterTransaction);
router.get("/transactions", getLimitedTransactions);
router.get("/transactions/all", getAllTransactions);
router.post("/transactions", addTransaction);
router.get("/transactions/:id", getTransactionById);
router.delete("/transactions/:id", deleteTransaction);
router.put("/transactions/:id", updateTransaction);
router.put("/:id", updateProfile);
router.put("/:id/change-password", changePassword);

export default router;
