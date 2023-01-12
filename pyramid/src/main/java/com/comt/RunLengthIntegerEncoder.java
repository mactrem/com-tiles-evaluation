package com.comt;

import com.google.common.primitives.Bytes;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/*
* Modified version of the ORC RLE V1 encoding
* */
public class RunLengthIntegerEncoder {

    /*
    * -> Literals
    *   -> Header -> 0x80 to 0xff -> corresponds to the negative of number of literals in the sequence
    *   -> Varint encoded values
    * -> Runs
    *   -> Header -> 0x00 to 0x7f -> encodes the length of the run - 3
    *   -> Varint encoded value
    *
    * */
    //TODO: use ByteBuffer and return byte array
    public static List<Byte> encode(int[] values) throws IOException {
        var encodedValuesBuffer = new ArrayList<Byte>();
        var literals = new ArrayList<Integer>();
        var runs = new ArrayList<Integer>();
        for(var i = 0; i < values.length; i++){
            var value = values[i];

            if(literals.size() == 0x7f){
                addLiteralsToBuffer(encodedValuesBuffer, literals);
                literals.clear();
            }
            /* if there is a sequence of 127 runs or a literal sequence begins store the runs */
            else if(runs.size() == 0x7f ||(runs.size() >= 3 && values[i-1] != value)){
                addRunsToBuffer(encodedValuesBuffer, runs);
                runs.clear();
            }
            /* store literals and transfer to runs*/
            else if(literals.size() >= 2 && values[i-2] == value && values[i-1] == value && runs.size() == 0){
                var numLiterals = literals.size() -2;
                if(numLiterals > 0){
                    addLiteralsToBuffer(encodedValuesBuffer, literals.subList(0, numLiterals));
                }
                literals.clear();

                runs.add(values[i-2]);
                runs.add(values[i-1]);
            }

            if(i == values.length -1){
                if(runs.size() > 1){
                    runs.add(value);
                    addRunsToBuffer(encodedValuesBuffer, runs);
                    runs.clear();
                }
                else{
                    literals.add(value);
                    addLiteralsToBuffer(encodedValuesBuffer, literals);
                    literals.clear();
                }
            }
            else if(runs.size() > 0){
                runs.add(value);
            }
            else{
                literals.add(value);
            }
        }

        return encodedValuesBuffer;
    }

    private static void addLiteralsToBuffer(List<Byte> buffer, List<Integer> literals) throws IOException {
        /**
         * Literals start with an initial byte of 0x80 to 0xff,
         * which corresponds to the negative of number of literals in the sequence.
         * Following the header byte, the list of N varints is encoded
         */
        var header = (byte)(256 - literals.size());
        buffer.add(header);
        var encodedValues = literals.stream().mapToInt(k->k).toArray();
        var varintEncodedLiterals = varintEncode(encodedValues);
        buffer.addAll(Bytes.asList(varintEncodedLiterals));
    }

    private static void addRunsToBuffer(List<Byte> buffer, List<Integer> runs) throws IOException {
        /**
         * Runs start with an initial byte of 0x00 to 0x7f, which encodes the length of the run - 3.
         * The value of the run is encoded as a base 128 varint.
         * */
        var header = (byte)(runs.size() - 3);
        buffer.add(header);
        var varintEncodedRun = varintEncode(new int[]{runs.get(0)});
        buffer.addAll(Bytes.asList(varintEncodedRun));
    }

    public static int[] decode(byte[] rleEncodedBuffer, int numValues){
        var decodedValues = new int[numValues];

        var valuesCounter = 0;
        for(var i = 0; i < rleEncodedBuffer.length;){
            var header = rleEncodedBuffer[i] & 0xFF;
            i++;

            /* runs start with an initial byte of 0x00 to 0x7f */
            if(header <= 0x7f){
                var numRuns = header + 3;

                var varint = decodeVarint(rleEncodedBuffer, i);
                i = varint[0];
                for(var j = 0; j < numRuns; j++){
                    decodedValues[valuesCounter++] = varint[1];
                }
            }
            else{
                /* Literals start with an initial byte of 0x80 to 0xff, which corresponds to the negative of number of literals in the sequence */
                var numLiterals = 256 - header;

                for(var j = 0; j < numLiterals; j++){
                    i = decodeVarint(rleEncodedBuffer, i, decodedValues, valuesCounter++);
                }
            }
        }

        return decodedValues;
    }

    public static int[] decodeOptimized(byte[] rleEncodedBuffer, int numValues){
        var decodedValues = new int[numValues];

        var valuesCounter = 0;
        for(var i = 0; i < rleEncodedBuffer.length;){
            var header = rleEncodedBuffer[i] & 0xFF;
            i++;

            /* runs start with an initial byte of 0x00 to 0x7f */
            if(header <= 0x7f){
                var numRuns = header + 3;

                var varint = decodeVarintOptimized(rleEncodedBuffer, i);
                i = varint[0];
                for(var j = 0; j < numRuns; j++){
                    decodedValues[valuesCounter++] = varint[1];
                }
            }
            else{
                /* Literals start with an initial byte of 0x80 to 0xff, which corresponds to the negative of number of literals in the sequence */
                var numLiterals = 256 - header;

                for(var j = 0; j < numLiterals; j++){
                    i = decodeVarintOptimized(rleEncodedBuffer, i, decodedValues, valuesCounter++);
                }
            }
        }

        return decodedValues;
    }


    //Source: https://github.com/bazelbuild/bazel/blob/master/src/main/java/com/google/devtools/build/lib/util/VarInt.java
    /**
     * Reads a varint from src, places its values into the first element of dst and returns the offset
     * in to src of the first byte after the varint.
     *
     * @param src source buffer to retrieve from
     * @param offset offset within src
     * @param dst the resulting int value
     * @param dstOffset offset within dst
     * @return the updated offset after reading the varint
     */
    public static int decodeVarint(byte[] src, int offset, int[] dst, int dstOffset) {
        int result = 0;
        int shift = 0;
        int b;
        do {
            // Get 7 bits from next byte
            b = src[offset++];
            result |= (b & 0x7F) << shift;
            shift += 7;
        } while ((b & 0x80) != 0);
        dst[dstOffset] = result;
        return offset;
    }

    public static int decodeVarintOptimized(byte[] src, int offset, int[] dst, int dstOffset) {
        /*
        * Max 4 bytes supported.
        * */
        var b= src[offset++];
        var value = b & 0x7f;
        if ((b & 0x80) == 0) {
            dst[dstOffset] = value;
            return offset;
        }

        b = src[offset++];
        value |= (b & 0x7f) << 7;
        if ((b & 0x80) == 0) {
            dst[dstOffset] = value;
            return offset;
        }

        b = src[offset++];
        value |= (b & 0x7f) << 14;
        if ((b & 0x80) == 0) {
            dst[dstOffset] = value;
            return offset;
        }

        b = src[offset++];
        value |= (b & 0x7f) << 21;
        dst[dstOffset] = value;
        return offset;
    }

    //Source: https://github.com/bazelbuild/bazel/blob/master/src/main/java/com/google/devtools/build/lib/util/VarInt.java
    public static int [] decodeVarint(byte[] src, int offset) {
        int result = 0;
        int shift = 0;
        int b;
        do {
            // Get 7 bits from next byte
            b = src[offset++];
            result |= (b & 0x7F) << shift;
            shift += 7;
        } while ((b & 0x80) != 0);
        return new int[]{offset, result};
    }

    public static int [] decodeVarintOptimized(byte[] src, int offset) {
        /*
         * Max 4 bytes supported.
         * */
        var b= src[offset++];
        var value = b & 0x7f;
        if ((b & 0x80) == 0) {
            return new int[]{offset, value};
        }

        b = src[offset++];
        value |= (b & 0x7f) << 7;
        if ((b & 0x80) == 0) {
            return new int[]{offset, value};
        }

        b = src[offset++];
        value |= (b & 0x7f) << 14;
        if ((b & 0x80) == 0) {
            return new int[]{offset, value};
        }

        b = src[offset++];
        value |= (b & 0x7f) << 21;
        return new int[]{offset, value};
    }

    //Source: https://github.com/bazelbuild/bazel/blob/master/src/main/java/com/google/devtools/build/lib/util/VarInt.java
    private static byte[] varintEncode(int[] values) {
        var varintBuffer = new byte[values.length * 4];
        var i = 0;
        for(var value : values){
            i = putVarInt(value, varintBuffer, i);
        }
        return Arrays.copyOfRange(varintBuffer, 0, i);
    }

    //Source: https://github.com/bazelbuild/bazel/blob/master/src/main/java/com/google/devtools/build/lib/util/VarInt.java
    /**
     * Encodes an integer in a variable-length encoding, 7 bits per byte, into a destination byte[],
     * following the protocol buffer convention.
     *
     * @param v the int value to write to sink
     * @param sink the sink buffer to write to
     * @param offset the offset within sink to begin writing
     * @return the updated offset after writing the varint
     */
    public static int putVarInt(int v, byte[] sink, int offset) {
        do {
            // Encode next 7 bits + terminator bit
            int bits = v & 0x7F;
            v >>>= 7;
            byte b = (byte) (bits + ((v != 0) ? 0x80 : 0));
            sink[offset++] = b;
        } while (v != 0);
        return offset;
    }

}
