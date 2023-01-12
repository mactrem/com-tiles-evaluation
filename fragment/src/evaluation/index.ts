import {ComtCache} from "../../../lib/comtiles/packages/provider/src";
import {PMTiles, directoryInfo, clearDirectoryInfo} from "../../../lib/pmtiles";
import {
    munichTiles,
    parisTiles,
    londonTiles,
    newyorkTiles,
    rioTiles,
    istanbulTiles,
    comTilesPlanetUrl,
    pmTilesPlanetUrl, pmTilesEuropeUrl, exploreEuropeTiles, explorePlanetTiles, comTilesEuropeUrl,
} from "./config";

const europeCities = ["Munich","Paris", "London"];
const cityTiles = new Map([
    ["Munich", munichTiles],
    ["Paris", parisTiles],
    ["London", londonTiles],
    ["NewYork", newyorkTiles],
    ["Rio", rioTiles],
    ["Istanbul", istanbulTiles],
]);
const explorativeTiles = new Map([
    ["Europe", exploreEuropeTiles],
    ["Planet", explorePlanetTiles],
]);

export const numEntriesRootPyramid = 21845;
export const numEntriesFragment = 4096;
/* Size of a index fragment with version 2 of COMTiles. Every index entry is bitpacked with a bit width of 20 bits. */
export const fragmentSize = 5 + Math.ceil(numEntriesFragment * 20 / 8);
/* size of the root pyramid with row-major order */
export const rootPyramidSize =  22_168;
//TODO: check again if this is the size of the root directory of a planet scale tileset
export const pmTilesRootDirectorySize = 16384;

(async () => {
    /*console.group("Zooming based navigation pattern");
    await evaluateZoomBasedNavigationPattern();
    console.groupEnd();*/

    console.group("Panning based navigation pattern");
    await evaluatePanningBaseNavigationPattern();
    console.groupEnd();
})();

async function evaluateZoomBasedNavigationPattern(){
    const indexFragmentsPlanet = {};
    const indexFragmentsEurope = {};
    const directoriesPlanet = {};
    const directoriesEurope= {};

    for(const [cityName, tiles] of cityTiles){
        const comtilesPlanet = ComtCache.createSync(comTilesPlanetUrl);
        const comtilesEurope = ComtCache.createSync(comTilesEuropeUrl);
        const pmtilesPlanet = new PMTiles(pmTilesPlanetUrl);
        const pmtilesEurope = new PMTiles(pmTilesEuropeUrl);

        const pmTilesTotalSizePlanet = await evaluatePMTiles(pmtilesPlanet, tiles, directoriesPlanet, cityName);
        await evaluateCOMTiles(comtilesPlanet, tiles, indexFragmentsPlanet, cityName, pmTilesTotalSizePlanet);

        if(isEurope(cityName)){
            const pmTilesTotalSizeEurope = await evaluatePMTiles(pmtilesEurope, tiles, directoriesEurope, cityName);
            await evaluateCOMTiles(comtilesEurope, tiles, indexFragmentsEurope, cityName, pmTilesTotalSizeEurope);
        }
    }

    console.group("PMTiles Planet");
    console.table(directoriesPlanet);
    console.groupEnd();

    console.group("COMTiles Planet ");
    console.table(indexFragmentsPlanet);
    console.groupEnd();

    console.group("PMTiles Europe");
    console.table(directoriesEurope);
    console.groupEnd();

    console.group("COMTiles Europe");
    console.table(indexFragmentsEurope);
    console.groupEnd();

    const calcAvg = (indexFragments, numCities) => Object.keys(indexFragments).map(k => indexFragments[k].compressionRatio).reduce((p, c) => p + c, 0) / numCities;
    const avgCompressionRatioPlanet = calcAvg(indexFragmentsPlanet, cityTiles.size);
    const avgCompressionRatioEurope = calcAvg(indexFragmentsEurope, europeCities.length);
    console.info("Average compression ratio between COMTiles and PMTiles for planet: ", avgCompressionRatioPlanet);
    console.info("Average compression ratio between COMTiles and PMTiles for europe: ", avgCompressionRatioEurope);
}

function isEurope(cityName: string){
    return europeCities.includes(cityName);
}

/*
*
* Europe
* -> COMTiles -> 26 requests -> 24 witch fragment batching
* -> PMTiles -> 22 requests
*
* Planet
* PMTiles -> 33
* COMTiles -> 40 requests -> 38 with fragment batching
*
* -> fragment batching currently not implemented but based on the resulting requested data
*    the stated savings for the number of requests can be applied to the total number of requests
* */
async function evaluatePanningBaseNavigationPattern(){
    const indexFragments = {};
    const directories = {};

    for(const [name, tiles] of explorativeTiles){
        console.group(name);

        const comtiles = ComtCache.createSync(comTilesPlanetUrl);
        const pmtilesPlanet = new PMTiles(pmTilesPlanetUrl);
        //const pmTilesTotalSize = await evaluatePMTiles(pmtilesPlanet, tiles, directories, name);
        const pmTilesTotalSize = 37_000;
        await evaluateCOMTiles(comtiles, tiles, indexFragments, name, pmTilesTotalSize);

        console.groupEnd();
    }

    console.group("PMTiles");
    console.table(directories);
    console.groupEnd();

    console.group("COMTiles");
    console.table(indexFragments);
    console.groupEnd();

    const avgCompressionRatioPlanet = Object.keys(indexFragments).map(k => indexFragments[k].compressionRatio).reduce((p, c) => p + c, 0) / explorativeTiles.size;
    console.info("Average compression ratio between COMTiles and PMTiles: ", avgCompressionRatioPlanet);
}

async function evaluatePMTiles(pmtiles, tiles, directories, cityName){
    await requestPMTilesDirectories(pmtiles, tiles);
    const pmTilesInfo = directoryInfo.reduce((p, c) => {
        return {size: p.size + c.size, length: p.length + c.length, lengthTotal: p.lengthTotal + c.lengthTotal};
    }, {size: 0, length: 0, lengthTotal: 0});
    const pmTilesTotalSize = pmTilesInfo.size + pmTilesRootDirectorySize;
    Object.assign(directories, {[cityName]: {
            numRequests: directoryInfo.length + 1,
            totalSize: pmTilesTotalSize,
            numEntries: pmTilesInfo.length,
            numTotalEntries: pmTilesInfo.lengthTotal
        }});
    clearDirectoryInfo();

    return pmTilesTotalSize;
}

async function evaluateCOMTiles(comtiles, tiles, indexFragments, name, pmTilesTotalSize){
    await requestCOMTilesFragments(comtiles, tiles);
    const loadedFragments = comtiles.loadedFragments;

    console.info(loadedFragments);


    const numFragments = loadedFragments.length;
    const comTilesTotalSize = numFragments * fragmentSize + rootPyramidSize;

    Object.assign(indexFragments, {[name]: {
            numRequests: numFragments + 1,
            totalSize: comTilesTotalSize,
            numEntries: (numEntriesRootPyramid + numFragments * numEntriesFragment),
            compressionRatio: pmTilesTotalSize / comTilesTotalSize
        }});
    comtiles.clearLoadedFragments();
}

async function requestCOMTilesFragments(comtiles: ComtCache, tiles){
    const tileRequest = (z, x , y) => comtiles.getTile({z, x, y});
    return requestTiles(tileRequest, tiles);
}

async function requestPMTilesDirectories(pmtiles: PMTiles, tiles){
    const tileRequest = pmtiles.getZxy.bind(pmtiles);
    return requestTiles(tileRequest, tiles);
}

/* Tiles has to be ordered by zoom ascending */
async function requestTiles(tileRequest, tiles){
    for(const tileId of tiles){
        await tileRequest(tileId.z, tileId.x, tileId.y);
    }
}

