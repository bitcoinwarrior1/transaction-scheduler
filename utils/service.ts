import { Request, Response } from "express";
import * as bitcore from "bitcore-lib";
import {
  deleteTransactionByHash,
  getTransactionByHash,
  saveTxToDB,
  TxObj,
} from "./db";
import { fetchInputUTXO } from "./helpers";

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

  if (!rawTx || rawTx === "") {
    return res.status(400).send({ error: "No raw tx found" });
  }

  try {
    let transaction = new bitcore.Transaction(rawTx);

    if (!transaction.verify()) {
      return res.status(400).send({ error: "Invalid transaction" });
    }

    const utxos = [];
    let inputValue = 0;
    for (const input of transaction.inputs) {
      const txid = input.prevTxId.toString("hex");
      const vout = input.outputIndex;

      const utxo = await fetchInputUTXO(txid, vout);
      utxos.push(utxo);
      inputValue += utxo.satoshis;
    }

    let outputValue = 0;
    for (const output of transaction.outputs) {
      outputValue += output.satoshis;
    }

    // TODO can probably remove this
    transaction = transaction.from(utxos);

    let lockTime = new Date(transaction.getLockTime()).getTime();
    const fee = inputValue - outputValue;
    if (fee < 0)
      return res
        .send({ error: "Output value exceeds input value" })
        .status(400);
    const hash = transaction.hash;

    const alreadyBroadcast = await getTxAlreadyBroadcast(hash);
    if (alreadyBroadcast) {
      return res
        .status(400)
        .send({ error: "Tx is already sent to the network" });
    }

    const txSizeKb = rawTx.length / 2000; // assuming rawTx is hex string (2 hex chars = 1 byte)
    const feePerKb = fee / txSizeKb;

    const txObj: TxObj = {
      rawTx,
      lockTime,
      checkFee,
      feePerKb,
      hash,
      price,
    };

    const { error } = await saveTxToDB(txObj);
    if (error) {
      return res.status(500).send({ error });
    }

    return res.status(200).send({ data: hash });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .send({ error: error.message || "Internal server error" });
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
