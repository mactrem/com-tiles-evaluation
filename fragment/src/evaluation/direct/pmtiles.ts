import {
    exploreEuropeTiles,
    explorePlanetTiles,
    istanbulTiles,
    londonTiles,
    munichTiles,
    newyorkTiles,
    parisTiles, rioTiles
} from "../config";
import {PMTiles, directoryInfo, clearDirectoryInfo} from "../../../../lib/pmtiles";

(async () => {
    const pmTilesEuropeUrl = "http://127.0.0.1:9002/data/planet.pmtiles?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=S3MZKFXRTD6HUBIB66KN%2F20230202%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230202T120812Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJTM01aS0ZYUlRENkhVQklCNjZLTiIsImV4cCI6MTY3NTM4Mjg4MCwicGFyZW50IjoibWluaW9hZG1pbiJ9.SelSsoWE2LTBZOOAN4C2RNBC7P8Okl2KyLyhFVMpRVFW95371rMmQjZYzg44PRT9P8HBFHYkX4YLe2zKaitI_w&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=896b5d6250f3b942e3caeb69bad33dda5739da261638d863d31db0342a351f00";
    const pmtiles = new PMTiles(pmTilesEuropeUrl);

    //9 directory fetches starting from zoom 0 -> for europe tileset -> directory has 4096 entries
    //size 9669 on average for 4096 entries with the initial directory -> 9.44 kb
    //Num total directory requests:  10 Directory size:  9668.56 Num entries:  4096 Num entries total:  4815.56
    //await requestTiles(pmtiles, munichTiles);

    //Num total directory requests:  13 Directory size:  9760.92 Num entries:  4096 Num entries total:  5156.17
    //await requestTiles(pmtiles, parisTiles);

    //Num total directory requests:  28 Directory size:  9556.78 Num entries:  4096 Num entries total:  5239.22
    //await requestExplorativeTiles(pmtiles, explorativeTiles);

    //Num total directory requests:  34 Directory size:  9406.67 Num entries:  4096 Num entries total:  7727.61
    //await requestExplorativeTiles(pmtiles, explorativeTiles2);

    /*const sum = directoryInfo.reduce((p, c) => {
        return {size: p.size + c.size, length: p.length + c.length, lengthTotal: p.lengthTotal + c.lengthTotal};
    }, {size: 0, length: 0, lengthTotal: 0});
    console.info("Num total directory requests: ", directoryInfo.length + 1,"Directory size: ", sum.size / directoryInfo.length,
        "Num entries: ", sum.length / directoryInfo.length, "Num entries total: ", sum.lengthTotal / directoryInfo.length);*/
})();

/**
 * - PMTiles loads on average for the 6 cities for a planet scale tileset when direct zooming in factor 3.22 more data
 *
 */
(async () => {
    const pmtilesPlanetUrl = "http://127.0.0.1:9002/data/planet.pmtiles?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=S3MZKFXRTD6HUBIB66KN%2F20230202%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230202T120812Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJTM01aS0ZYUlRENkhVQklCNjZLTiIsImV4cCI6MTY3NTM4Mjg4MCwicGFyZW50IjoibWluaW9hZG1pbiJ9.SelSsoWE2LTBZOOAN4C2RNBC7P8Okl2KyLyhFVMpRVFW95371rMmQjZYzg44PRT9P8HBFHYkX4YLe2zKaitI_w&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=896b5d6250f3b942e3caeb69bad33dda5739da261638d863d31db0342a351f00";
    const pmtiles = new PMTiles(pmtilesPlanetUrl);

    //Num total directory requests:  8 directories, 9 with root Directory size:  37047.38 Num entries:  16384 Num entries total:  19394.38
    //Factor 3.44 to COMTiles
    //await requestTiles(pmtiles, munichTiles);
    //evaluate();

    //Num total directory requests:  9 directories, 10 with root Directory size:  36588.56 Num entries:  16384 Num entries total:  20792.33
    //Factor 3.12 to COMTiles
    //await requestTiles(pmtiles, parisTiles);
    //evaluate();

    //Num total directory requests:  13 directories, 14 with root Directory size:  36658.46 Num entries:  16384 Num entries total:  26118.38
    //Factor 3.50 to COMTiles
    //PMTiles decoding takes about 109 milliseconds without root directory -> about 8.42 on average
    //await requestTiles(pmtiles, londonTiles);
    //evaluate();

    //Num total directory requests:  8 directories, 9 with root Directory size:  33579.13 Num entries:  16384 Num entries total:  75819
    //Factor 2.83 to COMTiles
    //await requestTiles(pmtiles, newyorkTiles);
    //evaluate();

    //Num total directory requests:  8 directories, 9 with root Directory size:  31227.75 Num entries:  16384 Num entries total:  60189.25
    //Factor 3.29 to COMTiles
    //await requestTiles(pmtiles, rioTiles);
    //evaluate();

    //Num total directory requests:  12 directories, 13 with root Directory size:  35325 Num entries:  16384 Num entries total:  24407.08
    //Factor 3.13 to COMTiles
    //await requestTiles(pmtiles, istanbulTiles);
    //evaluate();

    /* 10.67 number of request for the use case */


    //Num total directory requests:  21 directories, 22 with root Directory size:  35782 Num entries:  16384 Num entries total:  22698.24
    //Factor 2.84 to COMTiles
    //PMTiles has 4 requests less
    //await requestExplorativeTiles(pmtiles, explorativeTiles);
    //evaluate();

    //Num total directory requests:  32 directories, 33 root Directory size:  34377.63 Num entries:  16384 Num entries total:  35373.47
    //Factor 2.72 to COMTiles in size
    //PMTiles has 7 requests less
    //PMTiles has to handle 1.17 million index records -> COMTiles about 181k -> Factor 6.3 less data to handle
    //PMTiles takes about 180 milliseconds for decoding the directories -> about 5.6 milliseconds on average -> root directory is missing in this calculation
    //await requestExplorativeTiles(pmtiles, explorativeTiles2);
    //evaluate();

    /* 27.5 total average requests for both use cases */
})();

function evaluate(){
    const sum = directoryInfo.reduce((p, c) => {
        return {size: p.size + c.size, length: p.length + c.length, lengthTotal: p.lengthTotal + c.lengthTotal};
    }, {size: 0, length: 0, lengthTotal: 0});
    console.info("Num total directory requests: ", directoryInfo.length + 1,"Directory size: ", sum.size / directoryInfo.length,
        "Num entries: ", sum.length / directoryInfo.length, "Num entries total: ", sum.lengthTotal / directoryInfo.length);
    clearDirectoryInfo();
}

async function requestTiles(pmtiles, tiles){
    for(let zoom = 0; zoom <= 14; zoom++){
        const zoomTiles = tiles.filter(t => t.z  === zoom);
        for (const { x, y } of zoomTiles) {
            //console.time("fetch tile");
            const tile = await pmtiles.getZxy(zoom, x, y);
            //console.timeEnd("fetch tile");
            //console.info(zoom, x, y);
        }
    }
}

async function requestExplorativeTiles(pmtiles, tiles){
    for(const tileId of tiles){
        const tile = await pmtiles.getZxy( tileId.z, tileId.x, tileId.y);
        //console.info(tileId.z, tileId.x, tileId.y);
    }
}