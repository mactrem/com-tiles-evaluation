/*
* Start decoding the index entries before the full index fragment has been fully downloaded.
* */
(async()=> {
  const url = "http://0.0.0.0:9000/comtiles/zurich.comt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=9ES5YD53TFZ9G1CSBYW7%2F20230103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230103T125308Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiI5RVM1WUQ1M1RGWjlHMUNTQllXNyIsImV4cCI6MTY3Mjc1Mzk4MiwicGFyZW50IjoibWluaW9hZG1pbiJ9.Kt3kks68KIirczfMkxuhYbgcO-wjGUctavFONp7gAuahw87keW8v0nqNPoHev2Aozu9kuo-0fa1g6JhKoB2efA&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=ac13fe67d3906c981a41f492d269c38fae23f217b22df1649aa1be1dd2ff7886";

  const numFragments = 10;
  const fragmentSize = 10245;
  for(let i = 0; i < numFragments; i++){
    const startOffset = i * fragmentSize;
    const endOffset = startOffset + fragmentSize - 1;
    const response = await fetch(url, {
      headers: {
        "range": `bytes=${startOffset}-${endOffset}`
      },
    });

    const reader = response.body.getReader();
    while(true){
      const {value: chunk, done} = await reader.read();

      if(done){
        break;
      }

      console.info(chunk.length);
    }

  }

})();
