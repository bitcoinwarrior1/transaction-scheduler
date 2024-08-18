import { Request, Response } from "express";
import * as bitcore from "bitcore-lib";
import { saveTxToDB } from "./db";

export async function handler(req: Request, res: Response) {
  const { rawTx } = req.body;
  try {
    const transaction = new bitcore.Transaction(rawTx);
    if (transaction.verify()) {
      const lockTime = transaction.getLockTime();
      const txObj = {
        rawTx,
        lockTime,
      };
      const { error } = await saveTxToDB(txObj);
      if (error) return res.send({ error }).status(500);

      return res.send({ data: true }).status(200);
    } else {
      return res.send({ error: "Invalid transaction" }).status(400);
    }
  } catch (error) {
    return res.send({ error });
  }
}
