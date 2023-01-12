package comt;

import com.comt.RootPyramidCompressionEvaluation;
import com.comt.RunLengthIntegerEncoder;
import com.comt.TileInfoRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import me.lemire.integercompression.IntWrapper;
import me.lemire.integercompression.VariableByte;
import org.apache.orc.impl.*;
import org.apache.parquet.bytes.ByteBufferInputStream;
import org.apache.parquet.column.values.rle.RunLengthBitPackingHybridValuesReader;
import org.openjdk.jmh.annotations.*;
import java.io.*;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.Map;
import java.util.zip.GZIPInputStream;

@State(Scope.Benchmark)
public class RootPyramidDecodingBenchmarks {
    private static final Map<String, String> fileNames = Map.of("Row-Major Order", "../data/rootPyramidRowMajorOrder.json",
            "Hilbert Order", "../data/rootPyramidHilbertOrder.json",
            "Row-Major Order Delta Coded", "../data/rootPyramidRowMajorDeltaZigZagCoded.json",
            "Hilbert Order Delta Coded", "../data/rootPyramidHilbertDeltaZigZagCoded.json");

    private static final Map<String, String> fileNamesRleCoded = Map.of("Row-Major Order RLE Coded", "../data/rootPyramidRowMajorRLECoded.json",
            "Hilbert Order Rle Coded", "../data/rootPyramidHilbertRLECoded.json");

    private static int numIndexRecords;
    private static final String fileName = "../data/rootPyramidHilbertOrder.json";

    private static byte[] orcRleV1Buffer;
    private static byte[] orcRleV2Buffer;
    private static byte[] parquetBitpackingHybridBuffer;
    private static byte[] varintBuffer;
    private static byte[] comtRleBuffer;
    private static byte[] varintGzipBuffer;
    private static int bitWidth;

    @Setup(value = Level.Invocation)
    public void setUp() throws IOException {
        InputStream inputStream = new FileInputStream(fileName);
        var tileInfoRecords = new ObjectMapper().readValue(inputStream, TileInfoRecord[].class);
        var tileSizes = Arrays.stream(tileInfoRecords).mapToInt(tileInfoRecord -> tileInfoRecord.size).toArray();
        numIndexRecords = tileSizes.length;

        orcRleV1Buffer = RootPyramidCompressionEvaluation.orcRleEncodingV1(tileSizes);
        orcRleV2Buffer = RootPyramidCompressionEvaluation.orcRleEncodingV2(tileSizes);
        parquetBitpackingHybridBuffer = RootPyramidCompressionEvaluation.parquetRLEBitpackingHybridEncoding(tileSizes);
        varintBuffer = RootPyramidCompressionEvaluation.varintEncode(tileSizes);
        varintGzipBuffer = RootPyramidCompressionEvaluation.gzipCompress(varintBuffer);

        var comtRleBufferList = RunLengthIntegerEncoder.encode(tileSizes);
        comtRleBuffer = new byte[comtRleBufferList.size()];
        for(var i = 0; i < comtRleBuffer.length; i++){
            comtRleBuffer[i] = comtRleBufferList.get(i);
        }

        var maxValue = Arrays.stream(tileSizes).max().getAsInt();
        bitWidth = (int)Math.ceil(Math.log(maxValue) + 1 );
    }

    //@Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeVarint() throws IOException {
        //TODO: for best performance, use the ByteIntegerCODEC interface
        var variableByte = new VariableByte();
        var tileSizes = new int[numIndexRecords];
        variableByte.uncompress(varintBuffer, new IntWrapper(0), varintBuffer.length, tileSizes, new IntWrapper(0));
    }

    //@Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeVarintGzip() throws IOException {
        var baos = new ByteArrayInputStream(varintGzipBuffer);
        var gzipIn = new GZIPInputStream(baos);
        var varintEncodedTileSizes = gzipIn.readAllBytes();

        //TODO: for best performance, use the ByteIntegerCODEC interface
        var variableByte = new VariableByte();
        var tileSizes = new int[numIndexRecords];
        variableByte.uncompress(varintEncodedTileSizes, new IntWrapper(0), varintBuffer.length, tileSizes, new IntWrapper(0));
    }

    //@Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeOrcRleEncodingV1() throws IOException {
        var inStream = InStream.create
                ("test", new BufferChunk(ByteBuffer.wrap(orcRleV1Buffer), 0), 0, orcRleV1Buffer.length);
        var reader =
                new RunLengthIntegerReader(inStream, false);
        var sizes = new int[numIndexRecords];
        for(var i = 0; reader.hasNext(); i++){
            final var value = (int)reader.next();
            sizes[i] = value;
        }
    }

    //@Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
   public static void decodeOrcRleEncodingV2() throws IOException {
        var inStream = InStream.create
                ("test", new BufferChunk(ByteBuffer.wrap(orcRleV2Buffer), 0), 0, orcRleV2Buffer.length);
        var reader =
                new RunLengthIntegerReaderV2(inStream, false, false);
        var sizes = new int[numIndexRecords];
        for(var i = 0; reader.hasNext(); i++){
            final var value = (int)reader.next();
            sizes[i] = value;
        }
    }

    //@Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeParquetBitPackingHybrid() throws IOException {
        var reader = new RunLengthBitPackingHybridValuesReader(bitWidth);
        var tileSizes = new int[21387];
        reader.initFromPage(tileSizes.length, ByteBufferInputStream.wrap(ByteBuffer.wrap(parquetBitpackingHybridBuffer)));
        for(var i = 0; i < tileSizes.length; i++){
            var val = reader.readInteger();
            tileSizes[i] = val;
        }
    }

    @Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeComtRle(){
        var decodedSizes = RunLengthIntegerEncoder.decode(comtRleBuffer, numIndexRecords);
    }

    @Benchmark
    //@BenchmarkMode(Mode.AverageTime)
    //@BenchmarkMode(Mode.Throughput)
    @Fork(value = 1, warmups = 1)
    public static void decodeComtRleOptimized(){
        var decodedSizes = RunLengthIntegerEncoder.decodeOptimized(comtRleBuffer, numIndexRecords);
    }
}
