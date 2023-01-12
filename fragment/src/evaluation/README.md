# COMTiles Evaluation

In the following COMTiles is compared to PMTiles regarding the number of requests and the downloaded amount of data.  
The following two basic navigation patterns on a map are evaluated:  
- direct zooming into a specific location -> large cities like Munich, Berlin, Paris, ...
- exploring a large area on continet or planet base -> the evaluation is done for a continent (europe) and planet tileset.  

## Setup 

### Create continent and planet scale tile archives
The europe and planet tileset can be obtained from [MapTile](https://data.maptiler.com/downloads/planet/) for evaluation purposes.  
Use [@com-tiles/mbtiles-converter](https://github.com/mactrem/com-tiles/tree/main/packages/mbtiles-converter) to convert a MBTiles database to a COMTiles archive.  
Use [go-pmtiles](https://github.com/protomaps/go-pmtiles) to convert a MBTiles database to a PMTiles archive.

### MinIO setup
For serving the COMTiles and PMTiles test datasets MinIO can be used as an object storage.
The API of MinIO is compatible with the Amazon S3 cloud storage service.

To start a MinIO docker container run
```bash
docker run -p 9000:9000 -p 9001:9001 -v data:/data quay.io/minio/minio server /data --console-address ":9001" --address 0.0.0.0:9000
```

To open the console type `http://127.0.0.1:9001`  in the browser address bar with `minioadmin:minioadmin` as the default credentials.

### Modify Config
Insert the url to the generated tile archives hosted on an MinIO object storage in the [config](config.ts) file.

### Generate results
Transpile and run the ``index.ts`` file.

### Add additional tilesets to the evaluation
The [index.html](fetch-tiles/index.html) file can be used to navigate in a map and store
the indices of the downloaded tiles in a `loadedTiles` variable which can be accessed via the developer console.
To access the map a key for evaluation purpose has to be obtained from MapTiler and added to the ``index.html`` file.




