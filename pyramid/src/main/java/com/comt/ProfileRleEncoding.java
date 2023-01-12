package com.comt;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

public class ProfileRleEncoding {
    private static String testFileName = "../data/rootPyramidHilbertOrder.json";

    public static void main(String[] args) throws IOException, InterruptedException {
        InputStream inputStream = new FileInputStream(testFileName);
        var tileInfoRecords = new ObjectMapper().readValue(inputStream, TileInfoRecord[].class);
        var tileSizes = Arrays.stream(tileInfoRecords).mapToInt(tileInfoRecord -> tileInfoRecord.size).toArray();
        var encodedValues = RunLengthIntegerEncoder.encode(tileSizes).stream().mapToInt(v -> v).toArray();
        byte[] encodedByteValues = new byte[encodedValues.length];
        for(var i = 0; i < encodedByteValues.length; i++){
            encodedByteValues[i] = (byte)encodedValues[i];
        }

        var numValues = tileSizes.length;
        for(var i = 0; i < 1000000; i++){
            Thread.sleep(1000);
            var a = profile(encodedByteValues, numValues);
        }

    }

    private static int[] profile(byte[] encodedByteValues, int numValues) throws IOException {
        return RunLengthIntegerEncoder.decode(encodedByteValues, numValues);
    }
    
}
