export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import axios, {AxiosError} from 'axios';
import crypto from 'crypto';

export async function GET() {
    try {
        const API_KEY = process.env.BINANCE_API_KEY!;
        const API_SECRET = process.env.BINANCE_API_SECRET!;

        if (!API_KEY || !API_SECRET) {
            return NextResponse.json(
                { error: "API key and secret must be set in environment variables" },
                { status: 500 }
            );
        }
        const recvWindow = 9000;
        const timestamp = Date.now();

        const queryString = `omitZeroBalances=true&timestamp=${timestamp}&recvWindow=${recvWindow}`;

        const signature = crypto
            .createHmac("sha256", API_SECRET)
            .update(queryString)
            .digest("hex");

        const finalQuery = `${queryString}&signature=${signature}`;

        const response = await axios.get(
            `https://api.binance.com/api/v3/account?${finalQuery}`,
            {
                headers: {
                    "X-MBX-APIKEY": API_KEY,
                },
            }
        );
        return NextResponse.json(response.data);
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
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
        const error = err as Error;
        console.error("General error:", error.message);
        return NextResponse.json(
            { error: error.message || "Unknown error" },
            { status: 500 }
        );
    }
}
