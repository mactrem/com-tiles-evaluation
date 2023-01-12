Planet Scale Tile Pyramid Evaluation:    
-> 21889 index entries for zoom 0 to 7 -> 53k uncompressed  
-> Pyramid size -> 54.7 kb in test -> 22 kb with zip compression  
-> delta coding max value -> 262144 -> 18 bit without sign -> 19 bits with sign bit  
-> 90% -> 1638  
-> 32 values larger then 16 bit  
-> 346 values larger then 15 bit  
-> 1146 values larger then 14 bit -> 7% -> (16384 * 15 + 1146 * 19) / 8 -> 33k  
-> 2669 values larger then 13 bit
-> 2036 of 16384 run length > 1  