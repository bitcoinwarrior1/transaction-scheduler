import { getTxCollection } from "../utils/db";

describe("DB", () => {
  it("Should be able to get the collection", async () => {
    const collection = await getTxCollection();
    expect(collection).toBeDefined();
  });
});
