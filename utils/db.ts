import "dotenv";
import { MongoClient, WithId } from "mongodb";

let mongoClient: MongoClient;

export interface DbTxObj extends WithId<Document>, TxObj {}

export interface TxObj {
  rawTx: string; // the raw transaction bytes as hex string
  lockTime: number; // nLockTime
  checkFee: boolean; // true to check, else false
  feePerKb: number; // sats per vbyte
  hash: string; // the transaction hash/id
  price: number; // the price to broadcast the transaction at in USD
}

/*
 * @dev gets the mongo client instance
 * @returns - the mongo client on success
 * */
export const getMongoClient = () => {
  const mongoUrl =
    process.env.MONGO_CONNECTION_STRING ??
    "mongodb://localhost:27017/scheduler";

  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUrl, { ignoreUndefined: true });
  }

  return mongoClient;
};

/*
 * @returns - the transaction collection instance
 * */
export const getTxCollection = async () => {
  const client = getMongoClient();
  const db = client.db("scheduler");
  return db.collection("txs");
};

/*
 * @dev saves a valid transaction to the database
 * @returns - the insert result if successful, else an error
 * */
export const saveTxToDB = async (txObj: TxObj) => {
  try {
    const { rawTx, lockTime } = txObj;
    const collection = await getTxCollection();

    const query = { rawTx: rawTx };
    const options = { upsert: true };

    const update = { $set: txObj };

    await collection.updateOne(query, update, options);

    return { data: true };
  } catch (error) {
    return { error };
  }
};

/*
 * @returns - transactions that are currently valid by timelock, if any, else an error
 * */
export const getTransactionsByTime = async () => {
  try {
    const time = new Date().getTime();
    const collection = await getTxCollection();
    const query = {
      timeLock: { $lt: time },
    };
    const cursor = await collection.findOne(query);

    return { data: cursor as DbTxObj };
  } catch (e) {
    return { error: e };
  }
};

/*
 * @dev - get a transaction by its hash
 * @param hash - the transaction hash
 * @returns - the transaction object found in the DB
 * */
export const getTransactionByHash = async (hash: string) => {
  try {
    const collection = await getTxCollection();
    const query = {
      hash,
    };
    const cursor = await collection.findOne(query);

    return { data: cursor as DbTxObj };
  } catch (e) {
    return { error: e };
  }
};

/*
 * @dev - delete a transaction by its hash
 * @param hash - the transaction hash
 * @returns - the delete result
 * */
export const deleteTransactionByHash = async (hash: string) => {
  try {
    const collection = await getTxCollection();
    const query = {
      hash,
    };
    await collection.deleteOne(query);

    return { data: true };
  } catch (e) {
    return { error: e };
  }
};

/*
 * @dev delete the transaction from the db after successful broadcast
 * @returns - the deletion result, else an error
 * */
export const deleteByRawTx = async (rawTx: string) => {
  try {
    const collection = await getTxCollection();
    await collection.deleteOne({
      rawTx,
    });
    return { data: true };
  } catch (error) {
    return { error };
  }
};
