import {ComtCache} from "../../../../lib/comtiles/packages/provider/src/index";
import {
    munichTiles,
    parisTiles,
    londonTiles,
    newyorkTiles,
    rioTiles,
    istanbulTiles,
    explorePlanetTiles,
    exploreEuropeTiles
} from "../config";

const url = "https://comtiles.s3.eu-central-1.amazonaws.com/planet-new.comt?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEF8aDGV1LWNlbnRyYWwtMSJHMEUCIGdevpoe6ehJM%2FO%2BhRBVBe9JB2q9satMeqtbiqGmsuzJAiEAoHvENXi4re0gSYDG5ym9g7Qs5CzCaDBuFHUMd%2Fv5fiQq7QII2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAEGgw0MDAyNTczNTMwOTEiDB5mlBjy3%2BIfVOmZHCrBAnDS2ihKmgUHLhvLrRfLeGGNFhASGVqJskYQoxHHyhdXmfTY9THHgYcZ4BA6mFKQjiSpRSVjJVXLu6PIDDnCz7QS6P5Vxdptc9nyvwpNRC8Bcpc2H0D2mi462FKFlLi8NajNRvDMhvcw5CJH3kz6nkNc%2BdL%2BAg7Zk8rdXXawT8GY0dXENdbgKcTSbknchb9pyCOA%2BfiBxrqQelZernfePR6tUlZDXMbX9P6tyCr%2FlOx4SAlkMMSudeh%2BZ6zAosjyba3o6bQEaxNNICIOnB1sAzZ85tOQ0MWy4%2Fcd1Sy2aJbNQPB5iVRm8BYH46%2BpYs4yP3nzw%2BHL9mCmEgQc2jI0HM20Vis3fvcE9JVnSksuhi1UWK5aAlGr4g4t8lMaukLn%2FwAHE454veEx%2Br9HswkAJgIIK4WWW5jUkzWG4AAHDFaP1zDHl%2B%2BeBjqzAiFeCzZ%2Fb8LfgE5D%2BbVhkrpb6MS9WDzn7OlaNGbWTOQC1mB5GsvHp2Gqq2b4iLtn65tfu78KvvrAgQeVq9HKeP%2BwwawEN6SuE8a1M07CrFshBedegS9bPLctx86OGNS3YJvPs1rySvEHVE%2BN1sxUcPUMpbd4AdTunzlJVrmv458HV0lR20wbonBWY3ca2ha9veHk%2BhoXKEz6T2wXkmQ3OViUEgrzVJ4vG2tqtDOV59GLx%2FHlaciPqh%2B3XJKkY5CJ5PrWwrbZIdTq8SLwrqquDbCX1E3OQztSKf8GaAFpbQhxXRUqLgOHkDL1xLNMWC4QBEDUgTB04pc4ibZktQPtdtD5LgnxJpnoFvnsq9be%2B5cu6UsEqoUkgz1DrL9sEOdnnFkTwMo7ehF1g5ICWxKxfkeVlDk%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230202T151303Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Credential=ASIAV2MJSQWBVTXU2EBK%2F20230202%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Signature=5fc21a4edf3da416022f356e3709cabdad07022c2c9f152fc52600f5b19d4125";
const cache = ComtCache.createSync(url);

/* Size of a index fragment with version 2 of COMTiles. Every index entry is bitpacked with a bit width of 20 bits. */
const fragmentSize = 5 + Math.ceil(4096 * 20 / 8);
(async () => {
    //7 fragment requests -> 8 total
    await requestTiles(munichTiles);
    const loadedFragments = cache.loadedFragments;
    console.info(loadedFragments);
    cache.clearLoadedFragments();

    //9 fragment requests -> 10 total
    //await requestTiles(parisTiles);

    //12 fragment requests -> 13 total
    //await requestTiles(londonTiles);

    //8 fragment requests -> 9 total
    //await requestTiles(newyorkTiles);

    //6 fragment requests -> 7 total
    //await requestTiles(rioTiles);

    //12 fragment requests -> 13 total
    //await requestTiles(istanbulTiles);

    /* average 9 fragment requests per session for direct zoom use case -> 1.3 request per zoom -> 111 kb
    * average 10 total requests per session
    * */


    /*-------------------------------------------------------------------------------------- */

    //25 fragment requests -> Explore Europe -> pan from Munich to Berlin to Paris to London
    //await requestExplorativeTiles(explorativeTiles);

    //39 fragment requests -> Explore Europe and US -> pan from Munich to Berlin to Paris to London to NewYork to LasVegas
    //await requestExplorativeTiles(explorativeTiles2);

    /* 33 total average requests for both use cases */
})();

async function requestTiles(tiles){
    for(let zoom = 0; zoom <= 14; zoom++){
        const zoomTiles = tiles.filter(t => t.z  === zoom);
        for (const { x, y } of zoomTiles) {
            //console.time("fetch tile");
            const tile = await cache.getTile({ x, y, z: zoom});
            //console.timeEnd("fetch tile");
            //console.info(zoom, x, y);
        }
    }
}

async function requestExplorativeTiles(tiles){
    for(const tileId of tiles){
        const tile = await cache.getTile({ x: tileId.x, y: tileId.y, z: tileId.z});
        //console.info(tileId.z, tileId.x, tileId.y);
    }
}

