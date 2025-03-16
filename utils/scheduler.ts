import { deleteByRawTx, getTransactionsByTime } from "./db";

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
      if (tx.price < currentPrice) continue;
    }
    const res = await broadcastTransaction(tx.rawTx);
    if (res.ok) {
      await deleteByRawTx(tx.rawTx);
      return true;
    } else {
      console.error("Failed to broadcast transaction:", res.statusText);
      return false;
    }
  }
}

/*
 * @dev broadcast the signed transaction
 * @param rawTx - hex encoded raw transaction
 * */
export const broadcastTransaction = async (rawTx: string) => {
  const url = "https://api.blockcypher.com/v1/btc/main/txs/push";
  const data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tx: rawTx }),
  });

  return data.json();
};

/*
 * @dev get the current fee rate
 * */
export const getFee = async () => {
  const res = await fetch("https://api.blockcypher.com/v1/btc/main");
  const { low_fee_per_kb } = await res.json();
  return low_fee_per_kb;
};

/*
 * @dev get the current price in USD
 * */
export const getPrice = async () => {
  try {
    const data = await fetch(
      "https://api.api-ninjas.com/v1/cryptoprice?symbol=BTCUSD",
    );
    const result = await data.json();
    return result.price;
  } catch (error) {
    console.error(error);
    return 100_000; // fallback to 100k USD
  }
};

main()
  .then(() => {
    console.log("success!");
    // process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    // process.exit(-1);
  });
