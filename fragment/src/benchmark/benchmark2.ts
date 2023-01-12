import * as fs from "fs";
import {decodeDirectory} from "../../../lib/pmtiles";
import { fileNames } from "./testData";
import { decodeBitAlignedFragment } from "../comtiles/fragmentDecoder";

(async () => {
    const fileName = fileNames[0];
    const pmTilesDirectory = fs.readFileSync(fileName.pmTiles).buffer;
    const comTilesSmallFragment = fs.readFileSync(fileName.comTiles);
    const numRuns = 100;
   /* const numDirectoryFetches = 10.67;
    const numFragmentFetches = 10.67;*/
    const numDirectoryFetches = 33;
    const numFragmentFetches = 40;

    const absolutePMTilesTimes = [];
    const absoluteCOMTilesTimes = [];
    for (let i = 0; i < numRuns; i++) {
        let absolutePMTilesTime = 0;
        for (let i = 0; i < numDirectoryFetches; i++) {
            const startTime = performance.now();
            const directory = await decodeDirectory(pmTilesDirectory);
            const endTime = performance.now() - startTime;
            //console.info("PMTiles decoding time: ", endTime);
            absolutePMTilesTime += endTime;
        }
        absolutePMTilesTimes.push(absolutePMTilesTime);

        let absoluteCOMTilesTime = 0;
        for (let i = 0; i < numFragmentFetches; i++) {
            const startTime = performance.now();
            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragment(comTilesSmallFragment);
            const endTime = performance.now() - startTime;
            //console.info("COMTiles decoding time: ", endTime);
            absoluteCOMTilesTime += endTime;
        }
        absoluteCOMTilesTimes.push(absoluteCOMTilesTime);
    }

    const absolutePMTilesTime = absolutePMTilesTimes.reduce((p, c) => p + c, 0) / absolutePMTilesTimes.length;
    const absoluteCOMTilesTime = absoluteCOMTilesTimes.reduce((p, c) => p + c, 0) / absoluteCOMTilesTimes.length;
    const pmTilesTime = absolutePMTilesTime / numDirectoryFetches;
    const comTilesTime = absoluteCOMTilesTime / numFragmentFetches;
    console.info(`PMTiles first (unoptimized) decoding time for ${numDirectoryFetches} runs: ${absolutePMTilesTimes[0]}`);
    console.info(`COMTiles first (unoptimized) decoding time for ${numFragmentFetches} runs: ${absoluteCOMTilesTimes[0]}`);
    console.info(`PMTiles average decoding time for ${numDirectoryFetches} runs: ${absolutePMTilesTime}`);
    console.info(`COMTiles average decoding time for ${numFragmentFetches} runs: ${absoluteCOMTilesTime}`);
    console.info("PMTiles average decoding time per zoom: ", pmTilesTime);
    console.info("COMTiles average decoding time per zoom: ", comTilesTime);
    console.info("Ratio: ", absolutePMTilesTime / absoluteCOMTilesTime);
})();
