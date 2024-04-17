import express, { Application } from "express";
import cors from "cors";
import userRouter from "./router/user";

const PORT: number = 3400;
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);

app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});