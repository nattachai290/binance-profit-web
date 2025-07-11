// lib/binance.ts
import axios from 'axios';
import crypto from 'crypto';

export async function getMyTrades(symbol = 'BTCUSDT') {
    const API_KEY = process.env.BINANCE_API_KEY!;
    const SECRET = process.env.BINANCE_SECRET!;
    const timestamp = Date.now();
    const query = `symbol=${symbol}&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', SECRET).update(query).digest('hex');

    const res = await axios.get(`https://api.binance.com/api/v3/myTrades?${query}&signature=${signature}`, {
        headers: {'X-MBX-APIKEY': API_KEY}
    });
    return res.data;
}
