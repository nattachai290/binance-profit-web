'use client';

import React, {useEffect, useState} from 'react';
import {calculateProfit} from "@/utils/trade";
import {useRouter} from 'next/navigation';
import {useTradeStore} from '@/store/tradeStore';
import {CryptoIcon} from '@/assets/icons/crypto-icons/CoinIcon';
import {ProfitTotalChart} from '@/assets/chart/PortfolioChart';
import {AccountSummary, Price} from "@/types/trade";
import {Suspense} from 'react'

type SummaryData = {
    symbol: string;
    totalProfit: number;
    tradeCount: number;
    lastBuyPrice: number;
    lastSellPrice: number;
    hold: boolean;
    balances: {
        spot: {
            asset: string;
            free: number;
            locked: number;
        },
        earn: {
            totalAmount: number;
        }
    }
};

const symbols = ['ADAFDUSD', 'BNBFDUSD', 'BTCFDUSD', 'DOGEFDUSD', 'DOTFDUSD', 'POLFDUSD', 'ETHFDUSD', 'GALAFDUSD', 'NEARFDUSD', 'SANDFDUSD', 'SHIBFDUSD', 'UNIFDUSD'];
// const symbols = ['ADAFDUSD','BNBFDUSD'];

export default function TradeSummary() {
    const router = useRouter();
    const setSymbolData = useTradeStore(state => state.setSymbolData);
    const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [prices, setPrices] = useState<Price[]>([]);


    const handleSync = () => {
        setLoading(true);
        setError(null);
        fetchTradeSummary();
        fetchSpot();
        fetchEarn();
        fetchTicker();
    };

    useEffect(() => {
        void fetchTradeSummary();
        void fetchSpot();
        void fetchEarn();
        void fetchTicker();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeTrailingFDUSD = (asset: string) => {
        return asset.replace('FDUSD', '');
    };

    async function fetchTicker() {
        try {
            const symbolString = `["${symbols.join('","')}"]`;
            const req = await fetch(`/api/ticker?symbols=${symbolString}`);
            if (!req.ok) throw new Error(`Error ${req.status}`);

            const resp: Price[] = await req.json();
            setPrices(resp);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchEarn() {
        try {
            const promises = symbols.map(asset =>
                fetch(`/api/account/earn?asset=${asset.replace('FDUSD', '')}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Error ${res.status}`);
                        return res.json();
                    })
                    .then(resp => {
                        return {
                            asset: resp.rows[0].asset,
                            productId: resp.rows[0].productId,
                            autoSubscribe: resp.rows[0].autoSubscribe,
                            canRedeem: resp.rows[0].canRedeem,
                            collateralAmount: resp.rows[0].collateralAmount,
                            rewards: {
                                cumulativeBonus: resp.rows[0].cumulativeBonusRewards,
                                cumulativeRealTime: resp.rows[0].cumulativeRealTimeRewards,
                                cumulativeTotal: resp.rows[0].cumulativeTotalRewards,
                                yesterdayRealTime: resp.rows[0].yesterdayRealTimeRewards
                            },
                            latestAnnualPercentageRate: resp.rows[0].latestAnnualPercentageRate,
                            totalAmount: resp.rows[0].totalAmount
                        };
                    })
            );
            const results = await Promise.all(promises);
            setSummaryData(prevData => prevData.map(summary => ({
                ...summary,
                balances: {
                    ...summary.balances,
                    earn: {
                        totalAmount: results.reduce((total, earnProduct) => {
                            if (earnProduct && earnProduct.asset === removeTrailingFDUSD(summary.symbol)) {
                                return total + parseFloat(earnProduct.totalAmount);
                            }
                            return total;
                        }, 0)
                    }
                }
            })));
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }

        } finally {
            setLoading(false);
        }
    }


    async function fetchSpot() {
        try {
            const res = await fetch(`/api/account/spot`);
            if (!res.ok) throw new Error(`Error ${res.status}`);

            const acc: AccountSummary = await res.json();

            setSummaryData(prevData => prevData.map(summary => ({
                ...summary,
                balances: {
                    spot: acc.balances.find(balance =>
                        balance.asset === removeTrailingFDUSD(summary.symbol)
                    ) ? {
                        asset: acc.balances.find(balance =>
                            balance.asset === removeTrailingFDUSD(summary.symbol)
                        )!.asset,
                        free: parseFloat(acc.balances.find(balance =>
                            balance.asset === removeTrailingFDUSD(summary.symbol)
                        )!.free),
                        locked: parseFloat(acc.balances.find(balance =>
                            balance.asset === removeTrailingFDUSD(summary.symbol)
                        )!.locked)
                    } : {
                        asset: '',
                        free: 0,
                        locked: 0
                    },
                    earn: {
                        ...summary.balances.earn,
                    }
                }
            })));


        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }

        } finally {
            setLoading(false);
        }
    }


    async function fetchTradeSummary() {
        try {
            const promises = symbols.map(symbol =>
                fetch(`/api/trades?symbol=${symbol}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Error ${res.status}`);
                        return res.json();
                    })
                    .then(trades => {
                        setSymbolData(symbol, trades);
                        const profitResults = calculateProfit(trades);
                        const existingBalances = summaryData?.find(s => s.symbol === symbol)?.balances;

                        const lastBuyPrice = profitResults.tradeResult.reduce((acc, trade) => {
                            return trade.buyId > acc.maxId
                                ? {maxId: trade.buyId, price: trade.lastBuyPrice}
                                : acc;
                        }, {maxId: 0, price: 0}).price;

                        const lastSellPrice = profitResults.tradeResult.reduce((acc, trade) => {
                            return trade.sellId > acc.maxId
                                ? {maxId: trade.sellId, price: trade.lastSellPrice}
                                : acc;
                        }, {maxId: 0, price: 0}).price;


                        return {
                            symbol,
                            totalProfit: profitResults.tradeResult.reduce((sum, p) => sum + p.profit, 0),
                            tradeCount: trades.length,
                            hold: profitResults.hold,
                            lastBuyPrice: lastBuyPrice,
                            lastSellPrice: lastSellPrice,
                            balances: existingBalances || {
                                spot: {
                                    asset: '', free: 0, locked: 0
                                }, earn: {
                                    totalAmount: 0
                                }
                            }
                        };
                    })
            );
            const results = await Promise.all(promises);
            setSummaryData(results);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }

        } finally {
            setLoading(false);
        }
    }


    const handleViewDetails = (symbol: string) => {
        router.push(`/trades/detail?symbol=${symbol}`);
    };

    if (loading) return <p>Loading summaries...</p>;
    if (error) return <p>Error: {error}</p>;

    const totalOverallProfit = summaryData.reduce((sum, item) => {
        const matchingPrice = prices.find(p => p.symbol === item.symbol)?.price || 0;
        const spotValue = (Number(matchingPrice) * Number(item.balances.spot.free)) +
            (Number(matchingPrice) * Number(item.balances.spot.locked));
        const earnValue = Number(matchingPrice) * Number(item.balances.earn.totalAmount);
        const walletAmount = spotValue + earnValue;
        const total = walletAmount + Number(item.totalProfit);
        return sum + total;
    }, 0);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xl">Trade Summary</h2>
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center gap-2"
                >
                    {loading ? 'Syncing...' : 'Sync'}
                </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Overall Summary</h3>
                <p className="text-xl font-bold text-blue-600">
                    Total Profit: ${totalOverallProfit.toFixed(2)}
                </p>
            </div>
            <ProfitTotalChart/>
            <table className="w-full border-collapse">
                <thead>
                <tr className="bg-gray-50">
                    <th className="p-4 text-left border">Symbol</th>
                    <th className="p-4 text-left border">Status</th>
                    <th className="p-4 text-left border">Balance</th>
                    <th className="p-4 text-left border">Trade Profit</th>
                    <th className="p-4 text-left border">Total Profit</th>
                    {/*<th className="p-4 text-left border">Total Trades</th>*/}
                    <th className="p-4 text-left border">Last Buy</th>
                    <th className="p-4 text-left border">Last Sell</th>
                    <th className="p-4 text-left border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {summaryData.map((item) => {
                    const matchingPrice = prices.find(p => p.symbol === item.symbol)?.price || 0;
                    const walletAmount = (Number(matchingPrice) * Number(item.balances.spot.free)) + (Number(matchingPrice) * Number(item.balances.spot.locked)) + (Number(matchingPrice) * Number(item.balances.earn.totalAmount))
                    const total = Number(walletAmount) + Number(item.totalProfit);

                    return (
                        <tr key={item.symbol} className="hover:bg-gray-50">
                            <td className="p-4 border">
                                <div className="flex items-center gap-2">
                                    <CryptoIcon
                                        symbol={item.symbol}
                                        className="w-6 h-6"
                                    />
                                    <span>{item.symbol.replace('FDUSD', '')}</span>
                                </div>
                            </td>
                            <td className="p-4 border">{walletAmount > 10 ? 'Hold' : ''}</td>
                            <td className="p-4 border">{Math.floor(Number(walletAmount) * 100) / 100}</td>
                            <td className={`p-4 border font-bold ${
                                total > 0
                                    ? 'text-green-600'
                                    : total < 0
                                        ? 'text-red-600'
                                        : 'text-black'
                            }`}>
                                ${Math.floor(Number(item.totalProfit) * 100) / 100}
                            </td>
                            <td className={`p-4 border font-bold ${
                                total > 0
                                    ? 'text-green-600'
                                    : total < 0
                                        ? 'text-red-600'
                                        : 'text-black'
                            }`}>
                                ${Math.floor(Number(total) * 100) / 100}
                            </td>
                            {/*<td className="p-4 border">{item.tradeCount}</td>*/}
                            <td className="p-4 border">{Math.floor(Number(item.lastBuyPrice) * 100) / 100}</td>
                            <td className="p-4 border">{Math.floor(Number(item.lastSellPrice) * 100) / 100}</td>
                            <td className="p-4 border">
                                <Suspense>
                                    <button
                                        onClick={() => handleViewDetails(item.symbol)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </Suspense>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    );
}



