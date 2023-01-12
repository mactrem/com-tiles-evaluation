# Evaluating COMTiles 

This project evaluates the lazy loading of COMTiles index fragments with 
the approaches of the other tile archive formats like PMTiles, Cotar and TileBase. 

### Benchmark
Generate the test datasets via the [generateFragments](src/benchmark/generateFragments.ts) script.  
For benchmarking the decoding performance of COMTiles against other formats use the
[benchmark](src/benchmark/benchmark.ts) and [benchmark2](src/benchmark/benchmark2.ts) scripts.

### Generate test data for the root pyramid analysis

### Evaluation
The [evaluation](src/evaluation) project is comparing COMTiles with other cloud optimized tile archives like PMTiles 
regarding the number of requests and the downloaded amount of data for different navigation patterns.

### Benchmark
Under [benchmark](src/benchmark) the decoding performance of COMTiles with other cloud optimized tile archive formats is benchmarked.

### Fragment encoder and decoder
Under [comtiles](src/comtiles) the new experimental v2 COMTiles encoder and decoder can be found.
The difference to v1 is that now index fragments are bitpacked reducing the size of a fragment
from 37kb to 10kb.  
There are also some test with streaming decoding of index fragments.



