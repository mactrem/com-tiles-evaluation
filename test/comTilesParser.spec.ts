import { encodeFragmentBitAligned } from "../dist/comtiles/fragmentEncoder";
import { decodeBitAlignedFragmentArrayBased } from "../dist/comtiles/fragmentDecoder";

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

    describe("decodeFragment", () => {
        it("should decode fragment", () => {
            const expectedAbsoluteOffset = 20_000_000;
            const sizes = [40_000, 50_000, 10_000, 20_000];
            const expectedRelativeTileOffsets = [
                0,
                ...sizes.slice(0, sizes.length - 1).reduce((offsets, tileSize) => {
                    const currentOffset = offsets.length === 0 ? tileSize : offsets.at(-1) + tileSize;
                    offsets.push(currentOffset);
                    return offsets;
                }, [])
            ];
            const buffer = encodeFragmentBitAligned(expectedAbsoluteOffset, sizes);

            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragmentArrayBased(buffer, sizes.length);

            expect(absoluteOffset).toEqual(expectedAbsoluteOffset);
            expect(relativeOffsets).toEqual(expectedRelativeTileOffsets);
        });
    });
});
