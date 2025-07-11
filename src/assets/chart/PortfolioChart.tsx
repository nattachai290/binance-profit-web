'use client';

import React, {useEffect, useState} from 'react';
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {useTradeStore} from '@/store/tradeStore';
import {calculateProfit} from '@/utils/trade';

type Point = {
    date: string;
    profit: number;
};

export function ProfitTotalChart() {
    const [dataPoints, setDataPoints] = useState<Point[]>([]);
    const symbolData = useTradeStore(state => state.symbolData);

    useEffect(() => {

        const combined: { [date: string]: number } = {};
        symbolData.forEach((trades) => {
            const result = calculateProfit(trades);
            result.tradeResult.forEach(trade => {
                const date = new Date(trades.find(t => t.id === trade.sellId)?.time || 0)
                    .toISOString()
                    .slice(0, 10);
                if (!combined[date]) combined[date] = 0;
                combined[date] += trade.profit;
            });
        });
        const sorted = Object.entries(combined)
            .sort(([a], [b]) => a.localeCompare(b));


        let runningTotal = 0;
        const cumulativeData = sorted.map(([date, profit]) => {
            runningTotal += profit;
            return {
                date,
                profit: runningTotal
            };
        });


        setDataPoints(cumulativeData);
    }, [symbolData]);

    if (dataPoints.length === 0) {
        return <p className="text-gray-500">No chart data yet</p>;
    }

    return (
        <div className="p-4 mt-6 border rounded bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">Trade Profit Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dataPoints}>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function ProfitChart() {
    const [dataPoints, setDataPoints] = useState<Point[]>([]);
    const symbolData = useTradeStore(state => state.symbolData);

    useEffect(() => {
        const combined: { [date: string]: number } = {};
        symbolData.forEach((trades) => {
            const result = calculateProfit(trades);
            result.tradeResult.forEach(trade => {
                const date = new Date(trades.find(t => t.id === trade.sellId)?.time || 0)
                    .toISOString()
                    .slice(0, 10);
                if (!combined[date]) combined[date] = 0;
                combined[date] += trade.profit;
            });
        });
        const sorted = Object.entries(combined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, profit]) => ({ date, profit }));

        setDataPoints(sorted);
    }, [symbolData]);

    if (dataPoints.length === 0) {
        return <p className="text-gray-500">No chart data yet</p>;
    }

    return (
        <div className="p-4 mt-6 border rounded bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">Profit Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dataPoints}>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
