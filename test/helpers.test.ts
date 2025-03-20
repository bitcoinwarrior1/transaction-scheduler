import { getFee, getPrice } from "../utils/helpers";
import { DbTxObj } from "../utils/db";
import * as db from "../utils/db";
import * as helpers from "../utils/helpers";

describe("helpers", () => {
  jest.spyOn(db, "getTransactionsByTime").mockResolvedValue({
    data: [
      {
        rawTx: "0x",
        lockTime: 2193190,
        checkFee: true,
        feePerKb: 10,
        hash: "0x",
        price: 100_000,
      },
    ] as DbTxObj[],
  });
  jest.spyOn(helpers, "broadcastTransaction").mockResolvedValue({
    data: true,
  });

  it("should be able to get the current fee", async () => {
    const fee = await getFee();
    expect(fee).toBeGreaterThan(0);
  });

  it("should be able to get the current price", async () => {
    const price = await getPrice();
    expect(price).toBeGreaterThan(0);
  });
});
