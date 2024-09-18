import { Request, Response } from "express";
import * as bitcore from "bitcore-lib";
import { saveTxToDB } from "./db";

/*
 * @dev handles the API POST /schedule/tx
 * @param req - the request object
 * @param res - the response object
 * @returns status 200 on success with a response body of { data: true }
 * @returns status 500 on server failure
 * @returns status 400 on an invalid transaction
 * */
export async function handler(req: Request, res: Response) {
  const { rawTx, checkFee } = req.body;
  try {
    const transaction = new bitcore.Transaction(rawTx);
    if (transaction.verify()) {
      const lockTime = transaction.getLockTime();
      const fee = transaction.getFee();
      const txObj = {
        rawTx,
        lockTime,
        checkFee,
        fee,
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
