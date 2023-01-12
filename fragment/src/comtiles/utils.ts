import {encode} from "varint";
import {TileInfoRecord} from "../test-data/mbTilesRepository";

export function toBytesLE(num: number, numBytes = 5): Buffer {
    const buffer = Buffer.alloc(numBytes);
    const convert = numBytes <= 4 ? convertInt : convertBigInt;

    for (let bytePosition = 0; bytePosition < numBytes; bytePosition++) {
        buffer[bytePosition] = convert(bytePosition, num);
    }

    return buffer;
}

function convertInt(bytePosition: number, num: number): number {
    const numBitsToShift = bytePosition * 8;
    const mask = 0xff << numBitsToShift;
    return (num & mask) >> numBitsToShift;
}

function convertBigInt(bytePosition: number, num: number): number {
    /* Before a bitwise operation is performed, JavaScript converts numbers to 32 bits signed integers */
    const bigNum = BigInt(num);
    const numBitsToShift = BigInt(bytePosition * 8);
    const mask = BigInt(0xff) << numBitsToShift;
    return Number((bigNum & mask) >> numBitsToShift);
}

export function convertUInt40LEToNumber(buffer: Buffer, offset: number): number {
    return (buffer.readUInt32LE(offset + 1) << 8) + buffer.readUInt8(offset);
}

export function zigzagEncode(n: number): number {
    return (n >> 31) ^ (n << 1);
}

export function varintEncode(value: number): Buffer{
    const size = encode(value).length;
    const buffer = Buffer.alloc(size);
    encode(value, buffer);
    return buffer;
}

export function rleEncode(tiles: TileInfoRecord[]): {runs: number, size: number}[]{
    return tiles.reduce((p, c, i) => {
        const previousTile = p.at(-1);
        if (previousTile?.size !== c.size) {
            p.push({ runs: 1, size: c.size });
        } else {
            previousTile.runs = previousTile.runs + 1;
        }

        return p;
    }, []);
}
