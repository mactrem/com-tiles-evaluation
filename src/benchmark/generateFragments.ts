import fs from "fs";
const PMTiles = require("../pmtiles");
import { encodeFragmentBitAligned, encodeFragmentByteAligned } from "../comtiles/fragmentEncoder";
import { fileNames } from "./testData";

(async () => {
    for (const fileName of fileNames) {
        const compressedDirectory = fs.readFileSync(fileName.pmTiles).buffer;
        const directory = await PMTiles.decompressDirectory(compressedDirectory);
        const absoluteOffset = directory[0].offset;
        const tileSizes = directory.map(e => e.length);

        const fragmentBuffer = encodeFragmentBitAligned(absoluteOffset, tileSizes);
        fs.writeFileSync(fileName.comTiles, fragmentBuffer);

        const fragmentByteAlignedBuffer = encodeFragmentByteAligned(absoluteOffset, tileSizes);
        fs.writeFileSync(fileName.comTilesByteAlignedFragment, fragmentByteAlignedBuffer);
    }
})();
