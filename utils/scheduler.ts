import { deleteByRawTx, getTransactionsByTime } from "./db";

/*
 * @dev run the service, broadcasting eligible transactions by timelock and fee check
 * @dev should be run with a timed scheduler
 * @dev deletes the db record if successful
 * */
async function main() {
  const currentFeeRate = await getFee();
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
const getFee = async () => {
  const res = await fetch("https://api.blockcypher.com/v1/btc/main");
  const { low_fee_per_kb } = await res.json();
  return low_fee_per_kb;
};

main()
  .then(() => {
    console.log("success!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
