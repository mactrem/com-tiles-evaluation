import * as fs from "fs";
const PMTiles = require("../pmtiles");
import { fileNames } from "./testData";
import { decodeBitAlignedFragment } from "../comtiles/fragmentDecoder";

(async () => {
    const fileName = fileNames[0];
    const pmTilesDirectory = fs.readFileSync(fileName.pmTiles).buffer;
    const comTilesSmallFragment = fs.readFileSync(fileName.comTiles);
    const numRuns = 100;
    const numDirectoryFetches = 8;

    const absolutePMTilesTimes = [];
    const absoluteCOMTilesTimes = [];
    for (let i = 0; i < numRuns; i++) {
        let absolutePMTilesTime = 0;
        for (let i = 0; i < numDirectoryFetches; i++) {
            const startTime = performance.now();
            const directory = await PMTiles.decompressDirectory(pmTilesDirectory);
            const endTime = performance.now() - startTime;
            absolutePMTilesTime += endTime;
        }
        absolutePMTilesTimes.push(absolutePMTilesTime);

        let absoluteCOMTilesTime = 0;
        for (let i = 0; i < numDirectoryFetches; i++) {
            const startTime = performance.now();
            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragment(comTilesSmallFragment);
            const endTime = performance.now() - startTime;
            absoluteCOMTilesTime += endTime;
        }
        absoluteCOMTilesTimes.push(absoluteCOMTilesTime);
    }

    const absolutePMTilesTime = absolutePMTilesTimes.reduce((p, c) => p + c, 0) / absolutePMTilesTimes.length;
    const absoluteCOMTilesTime = absoluteCOMTilesTimes.reduce((p, c) => p + c, 0) / absoluteCOMTilesTimes.length;
    const pmTilesTime = absolutePMTilesTime / numDirectoryFetches;
    const comTilesTime = absoluteCOMTilesTime / numDirectoryFetches;
    console.info(`PMTiles decoding time for ${numDirectoryFetches} runs: ${absolutePMTilesTimes[0]}`);
    console.info(`COMTiles decoding time for ${numDirectoryFetches} runs: ${absoluteCOMTilesTimes[0]}`);
    console.info(`PMTiles average decoding time for ${numDirectoryFetches} runs: ${absolutePMTilesTime}`);
    console.info(`COMTiles average decoding time for ${numDirectoryFetches} runs: ${absoluteCOMTilesTime}`);
    console.info("PMTiles decoding time: ", pmTilesTime);
    console.info("COMTiles decoding time: ", comTilesTime);
    console.info("Ratio: ", absolutePMTilesTime / absoluteCOMTilesTime);
})();
