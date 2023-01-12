import fs from "fs";
import path from "path";
import * as fflate from "fflate";
import { decodeDirectorySync } from "../../../lib/pmtiles";
import { rleEncode, varintEncode } from "../comtiles/utils";
import { convertDirectory } from "../test-data/utils";

const dataDir = "../data";
const pmTilesFileName = path.join(dataDir, "pmtiles/munich_root_directory.bin");

/*
 * Encodes a root pyramid from zoom 0 to 7 with the following combinations:
 * - Tile order -> hilbert and row-major
 * - Lightweight compression -> Varint and rle-encoded
 * - Compression -> Gzip
 * */
(async () => {
    const directory = fs.readFileSync(pmTilesFileName).buffer;
    const pmTilesDirectory = decodeDirectorySync(directory);
    const [hilbertOrderTiles, rowMajorOrderTiles] = convertDirectory(pmTilesDirectory);

    const rowMajorVarintBuffers = hilbertOrderTiles.map(t => varintEncode(t.size));
    const rowMajorVarintBuffer = Buffer.concat(rowMajorVarintBuffers);

    const hilbertVarintBuffers = hilbertOrderTiles.map(t => varintEncode(t.size));
    const hilbertVarintBuffer = Buffer.concat(hilbertVarintBuffers);

    const hilbertRleEncodedTiles = rleEncode(hilbertOrderTiles);
    const hilbertVarintRleBuffers = hilbertRleEncodedTiles.map(t =>
        Buffer.concat([varintEncode(t.runs), varintEncode(t.size)])
    );
    const hilbertVarintRleBuffer = Buffer.concat(hilbertVarintRleBuffers);

    const rowMajorRleEncodedTiles = rleEncode(rowMajorOrderTiles);
    const rowMajorVarintRleBuffers = rowMajorRleEncodedTiles.map(t =>
        Buffer.concat([varintEncode(t.runs), varintEncode(t.size)])
    );
    const rowMajorVarintRleBuffer = Buffer.concat(rowMajorVarintRleBuffers);

    const rowMajorGzipBuffer = fflate.gzipSync(rowMajorVarintBuffer);
    const hilbertGzipBuffer = fflate.gzipSync(hilbertVarintBuffer);
    const rowMajorRleGzipBuffer = fflate.gzipSync(rowMajorVarintRleBuffer);
    const hilbertRleGzipBuffer = fflate.gzipSync(hilbertVarintRleBuffer);

    console.table([
        ["Row-Major Order, Varint Encoded", rowMajorVarintBuffer.length],
        ["Hilbert Order, Varint Encoded", hilbertVarintBuffer.length],
        ["Row-Major Order, Varint And RLE Encoded", rowMajorVarintRleBuffer.length],
        ["Hilbert Order, Varint And RLE Encoded", hilbertVarintRleBuffer.length],
        ["Row-Major Order, Varint Encoded, Gzip compressed", rowMajorGzipBuffer.length],
        ["Hilbert Order, Varint Encoded, Gzip compressed", hilbertGzipBuffer.length],
        ["Row-Major Order, Varint and RLE Encoded, Gzip compressed", rowMajorRleGzipBuffer.length],
        ["Hilbert Order, Varint and RLE Encoded, Gzip compressed", hilbertRleGzipBuffer.length]
    ]);
})();
