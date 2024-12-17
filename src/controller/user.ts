import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from "bcrypt";
import { ResultSetHeader, OkPacket, RowDataPacket } from "mysql2";
import {
  SignUpBody,
  SignInBody,
  UserRow,
  TransactionQueryParams,
  TransactionRow,
  TransactionBody,
  TransactionDetail,
  CategoryRow,
  DeleteParams,
  QueryParams,
  UpdateTransactionBody,
  FilterQueryParams,
  UpdateProfileBody,
  ChangePasswordBody,
  UserPassword,
} from "../types";

// Get user's data
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    let query = "SELECT * FROM users";
    const params: string[] = [];

    if (Object.keys(req.query).length) {
      const filter = Object.keys(req.query).map((key: string) => {
        params.push(req.query[key] as string);
        return `${key} = ?`;
      });
      query += ` WHERE ${filter.join(" AND ")}`;
    }

    console.log("Received query parameters:", req.query);
    console.log("Constructed SQL query:", query);
    console.log("Query parameters:", params);

    const [results] = await pool.query<RowDataPacket[]>(query, params);

    console.log("Query results:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Input user's data
export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as SignUpBody;
    console.log("Received sign up request:", {
      name,
      email,
      password: "HIDDEN",
    });

    // Validasi input
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      console.log(
        "Validation failed: Name, email, and password cannot be empty."
      );
      res.status(400).json({
        message: "Name, email, and password cannot be empty.",
      });
      return;
    }

    // Hash password
    console.log("Attempting to hash password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully.");

    // Query database
    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    const values = [name, email, hashedPassword];
    console.log("Executing database insert query:", query);
    console.log("With values:", [name, email, "HASHED_PASSWORD"]);

    const [result] = await pool.query<ResultSetHeader>(query, values);

    console.log("User created successfully:", {
      id: result.insertId,
      name,
      email,
    });

    res.status(201).json({
      message: "User created successfully.",
      user: { id: result.insertId, name, email },
    });
  } catch (error) {
    console.error("Error during user signup:", error);

    // Handle specific MySQL errors
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      res.status(409).json({
        message: "Email already exists.",
        error: "Duplicate email address",
      });
      return;
    }

    res.status(500).json({
      message: "Internal server error during signup.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Login user
export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as SignInBody;
    console.log("Received sign in request for email:", email);

    // Validasi input
    if (!email?.trim() || !password?.trim()) {
      console.log("Validation failed: Email and password are required.");
      res.status(400).json({
        message: "Email and password are required.",
      });
      return;
    }

    // Query database
    const query = "SELECT * FROM users WHERE email = ?";
    const [results] = await pool.query<UserRow[]>(query, [email]);

    if (results.length === 0) {
      console.log("No user found with the provided email:", email);
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    const user = results[0];

    // Validate password
    console.log("Attempting to validate password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("Invalid password provided for user:", email);
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    console.log("User authenticated successfully:", {
      id: user.id_user,
      name: user.name,
    });

    res.status(200).json({
      user: {
        id: user.id_user,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during sign in:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Display brief user's data (balance and transactions)
export const getLimitedTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract and validate query params
    const userId = req.query.userId as string;
    const orderBy = (req.query.orderBy as string) || "date";
    const order = (req.query.order as string) || "desc";

    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    console.log("Fetching limited transactions with params:", {
      userId,
      orderBy,
      order,
      limit: 5,
    });

    // Validate orderBy to prevent SQL injection
    const allowedOrderByFields = ["date", "amount", "type", "id_transaction"];
    const validOrderBy = allowedOrderByFields.includes(orderBy)
      ? orderBy
      : "date";

    // Validate order direction
    const validOrder = order === "asc" ? "asc" : "desc";

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
      ORDER BY transactions.${validOrderBy} ${validOrder}
      LIMIT 5
    `;

    const [results] = await pool.query<TransactionRow[]>(query, [userId]);

    // Sisa kode sama seperti sebelumnya...
    const totalIncome = results
      .filter((transaction) => transaction.type === "income")
      .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

    const totalExpense = results
      .filter((transaction) => transaction.type === "expense")
      .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

    const balance = totalIncome - totalExpense;

    console.log(
      `Found ${results.length} limited transactions for user ID ${userId}`
    );
    console.log(`Calculated Balance: ${balance}`);

    res.status(200).json({
      transactions: results,
      balance,
      summary: {
        totalIncome,
        totalExpense,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Adding transaction data
export const addTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, amount, description, category, date, userId } =
      req.body as TransactionBody;

    // Validate required fields
    if (!type || !amount || !category || !date || !userId) {
      res.status(400).json({
        message:
          "Missing required fields. Type, amount, category, date, and userId are required.",
      });
      return;
    }

    // Validate transaction type
    if (type !== "income" && type !== "expense") {
      res.status(400).json({
        message: "Transaction type must be either 'income' or 'expense'",
      });
      return;
    }

    console.log("Adding new transaction with data:", {
      type,
      amount,
      description,
      category,
      date,
      userId,
    });

    // Check for existing category
    const getCategoryQuery =
      "SELECT id_category FROM categories WHERE name = ?";
    const [categoryResults] = await pool.query<CategoryRow[]>(
      getCategoryQuery,
      [category]
    );

    let categoryId: number;

    if (categoryResults.length === 0) {
      console.log(`Category '${category}' not found, creating new category.`);
      const categoryType = type === "income" ? "income" : "expense";

      const createCategoryQuery =
        "INSERT INTO categories (name, type) VALUES (?, ?)";
      const [createCategoryResult] = await pool.query<OkPacket>(
        createCategoryQuery,
        [category, categoryType]
      );

      categoryId = createCategoryResult.insertId;
      console.log(`New category created with ID: ${categoryId}`);
    } else {
      categoryId = categoryResults[0].id_category;
      console.log(`Found existing category with ID: ${categoryId}`);
    }

    // Insert transaction
    const insertQuery = `
     INSERT INTO transactions 
       (user_id, type, amount, description, category_id, date) 
     VALUES (?, ?, ?, ?, ?, ?)
   `;
    const values = [userId, type, amount, description, categoryId, date];

    const [result] = await pool.query<OkPacket>(insertQuery, values);

    console.log("Transaction added successfully with ID:", result.insertId);
    res.status(201).json({
      message: "Transaction added successfully",
      transactionId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting transaction:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete transaction
export const deleteTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        message: "Transaction ID is required",
      });
      return;
    }

    console.log(`Deleting transaction with ID: ${id}`);

    const query = "DELETE FROM transactions WHERE id_transaction = ?";
    const [result] = await pool.query<OkPacket>(query, [id]);

    if (result.affectedRows === 0) {
      console.log(`Transaction with ID ${id} not found`);
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    console.log(`Transaction with ID ${id} deleted successfully`);
    res.status(200).json({
      message: "Transaction deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get transaction by id
export const getTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        message: "Transaction ID is required",
      });
      return;
    }

    console.log(`Received request to get transaction with ID: ${id}`);

    const query = `
     SELECT 
       transactions.id_transaction,
       transactions.type,
       transactions.amount,
       transactions.description,
       transactions.date,
       categories.name AS category
     FROM transactions
     JOIN categories ON transactions.category_id = categories.id_category
     WHERE transactions.id_transaction = ?
   `;

    const [results] = await pool.query<TransactionDetail[]>(query, [id]);

    if (results.length === 0) {
      console.log(`Transaction with ID ${id} not found`);
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    const transaction = results[0];
    console.log(`Successfully fetched transaction with ID: ${id}`);

    res.status(200).json({
      transaction: {
        id: transaction.id_transaction,
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        date: transaction.date,
        category: transaction.category,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Edit transaction
export const updateTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, amount, description, category, date, userId } =
      req.body as UpdateTransactionBody;

    // Validate required fields
    if (!id || !type || !amount || !category || !date || !userId) {
      res.status(400).json({
        message: "Missing required fields",
      });
      return;
    }

    // Validate transaction type
    if (type !== "income" && type !== "expense") {
      res.status(400).json({
        message: "Invalid transaction type. Must be 'income' or 'expense'",
      });
      return;
    }

    console.log(`Updating transaction ID ${id} with data:`, {
      type,
      amount,
      description,
      category,
      date,
      userId,
    });

    // Check existing category or create new one
    const getCategoryQuery =
      "SELECT id_category FROM categories WHERE name = ?";
    const [categoryResults] = await pool.query<CategoryRow[]>(
      getCategoryQuery,
      [category]
    );

    let categoryId: number;

    if (categoryResults.length === 0) {
      console.log(`Creating new category: ${category}`);
      const createCategoryQuery =
        "INSERT INTO categories (name, type) VALUES (?, ?)";
      const [createCategoryResult] = await pool.query<OkPacket>(
        createCategoryQuery,
        [category, type]
      );
      categoryId = createCategoryResult.insertId;
      console.log(`New category created with ID: ${categoryId}`);
    } else {
      categoryId = categoryResults[0].id_category;
      console.log(`Using existing category with ID: ${categoryId}`);
    }

    // Update transaction
    const updateQuery = `
     UPDATE transactions 
     SET type = ?, 
         amount = ?, 
         description = ?, 
         category_id = ?, 
         date = ? 
     WHERE id_transaction = ? 
     AND user_id = ?
   `;
    const values = [type, amount, description, categoryId, date, id, userId];

    const [result] = await pool.query<OkPacket>(updateQuery, values);

    if (result.affectedRows === 0) {
      console.log(`No transaction updated. ID: ${id}, UserID: ${userId}`);
      res.status(404).json({
        message: "Transaction not found or not authorized",
      });
      return;
    }

    console.log(`Successfully updated transaction ID: ${id}`);
    res.status(200).json({
      message: "Transaction updated successfully",
      transactionId: id,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Filtering data
export const filterTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, startDate, endDate, type, category } =
      req.query as FilterQueryParams;

    if (!userId) {
      res.status(400).json({
        message: "userId is required",
      });
      return;
    }

    console.log("Filtering transactions with params:", {
      userId,
      startDate,
      endDate,
      type,
      category,
    });

    // Prepare base query
    let query = `
     SELECT 
       transactions.id_transaction, 
       transactions.type, 
       transactions.amount, 
       transactions.date, 
       transactions.description,
       categories.name AS category
     FROM transactions
     JOIN categories ON transactions.category_id = categories.id_category
     WHERE transactions.user_id = ?
   `;
    const values: (string | number)[] = [userId];

    // Add date range filter
    if (startDate && endDate) {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD",
        });
        return;
      }
      query += " AND DATE(transactions.date) BETWEEN ? AND ?";
      values.push(startDate, endDate);
    }

    // Add type filter
    if (type) {
      if (type !== "income" && type !== "expense") {
        res.status(400).json({
          message: "Invalid transaction type. Must be 'income' or 'expense'",
        });
        return;
      }
      query += " AND transactions.type = ?";
      values.push(type);
    }

    // Add category filter
    if (category) {
      query += " AND categories.name = ?";
      values.push(category);
    }

    query += " ORDER BY transactions.date DESC";

    console.log("Executing query:", query);
    console.log("With values:", values);

    const [results] = await pool.query<TransactionRow[]>(query, values);

    console.log(`Found ${results.length} results`);

    // Transform amounts to numbers and format dates
    const formattedResults = results.map((row) => ({
      ...row,
      amount: Number(row.amount),
      date: new Date(row.date).toISOString().split("T")[0],
    }));

    res.status(200).json({
      count: results.length,
      transactions: formattedResults,
    });
  } catch (error) {
    console.error("Error filtering transactions:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Helper function to validate date format
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Display all transactions data
export const getAllTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryParams = req.query as TransactionQueryParams;
    const userId = Array.isArray(queryParams.userId)
      ? queryParams.userId[0]
      : queryParams.userId;
    const orderBy = Array.isArray(queryParams.orderBy)
      ? queryParams.orderBy[0]
      : queryParams.orderBy || "date";
    const order = Array.isArray(queryParams.order)
      ? queryParams.order[0]
      : queryParams.order || "desc";

    if (!userId) {
      res.status(400).json({
        message: "userId is required",
      });
      return;
    }

    console.log("Fetching all transactions with params:", {
      userId,
      orderBy,
      order,
    });

    // Validate orderBy field to prevent SQL injection
    const allowedOrderByFields = ["date", "amount", "type", "id_transaction"];
    const validOrderBy = allowedOrderByFields.includes(orderBy)
      ? orderBy
      : "date";

    // Validate order direction
    const validOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    const query = `
      SELECT 
        transactions.id_transaction,
        transactions.type,
        transactions.amount,
        transactions.date,
        transactions.description,
        categories.name AS category
      FROM transactions
      JOIN categories ON transactions.category_id = categories.id_category
      WHERE transactions.user_id = ?
      ORDER BY transactions.${validOrderBy} ${validOrder}
    `;

    console.log("Executing query:", query);

    const [results] = await pool.query<TransactionRow[]>(query, [userId]);

    const formattedTransactions = results.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      date: new Date(transaction.date).toISOString().split("T")[0],
    }));

    const totalIncome = formattedTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = formattedTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`Found ${results.length} transactions for user ID ${userId}`);

    res.status(200).json({
      transactions: formattedTransactions,
      summary: {
        count: results.length,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Change user's profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email } = req.body as UpdateProfileBody;
    const userId = req.params.id;

    // Validate inputs
    if (!userId || !name?.trim() || !email?.trim()) {
      res.status(400).json({
        message: "User ID, name, and email are required",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        message: "Invalid email format",
      });
      return;
    }

    console.log("Updating user profile with data:", { userId, name, email });

    const query = "UPDATE users SET name = ?, email = ? WHERE id_user = ?";
    const values = [name, email, userId];

    console.log("Executing query:", query, "Values:", values);

    const [result] = await pool.query<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      console.log("User not found with ID:", userId);
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    console.log("Profile updated successfully for user ID:", userId);

    // Fetch updated user data to ensure data consistency
    const [updatedUser] = await pool.query(
      "SELECT id_user, name, email FROM users WHERE id_user = ?",
      [userId]
    );

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: userId,
        name,
        email,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    // Handle duplicate email error
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      res.status(409).json({
        message: "Email already in use.",
        error: "Duplicate email address",
      });
      return;
    }

    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Change user's password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { password, currentPassword } = req.body as ChangePasswordBody;
    const userId = req.params.id;

    // Validate inputs
    if (!userId || !password?.trim()) {
      res.status(400).json({
        message: "User ID and new password are required",
      });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number",
      });
      return;
    }

    console.log(`Starting password change process for user ID: ${userId}`);

    // Optional: Verify current password
    if (currentPassword) {
      const [users] = await pool.query<UserPassword[]>(
        "SELECT password FROM users WHERE id_user = ?",
        [userId]
      );

      if (users.length === 0) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        users[0].password
      );

      if (!isCurrentPasswordValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Password hashed successfully for user ID: ${userId}`);

    // Update password in database
    const query = "UPDATE users SET password = ? WHERE id_user = ?";
    const values = [hashedPassword, userId];

    console.log(`Executing query to change password:`, query);

    const [result] = await pool.query<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      console.log(
        `User not found or password unchanged for user ID: ${userId}`
      );
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    console.log(`Password changed successfully for user ID: ${userId}`);
    res.status(200).json({
      message: "Password changed successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
