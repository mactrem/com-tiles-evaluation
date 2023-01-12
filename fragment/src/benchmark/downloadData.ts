/*
* Profile the latency for downloading data from AWS S3 and Cloudfront
* */

const s3Url = "https://comtiles.s3.eu-central-1.amazonaws.com/planet-new.comt?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFgaDGV1LWNlbnRyYWwtMSJHMEUCIEKXwAGUhO%2BS05%2BbaXLIaFunuNxC%2FBl4rDcCIsrB6GC6AiEAvioR71sgm4abPttsI4C0BX03gjs1B%2BERJzkHAIgs86gq7QII8f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAEGgw0MDAyNTczNTMwOTEiDOgdyOTkojoWFV3jhirBAhT8xOYpys4WqrrUIQT8RE%2Fi7Fbkbs69NVIUluIuFSf0Ua1ZYReK31wwAygenJkI1uFKnU7yNNL3Api7plVGP1UjKbVSRm%2BiIKveP812posMppOoRQe3mH1T3yahc7SggNUfLiZl8YhCvat6jaw%2FDtITyaFxP1HdEW6j8%2BO%2FFP9CKDJRxnfbliWgsuO%2B3cX5JCR6Z4LoF%2FLX3IQ0%2BWx9zrnePnNvhjRxesaFrlqzpikaPA%2F2pyW5B4mmvTp8NbgbS4a0h%2FPPosBq9E%2F4PlLl7SPbr8LpBmMeQQldk9yiSZSidvZdAiQhF%2F8YoGP257cvjZINU3928wlCEqlSAi09Z2sOHauJ8sS54rr3Yw1kvKsHLV%2BwBYfvTtmATc2ga5VRdM%2FANiGC6X0bRa1qPgxvC9ZvscucVa018doTTIpLtmhQ1zCblN6fBjqzArfmolpbqRDiRIqss5WmA1yUxktPW30CbekCFqQDczZTXrpbExib6GwgEcySk%2BZWOeG9VVpJoqz5HYFxz5hpZcFkK3ujjw5iyobKDxyTfrryxUE5bG4gDrgL9JS5o4UMccY16jEHyX359bQ8AdHR3SWeCWW7l0ZMi7CvBZgJBhr%2FglfFE1AMAttRYVfUTI0lV9nUs51CAtFeYZZ%2FrMMGpK4F8BhnN%2B67%2BH4kEoo6o6haBjU%2FTW7K%2BY0qRG0vU%2BV38I6%2B7C%2B26Tbo%2FjNHdPKGmWFoUYYUv1I3hG1Ohqf1keaW203umeUosF9wJ8ok6F8zYH0GpShuKiB6LhnBtolWR%2FP4h7TIQYN3gIndAX3uIE5jM47uCosLut%2FtK7G5hGgaCiSJfATaZuf2u09F6%2FiLmaWmCfA%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230223T162358Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1800&X-Amz-Credential=ASIAV2MJSQWBWEZ6BKEG%2F20230223%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Signature=02244238ebb49e7eecf02a798c36c44797a7f9e3ab1fa6062fd92f6be2966dda";
const cloudFrontUrl = "https://d14d1k17271nmx.cloudfront.net/planet-new.comt";
const numRuns = 110;
const chunkSize = 10_000;

/*
* AWS S3
* - Results for latency on a about 65 MBits connection -> 53.40, 54.41, 55.71, 56.16, 54.40, 54.54, 56.02, 58.64, 59.23, 58.39
* - Avg latency -> 56 milliseconds
*
* CloudFront
* - Results for latency on a about 65 MBits connection -> 39.90, 42.09, 41.17, 42.75, 42.70, 38.30, 38.70, 39.17, 41.16, 40.83
* - Avg latency -> 41 milliseconds
* */
(async() => {
    console.group("AWS S3 Latency");
    await profile(s3Url);
    console.groupEnd();

    console.group("AWS CloudFront Latency");
    await profile(cloudFrontUrl);
    console.groupEnd();
})();

async function profile(url: string){
    const absoluteLatency = [];
    let startRange = 0;
    let endRange = chunkSize - 1;
    for(let i = 0; i < numRuns; i++){
        const startTime = performance.now();

        const chunk = await fetch(url, {
            headers: {
                range: `bytes=${startRange}-${endRange}`,
            },
        });

        const totalTime = performance.now() - startTime;
        /* Let S3 and CloudFront warm up */
        if( i >= 10){
            absoluteLatency.push(totalTime);
        }
        const contentLength = chunk.headers.get("content-length");
        console.info("latency time: ", totalTime, "startRange: ", startRange, "endRange: ", endRange, "contentLength: ", contentLength);

        startRange = endRange + 1;
        endRange = startRange + chunkSize - 1;
    }

    const totalTime = absoluteLatency.reduce((p, c) => p + c, 0);
    console.info("Average Latency: ", totalTime / absoluteLatency.length);
}