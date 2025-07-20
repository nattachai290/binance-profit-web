'use client';

import React, {useEffect, useState} from 'react';
import {calculateProfit} from "@/utils/trade";
import {useRouter} from 'next/navigation';
import {useTradeStore} from '@/store/tradeStore';
import {CryptoIcon} from '@/assets/icons/crypto-icons/CoinIcon';
import {ProfitTotalChart} from '@/assets/chart/PortfolioChart';
import {AccountSummary, Price} from "@/types/trade";

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

    type FormattedNumberProps = {
        value: number;
        locale?: string;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
    }
    function FormattedNumber({ value, locale = 'en-US', minimumFractionDigits = 2, maximumFractionDigits = 2 }: FormattedNumberProps) {
        const formattedValue = new Intl.NumberFormat(locale, {
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(value);

        return <span>{formattedValue}</span>;
    }


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
            console.error(err);
            if (err instanceof Error) {
                setError('fetchTicker ' + err.message);
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
                        if (resp.rows[0]) {
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
                        }
                    })
            );
            const results = await Promise.all(promises);
            setSummaryData(prevData => {
                if (!prevData || prevData.length === 0) {
                    // If prevData is empty, create new data structure
                    return symbols.map(symbol => ({
                        symbol,
                        totalProfit: 0,
                        tradeCount: 0,
                        hold: false,
                        lastBuyPrice: 0,
                        lastSellPrice: 0,
                        balances: {
                            spot: {
                                asset: '',
                                free: 0,
                                locked: 0
                            },
                            earn: {
                                totalAmount: results.reduce((total, earnProduct) => {
                                    if (earnProduct && earnProduct.asset === removeTrailingFDUSD(symbol)) {
                                        return total + earnProduct.totalAmount;
                                    }
                                    return total;
                                }, 0)
                            }
                        }
                    }));
                }

                // If prevData exists, update earn balances
                return prevData.map(summary => ({
                    ...summary,
                    balances: {
                        ...summary.balances,
                        spot: {...summary.balances.spot},
                        earn: {
                            ...summary.balances.earn,
                            totalAmount: results.reduce((total, earnProduct) => {
                                if (earnProduct && earnProduct.asset === removeTrailingFDUSD(summary.symbol)) {
                                    return total + earnProduct.totalAmount;
                                }
                                return total;
                            }, 0)
                        }
                    }
                }));
            });

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError('fetchEarn ' + err.message);
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

            setSummaryData(prevData => {
                if (!prevData || prevData.length === 0) {
                    return symbols.map(symbol => ({
                        symbol,
                        totalProfit: 0,
                        tradeCount: 0,
                        hold: false,
                        lastBuyPrice: 0,
                        lastSellPrice: 0,
                        balances: {
                            spot: acc.balances.find(balance =>
                                balance.asset === removeTrailingFDUSD(symbol)
                            ) ? {
                                asset: acc.balances.find(balance =>
                                    balance.asset === removeTrailingFDUSD(symbol)
                                )!.asset,
                                free: parseFloat(acc.balances.find(balance =>
                                    balance.asset === removeTrailingFDUSD(symbol)
                                )!.free),
                                locked: parseFloat(acc.balances.find(balance =>
                                    balance.asset === removeTrailingFDUSD(symbol)
                                )!.locked)
                            } : {
                                asset: '',
                                free: 0,
                                locked: 0
                            },
                            earn: {
                                totalAmount: 0
                            }
                        }
                    }));
                }

                return prevData.map(summary => ({
                    ...summary,
                    balances: {
                        ...summary.balances,
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
                            ...summary.balances.earn
                        }
                    }
                }));
            });
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError('fetchSpot ' + err.message);
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
                            lastBuyPrice,
                            lastSellPrice
                        };
                    })
            );
            const results = await Promise.all(promises);
            setSummaryData(prevData => {
                if (!prevData || prevData.length === 0) {
                    // If prevData is empty, create new data structure
                    return results.map(result => ({
                        ...result,
                        balances: {
                            spot: {
                                asset: '',
                                free: 0,
                                locked: 0
                            },
                            earn: {
                                totalAmount: 0
                            }
                        }
                    }));
                }

                // If prevData exists, update trade data while preserving balances
                return prevData.map(summary => {
                    const newData = results.find(r => r.symbol === summary.symbol);
                    return newData ? {
                        ...summary,
                        ...newData,
                        balances: {
                            ...summary.balances,
                            spot: {...summary.balances.spot},
                            earn: {...summary.balances.earn}
                        }
                    } : summary;
                });
            });
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError('fetchTradeSummary ' + err.message);
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

        const balanceProfit = walletAmount - item.lastBuyPrice
        const netProfit = walletAmount > 10 ? (item.hold ? balanceProfit : (balanceProfit + item.lastSellPrice)) : 0
        const lastedSell = Math.floor(Number(item.lastSellPrice) * 100) / 100;

        return Number(sum) + Number(lastedSell) + Number(netProfit);
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
                    Total Profit: <FormattedNumber value={Math.floor(Number(totalOverallProfit)*100) /100}/>
                </p>
            </div>
            <ProfitTotalChart/>
            {/*<ProfitChart/>*/}
            <table className="w-full border-collapse">
                <thead>
                <tr className="bg-gray-50">
                    <th className="p-4 text-left border">Symbol</th>
                    {/*<th className="p-4 text-left border">Status</th>*/}
                    <th className="p-4 text-left border">Balance</th>
                    <th className="p-4 text-left border">Change</th>
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
                    const balanceProfit = walletAmount - item.lastBuyPrice
                    const amtBalanceProfit = walletAmount > 10 ? (item.hold ? Math.floor(Number(balanceProfit) * 100) / 100 : Math.floor(Number(balanceProfit + item.lastSellPrice) * 100) / 100) : 0

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
                            {/*<td className="p-4 border">{walletAmount > 10 ? 'Hold' : ''}</td>*/}
                            <td className="p-4 border">{Math.floor(Number(walletAmount) * 100) / 100}
                            </td>
                            <td className="p-4 border">
                                <span className={`font-bold ${
                                    amtBalanceProfit > 0
                                        ? 'text-green-600'
                                        : amtBalanceProfit < 0
                                            ? 'text-red-600'
                                            : 'text-black'
                                }`}>
                                    {amtBalanceProfit}
                                </span>
                            </td>
                            <td className={`p-4 border font-bold`}>
                                 <span className={`font-bold ${
                                     item.totalProfit > 0
                                         ? 'text-green-600'
                                         : item.totalProfit < 0
                                             ? 'text-red-600'
                                             : 'text-black'
                                 }`}>
                                     ${Math.floor(Number(item.totalProfit) * 100) / 100}
                                </span>

                            </td>
                            <td className={`p-4 border font-bold`}>
                                 <span className={`font-bold ${
                                     total > 0
                                         ? 'text-green-600'
                                         : total < 0
                                             ? 'text-red-600'
                                             : 'text-black'
                                 }`}>
                                      ${Math.floor(Number(total) * 100) / 100}
                                </span>

                            </td>
                            {/*<td className="p-4 border">{item.tradeCount}</td>*/}
                            <td className="p-4 border">{Math.floor(Number(item.lastBuyPrice) * 100) / 100}</td>
                            <td className="p-4 border">{Math.floor(Number(item.lastSellPrice) * 100) / 100}</td>
                            <td className="p-4 border">
                                <button
                                    onClick={() => handleViewDetails(item.symbol)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    );
}



