/*
* Start decoding the index entries before the full index fragment has been fully downloaded.
* */
(async() => {
  const url = "";

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
