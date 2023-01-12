import fs from "fs";
import {decodeDirectory} from "../../../lib/pmtiles";
import { encodeFragmentBitAligned, encodeFragmentByteAligned } from "../comtiles/fragmentEncoder";
import { fileNames } from "./testData";

(async () => {
    for (const fileName of fileNames) {
        const compressedDirectory = fs.readFileSync(fileName.pmTiles).buffer;
        const directory = await decodeDirectory(compressedDirectory);
        const absoluteOffset = directory[0].offset;
        const tileSizes = directory.map(e => e.length);

        const fragmentBuffer = encodeFragmentBitAligned(absoluteOffset, tileSizes);
        fs.writeFileSync(fileName.comTiles, fragmentBuffer);

        const fragmentByteAlignedBuffer = encodeFragmentByteAligned(absoluteOffset, tileSizes);
        fs.writeFileSync(fileName.comTilesByteAlignedFragment, fragmentByteAlignedBuffer);

        analyzePyramid(directory);
    }
})();

function analyzePyramid(directory){
    const tileSizes = directory.flatMap(e => {
        const sizes = [];
        for(let i = 0; i < e.runLength; i++){
            sizes.push(e.length);
        }
        return sizes;
    });

    const pyramid = tileSizes.slice(0, 21889);
    const buffer = encodeFragmentBitAligned(directory[0].offset, pyramid);
    fs.writeFileSync("./data/comtiles/pyramid.bin", buffer);

    const deltaCodedPyramid = pyramid.map((entry, i) => entry - (i === 0 ? 0 : pyramid[i-1]));
    console.info(deltaCodedPyramid);
}
