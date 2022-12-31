# Evaluating COMTiles

This repo compares COMTiles against other cloud optimized tile archive formats like PMTiles, Cotar and TileBase.  
There will be also a evaluation of possible improvements of the current COMTiles spec regarding size and decoding performance.

### Benchmark
Generate the test datasets via the [generateFragments](src/benchmark/generateFragments.ts) script.  
For benchmarking the decoding performance of COMTiles against other formats use the
[benchmark](src/benchmark/benchmark.ts) and [benchmark2](src/benchmark/benchmark2.ts) scripts.


