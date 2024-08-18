import "dotenv";
import { MongoClient } from "mongodb";

let mongoClient: MongoClient;

export const getMongoClient = () => {
  const mongoUrl =
    process.env.MONGO_CONNECTION_STRING ??
    "mongodb://localhost:27017/scheduler";

  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUrl, { ignoreUndefined: true });
  }

  return mongoClient;
};

export const getTxCollection = async () => {
  const client = getMongoClient();
  const db = client.db("scheduler");
  return db.collection("txs");
};

export const saveTxToDB = async (txObj: any) => {
  try {
    const { rawTx, timeLock } = txObj;
    const collection = await getTxCollection();

    const query = { rawTx: rawTx };
    const options = { upsert: true };

    const update = { $set: txObj };

    const insertResult = await collection.updateOne(query, update, options);

    return { data: insertResult };
  } catch (e) {
    return { error: e };
  }
};

export const getTransactionsByTime = async () => {
  try {
    const time = new Date().getTime();
    const collection = await getTxCollection();
    const query = {
      timeLock: { $lt: time },
    };
    const cursor = collection.find(query);

    return { data: cursor };
  } catch (e) {
    return { error: e };
  }
};

export const deleteByRawTx = async (rawTx: string) => {
  try {
    const collection = await getTxCollection();
    const data = await collection.deleteOne({
      rawTx,
    });

    return { data };
  } catch (error) {
    return { error };
  }
};
