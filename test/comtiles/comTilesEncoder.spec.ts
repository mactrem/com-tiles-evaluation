import { encodeFragmentBitAligned } from "../../dist/comtiles/fragmentEncoder";

describe("comTilesParser", () => {
  describe("encodeFragment", () => {
    it("should encode fragment", () => {
      const absoluteOffset = 20_000_000;
      const sizes = [40_000, 50_000, 10_000, 20_000];
      const expectedBuffer = Buffer.from([0, 45, 49, 1, 0, 64, 156, 0, 53, 12, 16, 39, 0, 226, 4]);

      const actualBuffer = encodeFragmentBitAligned(absoluteOffset, sizes);

      expect(actualBuffer).toBeDefined();
      expect(actualBuffer).toEqual(expectedBuffer);
    });
  });
});
