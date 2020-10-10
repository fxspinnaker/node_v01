# node_v01
MMBot

This Bot,
reads from Binance the symbols that were indicated on markets.js and creates Buy / Sell orders on Loopring.

To access the account at Loopring, you need to create the file credentials.js (use credentials.example.js as an example).

The file markets.js has 6 fields:
Binance Symbol
Loopring Symbol
Amount Token by order
Spread (price difference between Buy Limit and Sell Limit)
Additional Delta (tuning my final price Buy / Sell)
Inventory (not used at moment)


The Bot reads the Ask / Bid at Binance, calculates the average price (MidPrice).
Buy Limit Order = MidPrice - (Spread / 2) - AdditionalDelta
Sell Limit Order = MidPrice + (Spread / 2) + AdditionalDelta

It is optimized for the use of 1 market, however more can be placed, but the speed is much higher than that allowed by the Rate Limit in Loopring and this will eventually imply the block of the IP by Loopring and orders stop entering.

New versions will emerge ......


To run the Bot just "node app.js"
