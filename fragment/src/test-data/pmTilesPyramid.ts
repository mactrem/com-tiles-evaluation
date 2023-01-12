import fs from "fs";
import { zxyToTileId } from "../../../lib/pmtiles";
import { compressPMTilesDirectory } from "./utils";

const pmTilesPyramidFileName = "../data/pmtiles/test_dataset_pyramid.json";

/*
 * Filters directory entries for up to zoom level 7 and creates a new PMTiles directory
 * */
(async () => {
    const json = fs.readFileSync(pmTilesPyramidFileName, "utf8");
    const directory = JSON.parse(json);
    const maxId = zxyToTileId(8, 0, 0);

    const pyramid = directory.filter(d => d.tileId < maxId);
    const totalNumberOfEntries = pyramid.reduce((p, c) => c.runLength + p, 0);

    const compressDirectory = compressPMTilesDirectory(pyramid);
    console.info(
        "PMTiles directory size: ",
        compressDirectory.length,
        "Number of entries: ",
        pyramid.length,
        "Total number of entries: ",
        totalNumberOfEntries
    );
})();
