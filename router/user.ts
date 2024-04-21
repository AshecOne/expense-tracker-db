import express from "express";
import {
  getUsers,
  signUp,
  signIn,
  getTransactions,
  updateProfile,
  changePassword,
  addTransaction,
  filterTransaction,
  getAllTransactions,
  deleteTransaction,
  updateTransaction,
  getTransactionById,
} from "../controller/user";

const router = express.Router();

router.get("/", getUsers);
router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/transactions", getTransactions);
router.delete("/transactions/:id", deleteTransaction);
router.put("/transactions/:id", updateTransaction);
router.put("/:id", updateProfile);
router.put("/:id/change-password", changePassword);
router.post("/transactions", addTransaction);
router.get("/transactions/:id", getTransactionById);
router.get("/transactions/filter", (req, res) => {
  console.log("Received request to filter transactions");
  filterTransaction(req, res);
});
router.get("/transactions", getAllTransactions);

export default router;
