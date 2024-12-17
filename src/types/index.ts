import { ResultSetHeader, FieldPacket, OkPacket, RowDataPacket } from "mysql2";

export interface QueryParams {
  [key: string]: string | undefined;
}

export interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

export interface SignInBody {
  email: string;
  password: string;
}

export interface UserRow extends RowDataPacket {
  id_user: number;
  name: string;
  email: string;
  password: string;
}

export interface TransactionQueryParams {
  userId?: string | string[];
  orderBy?: string | string[];
  order?: string | string[];
}

export interface TransactionRow extends RowDataPacket {
  id_transaction: number;
  type: "income" | "expense";
  amount: number;
  date: Date;
  category: string;
}

export interface TransactionBody {
  type: "income" | "expense";
  amount: number;
  description?: string;
  category: string;
  date: string;
  userId: number;
}

export interface CategoryRow extends RowDataPacket {
  id_category: number;
}

export interface DeleteParams extends Record<string, string> {
  id: string;
}

export interface TransactionDetail extends RowDataPacket {
  id_transaction: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  date: Date;
  category: string;
}

export interface UpdateTransactionBody {
  type: "income" | "expense";
  amount: number;
  description?: string;
  category: string;
  date: string;
  userId: number;
}

export interface FilterQueryParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
  category?: string;
}

export interface UpdateProfileBody {
  name: string;
  email: string;
}

export interface ChangePasswordBody {
  password: string;
  currentPassword?: string; // Optional: untuk verifikasi password lama
}

export interface UserPassword extends RowDataPacket {
  password: string;
}