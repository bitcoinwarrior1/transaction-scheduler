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
