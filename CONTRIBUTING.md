
Starting a local MinIO instance∂:  
docker run -p 9000:9000 -p 9001:9001 -v data:/data quay.io/minio/minio server /data --console-address ":9001" --address 0.0.0.0:9000

PMTiles commands:  
./pmtiles convert test.mbtiles  test.pmtiles  
./pmtiles show file:// test.pmtiles

