import * as fs from "fs";
import Benchmark from "benchmark";
import { decodeDirectorySync } from "../../../lib/pmtiles";
import { fileNames } from "./testData";
import {
    decodeBitAlignedFragment,
    decodeBitAlignedFragmentArrayBased,
    decodeBitAlignedFragmentBranchless,
    decodeByteAlignedFragment
} from "../comtiles/fragmentDecoder";

const suiteRuns = 100;
const fileName = fileNames[0];
const pmTilesDirectory = fs.readFileSync(fileName.pmTiles).buffer;
const pmTilesSmallDirectory = fs.readFileSync(fileName.pmTilesSmallDirectory).buffer;
const comTilesSmallFragment = fs.readFileSync(fileName.comTiles);
const comTilesByteAlignedSmallFragment = fs.readFileSync(fileName.comTilesByteAlignedFragment);


/*
* Results COMTiles vs PMTiles ->
* */
const pmTilesSuiteName = "PMTiles directory decoding";
const pmTilesSmallDirectorySuiteName = "PMTiles small directory decoding";
const comTileSuiteName = "COMTiles bit aligned fragment decoding";

const comTilesBenchmarks = [];
const pmTilesBenchmarks = [];
for(let i = 0; i < suiteRuns; i++){
    new Benchmark.Suite()
        /*.add(pmTilesSmallDirectorySuiteName, () => {
            const directory = decodeDirectorySync(pmTilesSmallDirectory);
        })*/
        .add(pmTilesSuiteName, () => {
            const directory = decodeDirectorySync(pmTilesDirectory);
        })
        .add(comTileSuiteName, () => {
            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragment(comTilesSmallFragment);
        })
        /*.add("COMTiles byte aligned fragment decoding", () => {
            const [absoluteOffset, relativeOffsets] = decodeByteAlignedFragment(comTilesByteAlignedSmallFragment);
        })*/
        /*.add("COMTiles bit aligned fragment branchless decoding", () => {
            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragmentBranchless(comTilesSmallFragment);
        })*/
        /*.add(
            "PMTiles large directory sync decoding",
            async () => {
                const directory = await PMTiles.decompressDirectory(pmTilesDirectory);
                console.info(directory);
            },
            { async: true }
        )*/
        /*.add("COMTiles bit aligned fragment array based decoding", () => {
            const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragmentArrayBased(comTilesSmallFragment);
        })*/
        .on("cycle", event => console.info(String(event.target)))
        .on("complete", function() {
            const arr: any[] = Array.from(this);
            const comTilesBenchmark = arr.find(b => b.name.includes(comTileSuiteName));
            const pmTilesBenchmark = arr.find(b => b.name.includes(pmTilesSuiteName));
            //const pmTilesSmallDirectoryBenchmark = arr.find(b => b.name.includes(pmTilesSmallDirectorySuiteName));
            console.log("PMTiles mean decoding time: ", pmTilesBenchmark.stats.mean);
            console.log("COMTiles mean decoding time: ", comTilesBenchmark.stats.mean);
            console.log("COMTiles to PMTiles decoding performance ratio: ", comTilesBenchmark.hz / pmTilesBenchmark.hz);
            //console.log("COMTiles to PMTiles small directory decoding performance ratio: ", comTilesBenchmark.hz / pmTilesSmallDirectoryBenchmark.hz);
            comTilesBenchmarks.push(comTilesBenchmark.hz);
            pmTilesBenchmarks.push(pmTilesBenchmark.hz);
        })
        .run();
}

const comTilesAvgBenchmark = comTilesBenchmarks.reduce((p,c) => p + c, 0) / suiteRuns;
const pmTilesAvgBenchmark = pmTilesBenchmarks.reduce((p, c) => p + c, 0) / suiteRuns;
console.info("Avg COMTiles Benchmark: ", comTilesAvgBenchmark);
console.info("Avg PMTiles Benchmark: ", pmTilesAvgBenchmark);
console.info("COMTiles to PMTiles total decoding performance ratio: ", comTilesAvgBenchmark / pmTilesAvgBenchmark);

