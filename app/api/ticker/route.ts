export const runtime = 'nodejs';

import {NextResponse} from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const symbols = url.searchParams.get('symbols');

        const queryString = `symbols=${symbols}`;

        const finalQuery = `${queryString}`;

        const response = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?${finalQuery}`
        );
        return NextResponse.json(response.data);
    } catch (err: any) {
        if (err.response) {
            console.error("Binance API error data:", err.response.data);
            console.error("Binance API error status:", err.response.status);
            console.error("Binance API error headers:", err.response.headers);
        } else {
            console.error("Binance API error:", err.message);
        }
        return NextResponse.json(
            { error: err.response?.data || err.message || "Unknown error" },
            { status: 500 }
        );
    }
}
