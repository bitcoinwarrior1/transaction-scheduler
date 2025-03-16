import { Request, Response } from "express";
import * as bitcore from "bitcore-lib";
import {
  deleteTransactionByHash,
  getTransactionByHash,
  saveTxToDB,
  TxObj,
} from "./db";

/*
 * @dev handles the API POST /schedule/tx
 * @param req - the request object
 * @param res - the response object
 * @returns status 200 on success with a response body of { data: txHash }
 * @returns status 500 on server failure
 * @returns status 400 on an invalid transaction
 * */
export async function postHandler(req: Request, res: Response) {
  const { rawTx, checkFee, price } = req.body;
  if (rawTx === "") return res.send({ error: "No raw tx found" }).status(400);
  try {
    const transaction = new bitcore.Transaction(rawTx);
    if (transaction.verify()) {
      const lockTime = transaction.getLockTime();
      const fee = transaction.getFee();
      const hash = transaction.hash;
      const alreadyBroadcast = await getTxAlreadyBroadcast(hash);
      if (alreadyBroadcast)
        return res
          .send({ error: "Tx is already sent to the network" })
          .status(400);
      const txSizeKb = rawTx.length / 2000;
      const feePerKb = fee / txSizeKb;
      const txObj: TxObj = {
        rawTx,
        lockTime: lockTime as number,
        checkFee,
        feePerKb,
        hash,
        price,
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
 * @dev checks if a transaction has already been broadcast
 * @param txHash - the transaction hash to check
 * @returns true if already broadcast, else false
 * */
async function getTxAlreadyBroadcast(txHash: string) {
  try {
    const data = await fetch(
      `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
    );
    const result = await data.json();
    return result.size > 0;
  } catch (e) {
    console.error(e);
    return false;
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
  const { txHash } = req.params;
  try {
    const { error, data } = await getTransactionByHash(txHash);
    if (error) return res.send({ error }).status(500);
    return res.send({ data }).status(200);
  } catch (error) {
    return res.send({ error });
  }
}

/*
 * @dev handles the API DELETE /delete/:txHash
 * @param req - the request object
 * @param res - the response object
 * @returns status 200 on success with a response body of { data: deletedRecord }
 * @returns status 500 on server failure
 * */
export async function deleteHandler(req: Request, res: Response) {
  const { hash } = req.params;
  try {
    const { error, data } = await deleteTransactionByHash(hash);
    if (error) return res.send({ error }).status(500);
    return res.send({ data }).status(200);
  } catch (error) {
    return res.send({ error });
  }
}
