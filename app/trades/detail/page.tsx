'use client';

import React from 'react';
import Link from 'next/link';
import {calculateProfit} from '@/utils/trade';
import {useTradeStore} from '@/store/tradeStore';
import {useSearchParams} from 'next/navigation';


export default function TradeDetail() {
    const searchParams = useSearchParams();
    const symbol = searchParams.get('symbol');
    const getSymbolTrades = useTradeStore(state => state.getSymbolTrades);

    if (!symbol) {
        return (
            <div className="p-4">
                <p>No symbol specified. Please return to summary page.</p>
                <Link
                    href="/"
                    className="mt-4 inline-block px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Back to Summary
                </Link>
            </div>
        );
    }

    const trades = getSymbolTrades(symbol);

    if (!trades) {
        return (
            <div className="p-4">
                <p>No trade data found. Please return to summary page.</p>
                <Link
                    href="/"
                    className="mt-4 inline-block px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Back to Summary
                </Link>
            </div>
        );
    }

    const sortedTrades = [...trades].sort((a, b) => b.id - a.id);
    const fifoResults = calculateProfit(trades).tradeResult;

    const createTradeMap = (key: keyof typeof fifoResults[0], idKey: 'sellId' | 'buyId') =>
        Object.fromEntries(fifoResults.map(p => [p[idKey], p[key]]));

    const profitRowMap = createTradeMap('profit', 'sellId');
    const summarySellMap = createTradeMap('summarySell', 'sellId');
    const summaryBuyMap = createTradeMap('summaryBuy', 'buyId');


    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-xl">Trade Details - {symbol}</h2>
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Back to Summary
                </Link>
            </div>

            <div className="mb-4">
                <span className="font-semibold">Total Profit: </span>
                ${fifoResults.reduce((sum, p) => sum + p.profit, 0).toFixed(2)}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">Side</th>
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Price</th>
                        <th className="p-2 border">Amount</th>
                        <th className="p-2 border">USD</th>
                        <th className="p-2 border">Profit</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedTrades.map((trade) => (
                        <tr key={trade.id} className={trade.isBuyer ? 'bg-green-50' : 'bg-red-50'}>
                            <td className="p-2 border">{trade.id}</td>
                            <td className="p-2 border">
                                {trade.isBuyer
                                    ? `Buy${summaryBuyMap[trade.id] ? ` [ ${Math.floor(Number(summaryBuyMap[trade.id]) * 100) / 100} ]` : ''}`
                                    : `Sell${summarySellMap[trade.id] ? ` [ ${Math.floor(Number(summarySellMap[trade.id]) * 100) / 100} ]` : ''}`
                                }
                            </td>
                            <td className="p-2 border">{new Date(trade.time).toLocaleString()}</td>
                            <td className="p-2 border">{trade.price}</td>
                            <td className="p-2 border">{trade.qty}</td>
                            <td className="p-2 border">{Number(trade.quoteQty).toFixed(2)}</td>
                            <td className="p-2 border">{profitRowMap[trade.id]?.toFixed(2) || ''}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>

    );
}