import { deleteByRawTx, getTransactionsByTime } from "./db";

// TODO persist
let currentFeeRate = 0;

/*
 * @dev run the service, broadcasting eligible transactions by timelock and fee check
 * @dev should be run with a timed scheduler
 * @dev deletes the db record if successful
 * */
async function main() {
  await setFee();
  const txs = await getTransactionsByTime();
  // @ts-ignore
  for (const tx of txs) {
    if (tx.checkFee) {
      // Ignore transactions that do not meet the fee requirement
      if (tx.feePerKb < currentFeeRate) continue;
    }
    const res = await broadcastTransaction(tx.rawTx);
    if (res.ok) {
      await deleteByRawTx(tx.rawTx);
    } else {
      console.error("Failed to broadcast transaction:", res.statusText);
    }
  }
}

/*
 * @dev broadcast the signed transaction
 * @param rawTx - hex encoded raw transaction
 * */
const broadcastTransaction = async (rawTx: string) => {
  // TODO use bitcoin node RPC
  const url = "https://api.blockcypher.com/v1/btc/main/txs/push";

  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tx: rawTx }),
  });
};

/*
 * @dev set the current fee rate
 * */
const setFee = async () => {
  // TODO use bitcoin node RPC
  const res = await fetch("https://api.blockcypher.com/v1/btc/main");
  const { low_fee_per_kb } = await res.json();
  currentFeeRate = low_fee_per_kb;
};

main().then(console.log).catch(console.error);
