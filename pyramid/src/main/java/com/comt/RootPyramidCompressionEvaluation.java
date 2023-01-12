package com.comt;

import com.comt.utils.TestOutputCatcher;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.primitives.Bytes;
import me.lemire.integercompression.*;
import org.apache.orc.impl.*;
import org.apache.orc.impl.writer.StreamOptions;
import org.apache.parquet.bytes.DirectByteBufferAllocator;
import org.apache.parquet.column.values.delta.DeltaBinaryPackingValuesWriterForInteger;
import org.apache.parquet.column.values.rle.RunLengthBitPackingHybridValuesWriter;
import java.io.*;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.Map;
import java.util.zip.GZIPOutputStream;

public class RootPyramidCompressionEvaluation {
    private static final Map<String, String> fileNames = Map.of("Row-Major Order", "../data/rootPyramidRowMajorOrder.json",
                                                                "Hilbert Order", "../data/rootPyramidHilbertOrder.json",
                                                                "Row-Major Order Delta Coded", "../data/rootPyramidRowMajorDeltaZigZagCoded.json",
                                                                "Hilbert Order Delta Coded", "../data/rootPyramidHilbertDeltaZigZagCoded.json",
                                                                "Hilbert Root Directory", "../data/rootDirectoryHilbertOrder.json");

    private static final Map<String, String> fileNamesRleCoded = Map.of("Row-Major Order RLE Coded", "../data/rootPyramidRowMajorRLECoded.json",
            "Hilbert Order Rle Coded", "../data/rootPyramidHilbertRLECoded.json");

    public static void main(String[] args) throws IOException {
        analyzeRootPyramid();
    }

    /*
    * -> Row-Major and Hilbert -> compare Varint, ORC, Parquet, FastPfor128, BP, NetPFD and OptPFD
    * -> Hilbert and Row-Major Delta and Zig-Zag coded -> compare Varint, ORC, Parquet, FastPfor128, BP, NetPFD and OptPFD
    *   -> any advantage when using delta encoding
    * -> Hilbert and Row-Major RLE Coded -> Varint, FastPfor128, BP, NetPFD and OptPFD
    *   -> using simple rle coding with byte and bit aligned encoding
    * -> Always using in addition Gzip on the results as additional column
    * */
    private static void analyzeRootPyramid() throws IOException {
        //TODO: use DeltaZigzagEncoding.Encoder for delta encoding -> DeltaZigzagVariableByte codec = new DeltaZigzagVariableByte();
        for(var fileNameEntry :  fileNames.entrySet()){
            final var fileName = fileNameEntry.getValue();
            InputStream inputStream = new FileInputStream(fileName);
            var tileInfoRecords = new ObjectMapper().readValue(inputStream, TileInfoRecord[].class);
            var tileSizes = Arrays.stream(tileInfoRecords).mapToInt(tileInfoRecord -> tileInfoRecord.size).toArray();

            var numEntries = tileSizes.length;
            System.out.println(String.format("%s: Num Entries: %s ---------------------------------------------------------------", fileNameEntry.getKey(), numEntries));
            final var orcRleEncodingBuffer = orcRleEncodingV1(tileSizes);
            final var orcRleEncodingGzipBuffer = gzipCompress(orcRleEncodingBuffer);
            System.out.println(String.format("ORC RLE V1 Encoding: %s kb, Gzip compresses: %s kb", orcRleEncodingBuffer.length, orcRleEncodingGzipBuffer.length));

            final var orcRleEncoding2Buffer = orcRleEncodingV2(tileSizes);
            final var orcRleEncoding2GzipBuffer = gzipCompress(orcRleEncodingBuffer);
            System.out.println(String.format("ORC RLE V2 Encoding: %s kb, Gzip compresses: %s kb", orcRleEncoding2Buffer.length, orcRleEncoding2GzipBuffer.length));

            final var parquetRleBuffer = parquetRLEBitpackingHybridEncoding(tileSizes);
            final var parquetRleGzipBuffer = gzipCompress(orcRleEncodingBuffer);
            System.out.println(String.format("Parquet RLE Bitpacking Hybrid Encoding: %s kb, Gzip compresses: %s kb",
                    parquetRleBuffer.length, parquetRleGzipBuffer.length));

            var comtRleValues = RunLengthIntegerEncoder.encode(tileSizes);
            System.out.println(String.format("COMT RLE Encoding: %s kb ", comtRleValues.size()));

            printEncodings(tileSizes);
        }

        for(var fileNameEntry : fileNamesRleCoded.entrySet()){
            final var fileName = fileNameEntry.getValue();
            InputStream inputStream = new FileInputStream(fileName);
            var rleEncodedTileSizes = new ObjectMapper().readValue(inputStream, int[].class);

            var numEntries = rleEncodedTileSizes.length;
            System.out.println(String.format("%s: numEntries: %s ---------------------------------------------------------------", fileNameEntry.getKey(), numEntries));
            printEncodings(rleEncodedTileSizes);
        }
    }

    private static void printEncodings(int[] tileSizes) throws IOException {
        final var gzipBuffer = gzipCompress(tileSizes);
        System.out.println(String.format("Gzip compressesed without encoding: %s kb", gzipBuffer.length));

        final var varintBuffer = varintEncode(tileSizes);
        final var varintGzipBuffer = gzipCompress(varintBuffer);
        System.out.println(String.format("Varint Encoding: %s kb, Gzip compresses: %s kb", varintBuffer.length, varintGzipBuffer.length));

        final var parquetDeltaSizeBuffer = parquetDeltaEncoding(tileSizes);
        final var parquetDeltaGzipSizeBuffer = gzipCompress(varintBuffer);
        System.out.println(String.format("Parquet Delta Encoding: %s kb, Gzip compresses: %s kb", parquetDeltaSizeBuffer.length, parquetDeltaGzipSizeBuffer.length));

        final var fastPfor128Size = fastPfor128Encode(tileSizes);
        System.out.println(String.format("FastPfor128 Encoding: %s kb", fastPfor128Size));

        final var binaryPackingPointSize = binaryPacking(tileSizes);
        System.out.println(String.format("Binary Packing Encoding: %s kb", binaryPackingPointSize));

        final var netPfdSize = netPFDEncode(tileSizes);
        System.out.println(String.format("NetPFD Encoding: %s kb", netPfdSize));

        final var optPfdSize = optPFDEncode(tileSizes);
        System.out.println(String.format("OptPFD Encoding: %s kb", optPfdSize));
    }

    public static byte[] gzipCompress(byte[] buffer) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        GZIPOutputStream gzipOut = new GZIPOutputStream(baos);
        gzipOut.write(buffer);
        gzipOut.close();
        baos.close();

        return baos.toByteArray();
    }

    public static byte[] gzipCompress(int[] buffer) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        GZIPOutputStream gzipOut = new GZIPOutputStream(baos);
        for(var i = 0; i < buffer.length; i++){
            ByteBuffer byteBuffer = ByteBuffer.allocate(4);
            byteBuffer.asIntBuffer().put(buffer[i]);

            byte[] array = byteBuffer.array();
            gzipOut.write(array[0]);
            gzipOut.write(array[1]);
            gzipOut.write(array[2]);
            gzipOut.write(array[3]);
        }
        gzipOut.close();
        baos.close();

        return baos.toByteArray();
    }

    public static byte[] varintEncode(int[] values) throws IOException {
        var variableByte = new VariableByte();
        var inputoffset = new IntWrapper(0);
        var outputoffset = new IntWrapper(0);
        var compressed = new byte[values.length * 4];
        variableByte.compress(values, inputoffset, values.length, compressed, outputoffset);
       return Arrays.copyOfRange(compressed, 0, outputoffset.intValue());
    }

    private static int fastPfor128Encode(int[] values){
        /*
         * Note that this does not use differential coding: if you are working on sorted * lists,
         * you should first compute deltas, @see me.lemire.integercompression.differential.Delta#delta
         * */
        //TODO: also test VectorFastPFOR -> patched version which should be faster

        var fastPfor = new FastPFOR128();
        IntWrapper inputoffset = new IntWrapper(0);
        IntWrapper outputoffset = new IntWrapper(0);
        var  compressed = new int[values.length * 4];
        fastPfor.compress(values, inputoffset, values.length, compressed, outputoffset);
        var totalSize = outputoffset.intValue()*4;
        return totalSize;
    }

    private static int binaryPacking(int[] values){
        IntWrapper inputoffset = new IntWrapper(0);
        IntWrapper outputoffset = new IntWrapper(0);
        int [] compressed = new int[values.length+1024];
        var binaryPacking = new BinaryPacking();
        binaryPacking.compress(values, inputoffset, values.length, compressed, outputoffset);
        var totalSize = outputoffset.intValue()*4;
        return totalSize;
    }

    private static int netPFDEncode(int[] values){
        var newPFD = new NewPFD();
        IntWrapper inputoffset = new IntWrapper(0);
        IntWrapper outputoffset = new IntWrapper(0);
        int [] compressed = new int[values.length+1024];
        newPFD.compress(values, inputoffset, values.length, compressed, outputoffset);
        return outputoffset.intValue()*4;
    }

    private static int optPFDEncode(int[] values){
        var optPFD = new OptPFD();
        IntWrapper inputoffset = new IntWrapper(0);
        IntWrapper outputoffset = new IntWrapper(0);
        int [] compressed = new int[values.length+1024];
        optPFD.compress(values, inputoffset, values.length, compressed, outputoffset);
        return outputoffset.intValue()*4;
    }

    private static byte[] parquetDeltaEncoding(int[] values) throws IOException {
        var blockSize = 128;
        var miniBlockNum = 4;
        var slabSize = 100;
        var pageSize = 30000;
        var writer = new DeltaBinaryPackingValuesWriterForInteger(
                blockSize, miniBlockNum, slabSize,  pageSize, new DirectByteBufferAllocator());

        for(var value : values){
            writer.writeInteger(value);
        }

        return writer.getBytes().toByteArray();
    }

    public static byte[] parquetRLEBitpackingHybridEncoding(int[] values) throws IOException {
        var maxValue = Arrays.stream(values).max().getAsInt();
        var bitWidth = (int)Math.ceil(Math.log(maxValue) + 1 );
        var initialCapacity = 1;
        var writer = new RunLengthBitPackingHybridValuesWriter(bitWidth, initialCapacity, 30000, new DirectByteBufferAllocator());

        for(var value : values){
            writer.writeInteger(value);
        }

        return writer.getBytes().toByteArray();
    }

    public static byte[] orcRleEncodingV1(int[] values) throws IOException {
        var signed = false;
        var testOutputCatcher = new TestOutputCatcher();
        var writer =
                new RunLengthIntegerWriter(new OutStream("test", new StreamOptions(1), testOutputCatcher), signed);

        for(var value: values) {
            writer.write(value);
        }

        writer.flush();
        return testOutputCatcher.getBuffer();
    }

    public static byte[] orcRleEncodingV2(int[] values) throws IOException {
        var signed = false;
        var testOutputCatcher = new TestOutputCatcher();
        var writer =
                new RunLengthIntegerWriterV2(new OutStream("test", new StreamOptions(1), testOutputCatcher), signed, false);

        for(var value: values) {
            writer.write(value);
        }

        writer.flush();
        return testOutputCatcher.getBuffer();
    }
}
