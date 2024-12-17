import express, { Application } from "express";
import cors from "cors";
import userRouter from "./router/user";
import dotenv from "dotenv";

const PORT: number | string = process.env.PORT || 3400;
const app: Application = express();

dotenv.config();
app.use(
  cors({
    origin: [
      "https://ashecone.github.io",
      "https://ashecone.github.io/expense-tracker",
      "https://ashecone.github.io/expense-tracker/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/users", userRouter);
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});
