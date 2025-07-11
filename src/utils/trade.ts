import {Trade, TradeHeader, TradeResult} from '@/types/trade';

export function calculateProfit(trades: Trade[]): TradeHeader {
    const tradeResults: TradeResult[] = [];
    let totalUSD = 0;
    let sellSum = 0;
    let buySum = 0;
    let lastSell = false;
    let lastSellId = 0;
    let lastBuyId = 0;
    let hold = false;
    let lastSellPrice = 0;
    let lastBuyPrice = 0;

    trades.sort((a, b) => a.id - b.id);

    for (const trade of trades) {
        const usd = Number(trade.quoteQty);

        if (trade.isBuyer) {
            if (lastSell) {
                hold = false;
                tradeResults.push({
                    sellId: lastSellId,
                    buyId: lastBuyId,
                    profit: totalUSD * -1,
                    summarySell: sellSum,
                    summaryBuy: buySum,
                    lastSellPrice: lastSellPrice,
                    lastBuyPrice: lastBuyPrice,
                });
                [totalUSD, sellSum, buySum, lastSell] = [0, 0, 0, false];
            }
            totalUSD += usd;
            buySum += usd;
            lastBuyId = trade.id;
            hold = true;
            lastBuyPrice = buySum
        } else {
            lastSell = true;
            lastSellId = trade.id;
            if (trade.commissionAsset == 'FDUSD') {
                totalUSD = totalUSD - (usd - Number(trade.commission));
            } else {
                totalUSD = totalUSD - usd;
            }
            sellSum += usd;
            lastSellPrice = sellSum
        }
    }
    if (lastSell) {
        hold = false;
        tradeResults.push({
            sellId: lastSellId,
            lastSellPrice: lastSellPrice,
            buyId: lastBuyId,
            lastBuyPrice: lastBuyPrice,
            profit: totalUSD * -1,
            summarySell: sellSum,
            summaryBuy: buySum,
        });
    }
    return {hold, tradeResult: tradeResults};
}