import { toBytesLE } from "./utils";
import fragmentSettings from "./fragmentSettings";

//TODO: refactor -> Quick and dirty test implementation
export function encodeFragmentBitAligned(absoluteOffset: number, tileSizes: number[]): Buffer {
    const fragmentBitLength =
        fragmentSettings.absoluteOffsetBitWidth +
        tileSizes.length * fragmentSettings.bitAlignedFragment.indexEntryBitWidth;
    const fragmentByteLength = Math.ceil(fragmentBitLength / 8);
    const fragmentBuffer = Buffer.alloc(fragmentByteLength);

    const absoluteOffsetBuffer = toBytesLE(absoluteOffset, fragmentSettings.absoluteOffsetByteWidth);
    fragmentBuffer.fill(absoluteOffsetBuffer, 0, fragmentSettings.absoluteOffsetByteWidth);

    let bitCounter = fragmentSettings.absoluteOffsetBitWidth;
    let partialStartByte = false;
    for (let i = 0; i < tileSizes.length; i++) {
        const tileSize = tileSizes[i];
        if (tileSize > fragmentSettings.bitAlignedFragment.maxTileSize) {
            throw new Error(
                `Only tile size up to ${fragmentSettings.bitAlignedFragment.maxTileSize} is supported in the current implementation.`
            );
        }

        const byteStartIndex = Math.floor(bitCounter / 8);
        if (partialStartByte) {
            /*
             * Little endian order
             * 8 | 8 | 4
             * */
            const startByte = fragmentBuffer[byteStartIndex] | ((tileSize << 4) & 0xff);
            fragmentBuffer.writeUint8(startByte, byteStartIndex);
            const secondByte = (tileSize >> 4) & 0xff;
            fragmentBuffer.writeUint8(secondByte, byteStartIndex + 1);
            const thirdByte = tileSize >> 12;
            fragmentBuffer.writeUint8(thirdByte, byteStartIndex + 2);
        } else {
            /* 4 | 8 | 8 */
            const startByte = tileSize & 0xff;
            fragmentBuffer.writeUint8(startByte, byteStartIndex);
            const secondByte = (tileSize >> 8) & 0xff;
            fragmentBuffer.writeUint8(secondByte, byteStartIndex + 1);
            const thirdByte = tileSize >> 16;
            fragmentBuffer.writeUint8(thirdByte, byteStartIndex + 2);
        }

        bitCounter += fragmentSettings.bitAlignedFragment.indexEntryBitWidth;
        partialStartByte = !partialStartByte;
    }

    return fragmentBuffer;
}

//TODO: refactor -> Quick and dirty test implementation
export function encodeFragmentByteAligned(absoluteOffset: number, tileSizes: number[]): Buffer {
    const fragmentBitLength = fragmentSettings.absoluteOffsetBitWidth + tileSizes.length * 24;
    const fragmentByteLength = Math.ceil(fragmentBitLength / 8);
    const fragmentBuffer = Buffer.alloc(fragmentByteLength);

    const absoluteOffsetBuffer = toBytesLE(absoluteOffset, fragmentSettings.absoluteOffsetByteWidth);
    fragmentBuffer.fill(absoluteOffsetBuffer, 0, fragmentSettings.absoluteOffsetByteWidth);

    let fragmentBufferIndex = fragmentSettings.absoluteOffsetByteWidth;
    for (let i = 0; i < tileSizes.length; i++) {
        const tileSize = tileSizes[i];
        const startByte = tileSize & 0xff;
        fragmentBuffer.writeUint8(startByte, fragmentBufferIndex++);
        const secondByte = (tileSize >> 8) & 0xff;
        fragmentBuffer.writeUint8(secondByte, fragmentBufferIndex++);
        const thirdByte = tileSize >> 16;
        fragmentBuffer.writeUint8(thirdByte, fragmentBufferIndex++);
    }

    return fragmentBuffer;
}
