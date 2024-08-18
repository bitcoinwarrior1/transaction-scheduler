import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { handler } from "./utils/service";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

/*
 * @dev post a signed tx to be broadcast when the timelock is met
 * @param request.body - the signed transaction as hex
 * */
app.post("/schedule/tx", (req: Request, res: Response) => {
  return handler(req, res);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at port: ${port}`);
});
