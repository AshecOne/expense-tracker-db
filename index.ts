import express, { Application } from "express";
import cors from "cors";
import userRouter from "./router/user";
import dotenv from 'dotenv';

const PORT: number | string = process.env.PORT || 3400;
const app: Application = express();

dotenv.config();
app.use(cors());
app.use(express.json());
app.use("/users", userRouter);

app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});