import { Request, Response } from "express";
import * as bitcore from "bitcore-lib";
import { getTransactionByHash, saveTxToDB } from "./db";

/*
 * @dev handles the API POST /schedule/tx
 * @param req - the request object
 * @param res - the response object
 * @returns status 200 on success with a response body of { data: txHash }
 * @returns status 500 on server failure
 * @returns status 400 on an invalid transaction
 * */
export async function postHandler(req: Request, res: Response) {
  const { rawTx, checkFee } = req.body;
  try {
    const transaction = new bitcore.Transaction(rawTx);
    if (transaction.verify()) {
      const lockTime = transaction.getLockTime();
      const fee = transaction.getFee();
      const hash = transaction.hash;
      const txSizeKb = rawTx.length / 2000;
      const feePerKb = fee / txSizeKb;
      const txObj = {
        rawTx,
        lockTime,
        checkFee,
        feePerKb,
        hash,
      };
      const { error } = await saveTxToDB(txObj);
      if (error) return res.send({ error }).status(500);

      return res.send({ data: hash }).status(200);
    } else {
      return res.send({ error: "Invalid transaction" }).status(400);
    }
  } catch (error) {
    return res.send({ error });
  }
}

/*
 * @dev handles the API GET /transaction/lookup/:txHash
 * @param req - the request object
 * @param res - the response object
 * @returns status 200 on success with a response body of { data: dbRecord }
 * @returns status 500 on server failure
 * */
export async function getHandler(req: Request, res: Response) {
  const { hash } = req.params;
  try {
    const { error, data } = await getTransactionByHash(hash);
    if (error) return res.send({ error }).status(500);
    return res.send({ data }).status(200);
  } catch (error) {
    return res.send({ error });
  }
}
