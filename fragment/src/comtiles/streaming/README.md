# Streaming decoding

Evaluation of starting to decode the index entries before the full index fragment has been fully downloaded.

Test results of the chunk size when using fetch in combination with ReadableStream.  
The chunk size depends on the network conditions.  
On a fast 3G connection the chunk size is about 1.5 kb.
On an internet connection with 50 MBit/s, most of the time 10 kb only rather rare about 3.2 kb and 6.8 kb.