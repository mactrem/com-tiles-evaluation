package com.comt;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.ArrayUtils;
import org.junit.jupiter.api.Test;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RunLengthIntegerEncoderTest {
    private static String testFileName = "../data/rootPyramidHilbertOrder.json";

    @Test
    void decode() throws IOException {
        /*
        * 5 -> literals
        * 10 -> rle
        * 1 -> literal
        * 5 -> rle
        * 200 -> literals
        * 3 -> rle
        * 500 -> literals
        * */

        var literals1 = IntStream.rangeClosed(0, 4).toArray();
        var rle1Value = 40000;
        var rle1 = new int[10];
        Arrays.fill(rle1, rle1Value);
        var literals2 = new int[]{20000};
        var rle2Value = 10000;
        var rle2 = new int[5];
        Arrays.fill(rle2, rle2Value);
        var literals3 = IntStream.rangeClosed(0, 199).toArray();
        var rle3Value = 50000;
        var rle3 = new int[3];
        Arrays.fill(rle3, rle3Value);
        var literals4 = IntStream.rangeClosed(0, 499).toArray();

        var values = ArrayUtils.addAll(literals1, rle1);
        values = ArrayUtils.addAll(values, literals2);
        values = ArrayUtils.addAll(values, rle2);
        values = ArrayUtils.addAll(values, literals3);
        values = ArrayUtils.addAll(values, rle3);
        values = ArrayUtils.addAll(values, literals4);

        var encodedValues = RunLengthIntegerEncoder.encode(values).stream().mapToInt(v -> v).toArray();

        byte[] encodedByteValues = new byte[encodedValues.length];
        for(var i = 0; i < encodedByteValues.length; i++){
            encodedByteValues[i] = (byte)encodedValues[i];
        }
        var decodedValues = RunLengthIntegerEncoder.decode(encodedByteValues, values.length);

        assertEquals(values.length, decodedValues.length);
        assertArrayEquals(values, decodedValues);
    }

    @Test
    void decode_EndsWithRleEncoding() throws IOException {
        /*
         * 5 -> literals
         * 10 -> rle
         * 1 -> literal
         * 5 -> rle
         * 200 -> literals
         * 3 -> rle
         * */

        var literals1 = IntStream.rangeClosed(0, 4).toArray();
        var rle1Value = 40000;
        var rle1 = new int[10];
        Arrays.fill(rle1, rle1Value);
        var literals2 = new int[]{20000};
        var rle2Value = 10000;
        var rle2 = new int[5];
        Arrays.fill(rle2, rle2Value);
        var literals3 = IntStream.rangeClosed(0, 199).toArray();
        var rle3Value = 50000;
        var rle3 = new int[3];
        Arrays.fill(rle3, rle3Value);

        var values = ArrayUtils.addAll(literals1, rle1);
        values = ArrayUtils.addAll(values, literals2);
        values = ArrayUtils.addAll(values, rle2);
        values = ArrayUtils.addAll(values, literals3);
        values = ArrayUtils.addAll(values, rle3);

        var encodedValues = RunLengthIntegerEncoder.encode(values).stream().mapToInt(v -> v).toArray();

        byte[] encodedByteValues = new byte[encodedValues.length];
        for(var i = 0; i < encodedByteValues.length; i++){
            encodedByteValues[i] = (byte)encodedValues[i];
        }
        var decodedValues = RunLengthIntegerEncoder.decode(encodedByteValues, values.length);

        assertEquals(values.length, decodedValues.length);
        assertArrayEquals(values, decodedValues);
    }

    @Test
    void decode_longRleRun() throws IOException {
        /*
         * 5 -> literals
         * 400 -> rle
         * 15 -> literals
         * */

        var literals1 = IntStream.rangeClosed(0, 4).toArray();
        var rle1Value = 40000;
        var rle1 = new int[400];
        Arrays.fill(rle1, rle1Value);
        var literals2 = IntStream.rangeClosed(0, 14).toArray();

        var values = ArrayUtils.addAll(literals1, rle1);
        values = ArrayUtils.addAll(values, literals2);

        var encodedValues = RunLengthIntegerEncoder.encode(values).stream().mapToInt(v -> v).toArray();

        byte[] encodedByteValues = new byte[encodedValues.length];
        for(var i = 0; i < encodedByteValues.length; i++){
            encodedByteValues[i] = (byte)encodedValues[i];
        }
        var decodedValues = RunLengthIntegerEncoder.decode(encodedByteValues, values.length);

        assertEquals(values.length, decodedValues.length);
        assertArrayEquals(values, decodedValues);
    }

    @Test
    void decode_TestData() throws IOException {
        InputStream inputStream = new FileInputStream(testFileName);
        var tileInfoRecords = new ObjectMapper().readValue(inputStream, TileInfoRecord[].class);
        var tileSizes = Arrays.stream(tileInfoRecords).mapToInt(tileInfoRecord -> tileInfoRecord.size).toArray();

        var encodedValues = RunLengthIntegerEncoder.encode(tileSizes).stream().mapToInt(v -> v).toArray();

        byte[] encodedByteValues = new byte[encodedValues.length];
        for(var i = 0; i < encodedByteValues.length; i++){
            encodedByteValues[i] = (byte)encodedValues[i];
        }
        var decodedValues = RunLengthIntegerEncoder.decode(encodedByteValues, tileSizes.length);

        assertEquals(tileSizes.length, decodedValues.length);
        assertArrayEquals(tileSizes, decodedValues);
    }

}
