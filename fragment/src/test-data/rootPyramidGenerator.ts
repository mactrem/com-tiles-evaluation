import fs from "fs";
import { decodeDirectorySync, FileAPISource, PMTiles, zxyToTileId } from "../../../lib/pmtiles";
import { rleEncode, zigzagEncode } from "../comtiles/utils";
import * as path from "path";
import { compressPMTilesDirectory, convertDirectory, sortTilesOnHilbertCurve } from "./utils";
import { MBTilesRepository, TileInfoRecord } from "./mbTilesRepository";

const dataDir = "../data";

const pmTilesFileName = path.join(dataDir, "pmtiles/munich_root_directory.bin");

/* sorted on a hilbert curve but no encoding like delta or zig-zag applied to the root pyramid */
const rootPyramidHilbertOrderFileName = path.join(dataDir, "rootPyramidHilbertOrder.json");
/* row-major order of the tiles and no encoding like delta or zig-zag applied to the root pyramid */
const rootPyramidRowMajorOrderFileName = path.join(dataDir, "rootPyramidRowMajorOrder.json");
/* row-major order with delta and zig-zag encoding applied to the root pyramid */
const rootPyramidRowMajorDeltaZigZagCodedFileName = path.join(dataDir, "rootPyramidRowMajorDeltaZigZagCoded.json");
/* sorted on a hilbert curve and delta and zig-zag encoding applied to the root pyramid */
const rootPyramidHilbertDeltaZigZagCodedFileName = path.join(dataDir, "rootPyramidHilbertDeltaZigZagCoded.json");
/* sorted on a row-major curve and delta and rle coding applied to the root pyramid */
const rootPyramidRowMajorRLECodedFileName = path.join(dataDir, "rootPyramidRowMajorRLECoded.json");
/* sorted on a hilbert curve and delta and rle coding applied to the root pyramid */
const rootPyramidHilbertRLECodedFileName = path.join(dataDir, "rootPyramidHilbertRLECoded.json");

/* full PMTiles directory with 21k entries*/
const rootDirectoryHilbertOrderFileName = path.join(dataDir, "rootDirectoryHilbertOrder.json");

const pmTilesFile =
    "C:\\Users\\tremme_m\\Documents\\PMTiles\\go-pmtiles_2.0.1_Windows_x86_64 (1)\\protomaps_vector_planet_odbl_z10.pmtiles";

const pmTilesPyramidFileName = "../data/pmtiles/test_dataset_pyramid.json";

const maxZoom = 7;

class FileMock {
    private constructor(private readonly fd) {}

    static create(fileName: string) {
        return new Promise(resolve => {
            fs.open(fileName, "r", (err, fd) => {
                const fileMock = new FileMock(fd);
                resolve(fileMock);
            });
        });
    }

    slice(offset: number, length: number): Blob {
        const buffer = Buffer.alloc(length);
        fs.readSync(this.fd, buffer, 0, length, offset);
        const blob = new Blob(buffer);
        return blob;
    }

    /*slice(offset: number, length: number): Promise<Blob> {
        return new Promise(resolve => {
            const buffer = Buffer.alloc(length);
            fs.read(this.fd, buffer, offset, offset + length, null, (err, nread) => {
                if (err) throw err;

                const blob = new Blob(buffer);
                resolve(blob);
            });
        });
    }*/
}

class Blob {
    constructor(private blob: Buffer) {}
    arrayBuffer(): ArrayBuffer {
        return this.blob.buffer;
    }
}

(async () => {
    /*const repo = await MBTilesRepository.create(
        "C:\\Users\\tremme_m\\Documents\\PMTiles\\go-pmtiles_2.0.1_Windows_x86_64 (1)\\rootPyramid.mbtiles"
    );
    const tilesFromMBTiles = await repo.getByteLengthOfTilesByRowMajorOrder(maxZoom);*/
    //const tilesFromPMTiles = await fromPMTilesFile(pmTilesFile);
    /*
     * Tes datasets
     *  -> JSON Pyramid -> PMTiles planet zoom 10 test dataset -> PMTiles scheme -> 21845 tiles
     *  -> MBTiles Pyramid -> germany 0 to 7 -> 19377k tiles -> OpenMapTiles scheme
     * -> MBTiles -> order on Hilbert Curve
     * -> PMTiles
     *   -> Binary Directory
     *   -> JSON Directory -> reduce to TileInfoRecord Array
     *
     * */

    const json = fs.readFileSync(pmTilesPyramidFileName, "utf8");
    const maxId = zxyToTileId(8, 0, 0);
    const tilesFromPMTiles = JSON.parse(json);
    const [hilbertOrderedTiles, rowMajorOrderedTiles] = convertDirectory(tilesFromPMTiles);

    //const rowMajorOrderedTiles = tilesFromMBTiles;
    //const hilbertOrderedTiles = sortTilesOnHilbertCurve(tilesFromMBTiles);
    /*const directory = fs.readFileSync(pmTilesFileName).buffer;
    const pmTilesDirectory = decodeDirectorySync(directory);
    const [hilbertOrderedTiles, rowMajorOrderedTiles] = convertDirectory(pmTilesDirectory, maxZoom);*/
    /* const directory = fs.readFileSync(pmTilesFileName).buffer;
    const pmTilesDirectory = decodeDirectorySync(directory);
    const [hilbertOrderedTilesFromPMTiles, rowMajorOrderedTilesFromPMTiles] = convertDirectory(
        pmTilesDirectory,
        maxZoom
    );*/

    fs.writeFileSync(rootPyramidRowMajorOrderFileName, JSON.stringify(rowMajorOrderedTiles));
    fs.writeFileSync(rootPyramidHilbertOrderFileName, JSON.stringify(hilbertOrderedTiles));

    const deltaTilesRowMajor = deltaEncodeTiles(rowMajorOrderedTiles);
    fs.writeFileSync(rootPyramidRowMajorDeltaZigZagCodedFileName, JSON.stringify(deltaTilesRowMajor));

    const deltaTilesHilbert = deltaEncodeTiles(hilbertOrderedTiles);
    fs.writeFileSync(rootPyramidHilbertDeltaZigZagCodedFileName, JSON.stringify(deltaTilesHilbert));

    const rleEncodedTiles = rleEncode(hilbertOrderedTiles);
    const rleCodedSizes = rleEncodedTiles.flatMap(t => [t.runs, t.size]);
    fs.writeFileSync(rootPyramidHilbertRLECodedFileName, JSON.stringify(rleCodedSizes));

    const rleEncodedRowMajorTiles = rleEncode(rowMajorOrderedTiles);
    const rleCodedRowMajorSizes = rleEncodedRowMajorTiles.flatMap(t => [t.runs, t.size]);
    fs.writeFileSync(rootPyramidRowMajorRLECodedFileName, JSON.stringify(rleCodedRowMajorSizes));

    /*const [hilbertOrderedTilesDirectory] = convertDirectory(pmTilesDirectory, 8);
    fs.writeFileSync(rootDirectoryHilbertOrderFileName, JSON.stringify(hilbertOrderedTilesDirectory));*/

    //TODO: save files
    //const tiles = await fromPMTilesFile(pmTilesFile);
    //const hilbertOrderedTilesPMTiles = sortTilesOnHilbertCurve(tiles);
})();

async function fromPMTilesFile(fileName: string, maxZoom = 7): Promise<TileInfoRecord[]> {
    const file: any = await FileMock.create(fileName);
    const source = new FileAPISource(file);
    const pmTiles = new PMTiles(source);
    /*const header = await pmTiles.getHeader();
    const metadata = await pmTiles.getMetadata();*/

    const tiles: TileInfoRecord[] = [];
    for (let zoom = 0; zoom <= maxZoom; zoom++) {
        const maxRows = 2 ** zoom;
        const maxColumns = 2 ** zoom;
        for (let row = 0; row < maxRows; row++) {
            for (let column = 0; column < maxColumns; column++) {
                const size = (await pmTiles.getZxy(zoom, column, row)).data.byteLength;
                tiles.push({ zoom, column, row, size });
            }
        }
    }

    return tiles;
}

function deltaEncodeTiles(tiles: { size: number }[]): number[] {
    return tiles.reduce((p, c, i) => {
        const deltaValue = c.size - (i > 0 ? tiles[i - 1].size : 0);
        p.push({ ...c, size: zigzagEncode(deltaValue) });
        return p;
    }, []);
}
