/*
 * @dev broadcast the signed transaction
 * @param rawTx - hex encoded raw transaction
 * */
import { Transaction } from "bitcore-lib";

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
      {
        method: "GET",
        headers: {
          "X-Api-Key":
            process.env.API_NINJAS_API_KEY ??
            "dEWUYaMufvu+QsRIqtQKvw==ZSKse7zkswkcUTwo",
        },
      },
    );
    const result = await data.json();
    return parseInt(result.price);
  } catch (error) {
    console.error(error);
    return 0; // fallback to 100k USD
  }
};

export async function fetchInputUTXO(txid: string, voutIndex: number) {
  const url = `https://mempool.space/api/tx/${txid}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch TX data: ${response.statusText}`);
  }

  const txData = await response.json();
  const vout = txData.vout[voutIndex];

  if (!vout) {
    throw new Error(`No vout at index ${voutIndex}`);
  }

  return new Transaction.UnspentOutput({
    txId: txid,
    outputIndex: voutIndex,
    address: vout.scriptpubkey_address,
    script: vout.scriptpubkey, // hex scriptPubKey
    satoshis: vout.value,
  });
}
