# Evaluating COMTiles

This repo compares COMTiles against other cloud optimized tile archive formats like PMTiles, Cotar and TileBase. 
There will be also a evaluation of possible improvements of the current COMTiles spec regarding the index size and decoding performance.

## Project structure
- The [pyramid](pyramid) project compares different lightweight compression algorithms regarding compression ratio
  and decoding performance for the root pyramid of a COMTiles archive.
- The [lib](lib) folder contains modified library versions of the profiled cloud optimized tile archive formats 
  for the purpose of better profiling the formats.
- In the [data](data) folder there are selected test data sets for running the evaluation.
- The [fragment project](fragment) evaluates the lazy loading of COMTiles index fragments against
  the approaches of the other tile archive formats.


### Setup
- run ``npm install`` in ``lib/comtiles``
- run ``npm install`` in ``lib/pmtiles``
- run ``npm install`` in ``fragment``