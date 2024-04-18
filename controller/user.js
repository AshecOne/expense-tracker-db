"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getAllTransactions = exports.filterTransaction = exports.updateTransaction = exports.deleteTransaction = exports.addTransaction = exports.getTransactions = exports.signIn = exports.signUp = exports.getUsers = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const pool = process.env.NODE_ENV === "production"
    ? mysql2_1.default.createPool(db_1.herokuConfig)
    : mysql2_1.default.createPool(db_1.localConfig);
// Get user's data
const getUsers = (req, res) => {
    let query = "SELECT * FROM users";
    if (Object.keys(req.query).length) {
        const filter = Object.keys(req.query).map((val) => {
            return `${val}=${mysql2_1.default.escape(req.query[val])}`;
        });
        query += ` WHERE ${filter.join(" AND ")}`;
    }
    console.log("Received query parameters:", req.query);
    console.log("Constructed SQL query:", query);
    pool.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).send(err);
        }
        console.log("Query results:", results);
        return res.status(200).send(results);
    });
};
exports.getUsers = getUsers;
// Input user's data
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    console.log("Received sign up request:", { name, email, password: "HIDDEN" });
    if (!name.trim() || !email.trim() || !password.trim()) {
        console.log("Validation failed: Name, email, and password cannot be empty.");
        return res.status(400).send({ message: "Name, email, and password cannot be empty." });
    }
    try {
        console.log("Attempting to hash password...");
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        console.log("Password hashed successfully.");
        const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        const values = [name, email, hashedPassword];
        console.log("Executing database insert query:", query);
        console.log("With values:", [name, email, "HASHED_PASSWORD"]);
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error("Database query error:", err.message); // Log the specific error message
                return res.status(500).send({ message: "Internal Server Error: Unable to insert user.", error: err.message });
            }
            console.log("User created successfully:", { id: result.insertId, name, email });
            return res.status(201).send({
                message: "User created successfully.",
                user: { id: result.insertId, name, email }
            });
        });
    }
    catch (error) {
        console.error("Error during user signup:", error);
        return res.status(500).send({ message: "Internal server error during signup." });
    }
});
exports.signUp = signUp;
// Login user
const signIn = (req, res) => {
    const { email, password } = req.body;
    console.log("Received sign in request for email:", email);
    if (!email.trim() || !password.trim()) {
        console.log("Validation failed: Email and password are required.");
        return res
            .status(400)
            .send({ message: "Email and password are required." });
    }
    const query = "SELECT * FROM users WHERE email = ?";
    const values = [email];
    pool.query(query, values, (err, results) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error("Error querying database for user:", err);
            return res.status(500).send({ message: "Internal server error." });
        }
        if (results.length === 0) {
            console.log("No user found with the provided email:", email);
            return res.status(401).send({ message: "Invalid email or password." });
        }
        const user = results[0];
        try {
            console.log("Attempting to validate password...");
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                console.log("Invalid password provided for user:", email);
                return res.status(401).send({ message: "Invalid email or password." });
            }
            console.log("User authenticated successfully:", {
                id: user.id_user,
                name: user.name,
            });
            return res.status(200).send({
                user: { id: user.id_user, name: user.name, email: user.email },
            });
        }
        catch (error) {
            console.error("Error comparing passwords:", error);
            return res.status(500).send({ message: "Internal server error." });
        }
    }));
};
exports.signIn = signIn;
// Display brief user's data (balance and transactions)
const getTransactions = (req, res) => {
    const { userId } = req.query;
    console.log(`Received request to get transactions for User ID: ${userId}`);
    if (!userId) {
        console.log("Request failed: User ID is required.");
        return res.status(400).send({ message: "User ID is required." });
    }
    const query = `
    SELECT transactions.id_transaction, transactions.type, transactions.amount, transactions.date, categories.name AS category 
    FROM transactions 
    JOIN categories ON transactions.category_id = categories.id_category
    WHERE transactions.user_id = ?
    ORDER BY transactions.date DESC;
  `;
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error querying transactions for User ID:", userId, "; Error:", err);
            return res.status(500).send({ message: "Internal server error." });
        }
        console.log(`Successfully fetched transactions for User ID: ${userId}`);
        const totalIncome = results
            .filter((transaction) => transaction.type === "income")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
        const totalExpense = results
            .filter((transaction) => transaction.type === "expense")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
        const balance = totalIncome - totalExpense;
        console.log(`Calculated Balance for User ID: ${userId}; Income: ${totalIncome}, Expense: ${totalExpense}, Balance: ${balance}`);
        res.status(200).send({
            balance,
            transactions: results,
        });
    });
};
exports.getTransactions = getTransactions;
// Adding transaction data
const addTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, amount, description, category, date, userId } = req.body;
    console.log("Adding new transaction with data:", {
        type,
        amount,
        description,
        category,
        date,
        userId,
    });
    try {
        const getCategoryQuery = "SELECT id_category FROM categories WHERE name = ?";
        const [categoryResults] = yield pool
            .promise()
            .query(getCategoryQuery, [category]);
        let categoryId;
        if (categoryResults.length === 0) {
            console.log(`Category '${category}' not found, creating new category.`);
            const categoryType = type === "income" ? "income" : "expense";
            const createCategoryQuery = "INSERT INTO categories (name, type) VALUES (?, ?)";
            const [createCategoryResult] = yield pool
                .promise()
                .query(createCategoryQuery, [category, categoryType]);
            categoryId = createCategoryResult.insertId;
            console.log(`New category created with ID: ${categoryId}`);
        }
        else {
            categoryId = categoryResults[0].id_category;
            console.log(`Found existing category with ID: ${categoryId}`);
        }
        const insertQuery = "INSERT INTO transactions (user_id, type, amount, description, category_id, date) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [userId, type, amount, description, categoryId, date];
        yield pool.promise().query(insertQuery, values);
        console.log("Transaction added successfully.");
        res.status(201).send({
            message: "Transaction added successfully",
        });
    }
    catch (error) {
        console.error("Error inserting transaction:", error);
        res.status(500).send({ message: "Internal server error." });
    }
});
exports.addTransaction = addTransaction;
// Delete transaction
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`Deleting transaction with ID: ${id}`);
    try {
        const query = "DELETE FROM transactions WHERE id_transaction = ?";
        const [result] = yield pool
            .promise()
            .query(query, [id]);
        if (result.affectedRows === 0) {
            console.log(`Transaction with ID ${id} not found`);
            return res.status(404).send({ message: "Transaction not found" });
        }
        console.log(`Transaction with ID ${id} deleted successfully`);
        res.status(200).send({ message: "Transaction deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});
exports.deleteTransaction = deleteTransaction;
// Edit transaction
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { type, amount, description, category, date, userId } = req.body;
    try {
        const query = "UPDATE transactions SET type = ?, amount = ?, description = ?, category_id = (SELECT id_category FROM categories WHERE name = ?), date = ? WHERE id_transaction = ? AND user_id = ?";
        const values = [type, amount, description, category, date, id, userId];
        const [result] = yield pool.promise().query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Transaction not found or not authorized" });
        }
        res.status(200).send({ message: "Transaction updated successfully" });
    }
    catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});
exports.updateTransaction = updateTransaction;
// Filtering data
const filterTransaction = (req, res) => {
    const { userId, startDate, endDate, type, category } = req.query;
    console.log("Filtering transactions with params:", {
        userId,
        startDate,
        endDate,
        type,
        category,
    });
    let query = `
    SELECT 
      transactions.id_transaction,
      transactions.type,
      transactions.amount,
      transactions.date,
      categories.name AS category
    FROM transactions
    JOIN categories ON transactions.category_id = categories.id_category
    WHERE transactions.user_id = ?
  `;
    const values = [userId];
    if (startDate && endDate) {
        query += " AND transactions.date BETWEEN ? AND ?";
        values.push(startDate, endDate);
    }
    if (type) {
        query += " AND transactions.type = ?";
        values.push(type);
    }
    if (category) {
        query += " AND categories.name = ?";
        values.push(category);
    }
    query += " ORDER BY transactions.date DESC";
    console.log("Executing query:", query);
    console.log("With values:", values);
    pool.query(query, values, (err, results) => {
        if (err) {
            console.error("Error filtering transactions:", err);
            return res.status(500).send({ message: "Internal server error." });
        }
        console.log(`Found ${results.length} results`);
        res.status(200).send(results);
    });
};
exports.filterTransaction = filterTransaction;
// Display all transactions data
const getAllTransactions = (req, res) => {
    const { userId, orderBy, order } = req.query;
    console.log("Fetching all transactions with params:", {
        userId,
        orderBy,
        order,
    });
    const query = `
    SELECT 
      transactions.id_transaction,
      transactions.type,
      transactions.amount,
      transactions.date,
      categories.name AS category
    FROM transactions
    JOIN categories ON transactions.category_id = categories.id_category
    WHERE transactions.user_id = ?
    ORDER BY transactions.${orderBy} ${order}
  `;
    console.log("Executing query:", query);
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching transactions:", err);
            return res
                .status(500)
                .send({ message: "Internal server error.", error: err.message });
        }
        console.log(`Found ${results.length} transactions for user ID ${userId}`);
        res.status(200).send({ transactions: results });
    });
};
exports.getAllTransactions = getAllTransactions;
// Change user's profile
const updateProfile = (req, res) => {
    const { name, email } = req.body;
    const userId = req.params.id;
    console.log("Updating user profile with data:", { userId, name, email });
    const query = "UPDATE users SET name = ?, email = ? WHERE id_user = ?";
    const values = [name, email, userId];
    console.log("Executing query:", query, "Values:", values);
    pool.query(query, values, (err, result) => {
        if (err) {
            console.error("Error updating user profile:", err);
            return res
                .status(500)
                .send({ message: "Internal server error.", error: err.message });
        }
        if (result.affectedRows === 0) {
            console.log("User not found with ID:", userId);
            return res.status(404).send({ message: "User not found." });
        }
        console.log("Profile updated successfully for user ID:", userId);
        res.status(200).send({
            message: "Profile updated successfully.",
            user: { id: userId, name, email },
        });
    });
};
exports.updateProfile = updateProfile;
// Change user's password
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    const userId = req.params.id;
    console.log(`Starting password change process for user ID: ${userId}`);
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        console.log(`Password hashed successfully for user ID: ${userId}`);
        const query = "UPDATE users SET password = ? WHERE id_user = ?";
        const values = [hashedPassword, userId];
        console.log(`Executing query to change password:`, query, "Values:", values);
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error("Error changing password:", err);
                return res
                    .status(500)
                    .send({ message: "Internal server error.", error: err.message });
            }
            if (result.affectedRows === 0) {
                console.log(`User not found or password unchanged for user ID: ${userId}`);
                return res.status(404).send({ message: "User not found." });
            }
            console.log(`Password changed successfully for user ID: ${userId}`);
            res.status(200).send({ message: "Password changed successfully." });
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error hashing password:", error.message);
            res
                .status(500)
                .send({ message: "Internal server error.", error: error.message });
        }
        else {
            console.error("Unexpected error:", error);
            res.status(500).send({ message: "Internal server error." });
        }
    }
});
exports.changePassword = changePassword;
