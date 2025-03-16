import * as db from "../utils/db";
import * as service from "../utils/service";

describe("service", () => {
  jest.spyOn(db, "getTransactionByHash").mockResolvedValue({
    data: {},
  });

  it("should be able to get", async () => {
    // @ts-ignore
    await service.getHandler({ params: { txHash: "" } }, undefined);
  });
});
