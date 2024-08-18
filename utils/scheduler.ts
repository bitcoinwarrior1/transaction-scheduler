import { deleteByRawTx, getTransactionsByTime } from "./db";

async function main() {
  const txs = await getTransactionsByTime();
  // @ts-ignore
  for (const tx of txs) {
    const res = await broadcastTransaction(tx.rawTx);
    if (res.ok) {
      await deleteByRawTx(tx.rawTx);
    } else {
      console.error("Failed to broadcast transaction:", res.statusText);
    }
  }
}

const broadcastTransaction = async (rawTx: string) => {
  const url = "https://api.blockcypher.com/v1/btc/main/txs/push";

  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tx: rawTx }),
  });
};

main().then(console.log).catch(console.error);
