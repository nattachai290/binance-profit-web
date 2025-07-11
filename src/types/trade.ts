export type Trade = {
    symbol: string;
    id: number;
    orderId: number;
    orderListId: number;
    price: number;
    qty: number;
    quoteQty: number;
    commissionAsset: string;
    commission: number;
    time: number;
    isBuyer: boolean;
    isMaker: boolean;
    isBestMatch: boolean;
};

export type TradeResult = {
    sellId: number;
    buyId: number;
    profit: number;
    summarySell: number;
    summaryBuy: number;
    lastSellPrice: number;
    lastBuyPrice: number;
};

export type TradeHeader = {
    tradeResult: TradeResult[]
    hold: boolean;
};

export type AccountSummary = {
    makerCommission: number;
    takerCommission: number;
    buyerCommission: number;
    sellerCommission: number;
    commissionRates: {
        maker: string;
        taker: string;
        buyer: string;
        seller: string;
    };
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
    brokered: boolean;
    requireSelfTradePrevention: boolean;
    preventSor: boolean;
    updateTime: number;
    accountType: string;
    balances: {
        asset: string;
        free: string;
        locked: string;
    }[];
    permissions: string[];
    uid: number;
}

export type Earn = {
    asset: string;
    productId: string;
    autoSubscribe: boolean;
    canRedeem: boolean;
    collateralAmount: string;
    rewards: {
        cumulativeBonus: number;
        cumulativeRealTime: number;
        cumulativeTotal: number;
        yesterdayRealTime: number;
    };
    latestAnnualPercentageRate: number;
    totalAmount: number;
};

export type Price = {
    price : number;
    symbol : string;
}