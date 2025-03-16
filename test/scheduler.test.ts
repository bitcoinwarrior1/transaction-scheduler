import { getFee, getPrice } from "../utils/scheduler";
import { DbTxObj, getTransactionsByTime } from "../utils/db";
import * as db from "../utils/db";
import * as scheduler from "../utils/scheduler";

describe("scheduler", () => {
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
  jest.spyOn(scheduler, "broadcastTransaction").mockResolvedValue({
    data: true,
  });

  it("should be able to get the current fee", async () => {
    const fee = await getFee();
    expect(fee).toBeGreaterThan(0);
  });

  it("should be able to get the current price", async () => {
    const price = await getPrice();
    console.log(price);
    expect(price).toBeGreaterThan(0);
  });

  it("should work", async () => {
    const result = await scheduler.main();
    expect(result).toEqual(true);
  });
});
