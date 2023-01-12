import * as hilbertCurve from "hilbert-curve";
import * as fflate from "fflate";
import { TileInfoRecord } from "./mbTilesRepository";
import { tileIdToZxy } from "../../../lib/pmtiles";
import { varintEncode } from "../comtiles/utils";

export type HilbertTileInfoRecord = TileInfoRecord & { hilbertIndex: number };

export function convertDirectory(
    pmTilesRootDirectory: any,
    maxZoom = 7
): [hilbertOrderedTiles: TileInfoRecord[], rowMajorOrderedTiles: TileInfoRecord[]] {
    const hilbertOrderedTiles = pmTilesRootDirectory
        .filter(e => tileIdToZxy(e.tileId)[0] <= maxZoom)
        .flatMap(e => {
            let tileId = e.tileId;
            const t = [];
            for (let i = 0; i < e.runLength; i++) {
                const [zoom, column, row] = tileIdToZxy(tileId);
                const entry = { zoom, column, row, size: e.length };
                t.push(entry);
                tileId++;
            }
            return t;
        });

    const rowMajorOrderedTiles = [];
    for (let i = 0; i <= maxZoom; i++) {
        const tilesPerZoom = hilbertOrderedTiles
            .filter(t => t.zoom === i)
            .sort((a: any, b: any) => (a.row - b.row === 0 ? a.column - b.column : a.row - b.row));
        rowMajorOrderedTiles.push(...tilesPerZoom);
    }

    return [hilbertOrderedTiles, rowMajorOrderedTiles];
}

export function sortTilesOnHilbertCurve(tiles: readonly TileInfoRecord[], maxZoom = 7): HilbertTileInfoRecord[] {
    const hilbertTiles: HilbertTileInfoRecord[] = [];
    for (const tile of tiles) {
        const hilbertIndex = hilbertCurve.pointToIndex({ x: tile.column, y: tile.row }, tile.zoom);
        hilbertTiles.push({ ...tile, hilbertIndex });
    }

    const sortedTiles = [];
    for (let i = 0; i <= maxZoom; i++) {
        const tilesPerZoom = hilbertTiles.filter(t => t.zoom === i).sort((a, b) => a.hilbertIndex - b.hilbertIndex);
        sortedTiles.push(...tilesPerZoom);
    }

    return sortedTiles;
}

export type DirectoryEntry = {
    tileId: number;
    offset: number;
    length: number;
    runLength: number;
};
export function compressPMTilesDirectory(directory: DirectoryEntry[]) {
    const ids = [];
    let pId = 0;
    const offsets = [];
    let pOffsetLength = 0;
    directory.forEach(({ tileId, offset, length }, i) => {
        const deltaId = tileId - pId;
        ids.push(deltaId);
        pId = tileId;

        if (i > 0 && offset === pOffsetLength) {
            offsets.push(0);
        } else {
            offsets.push(offset + 1);
        }
        pOffsetLength = offset + length;
    });
    const runs = directory.map(e => e.runLength);
    const lengths = directory.map(e => e.length);

    const idsBuffer = varintEncodeNumbers(ids);
    const runsBuffer = varintEncodeNumbers(runs);
    const lengthsBuffer = varintEncodeNumbers(lengths);
    const offsetsBuffer = varintEncodeNumbers(offsets);

    const encodedDirectory = Buffer.concat([idsBuffer, runsBuffer, lengthsBuffer, offsetsBuffer]);
    return fflate.gzipSync(encodedDirectory);
}

function varintEncodeNumbers(values: number[]): Buffer {
    let valuesBuffer = Buffer.alloc(0);
    for (const value of values) {
        const varintValue = varintEncode(value);
        valuesBuffer = Buffer.concat([valuesBuffer, varintValue]);
    }

    return valuesBuffer;
}
