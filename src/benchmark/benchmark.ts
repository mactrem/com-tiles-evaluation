import * as fs from "fs";
import Benchmark from "benchmark";
import {decodeDirectorySync} from "../pmtiles";
import { fileNames } from "./testData";
import {
    decodeBitAlignedFragment,
    decodeBitAlignedFragmentArrayBased,
    decodeBitAlignedFragmentBranchless,
    decodeByteAlignedFragment
} from "../comtiles/fragmentDecoder";

const fileName = fileNames[0];
const pmTilesDirectory = fs.readFileSync(fileName.pmTiles).buffer;
const comTilesSmallFragment = fs.readFileSync(fileName.comTiles);
const comTilesByteAlignedSmallFragment = fs.readFileSync(fileName.comTilesByteAlignedFragment);

new Benchmark.Suite()
    .add("COMTiles byte aligned fragment decoding", () => {
        const [absoluteOffset, relativeOffsets] = decodeByteAlignedFragment(comTilesByteAlignedSmallFragment);
    })
    .add("COMTiles bit aligned fragment decoding", () => {
        const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragment(comTilesSmallFragment);
    })
    .add("COMTiles bit aligned fragment branchless decoding", () => {
        const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragmentBranchless(comTilesSmallFragment);
    })
    .add("PMTiles large directory decoding", () => {

        const directory = decodeDirectorySync(pmTilesDirectory);
    })
    /*.add(
        "PMTiles large directory sync decoding",
        async () => {
            const directory = await PMTiles.decompressDirectory(pmTilesDirectory);
            console.info(directory);
        },
        { async: true }
    )*/
    .add("COMTiles bit aligned fragment array based decoding", () => {
        const [absoluteOffset, relativeOffsets] = decodeBitAlignedFragmentArrayBased(comTilesSmallFragment);
    })
    /*.add("branchless", async () => {
        for (let i = 1; i <= 10_000_000; i++) {
            arr[i] = i % 2;
        }
    })
    .add("branch based", async () => {
        for (let i = 1; i <= 10_000_000; i++) {
            arr2[i] = i % 2 === 0 ? 0 : 1;
        }
    })*/
    .on("cycle", event => console.info(String(event.target)))
    .run();
