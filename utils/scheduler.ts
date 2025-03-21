import { deleteByRawTx, getTransactionsByTime } from "./db";
import { broadcastTransaction, getFee, getPrice } from "./helpers";

/*
 * @dev run the service, broadcasting eligible transactions by timelock and fee check
 * @dev should be run with a timed scheduler
 * @dev deletes the db record if successful
 * */
export async function main() {
  const currentFeeRate = await getFee();
  const currentPrice = await getPrice();
  const { error, data: txs } = await getTransactionsByTime();
  if (error) throw error;
  if (!txs) throw "DB error";
  for (const tx of txs) {
    if (tx.checkFee) {
      // Ignore transactions that do not meet the fee requirement
      if (tx.feePerKb < currentFeeRate) continue;
    }
    if (tx.price > 0) {
      // Ignore transactions with the price set above the current rate
      if (tx.price >= currentPrice) continue;
    }
    const res = await broadcastTransaction(tx.rawTx);
    if (res.error) {
      console.error("Failed to broadcast transaction:", res.statusText);
    } else {
      await deleteByRawTx(tx.rawTx);
      console.log(`Success: https://mempool.space/tx/${tx.hash}`);
    }
  }
}

main()
  .then(() => {
    console.log("success!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
