import { create } from 'zustand';
import { Trade } from '@/types/trade';

interface TradeStore {
    symbolData: Map<string, Trade[]>;
    setSymbolData: (symbol: string, trades: Trade[]) => void;
    getSymbolTrades: (symbol: string) => Trade[] | undefined;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
    symbolData: new Map(),
    setSymbolData: (symbol: string, trades: Trade[]) => {
        set(state => ({
            symbolData: new Map(state.symbolData).set(symbol, trades)
        }));
    },
    getSymbolTrades: (symbol: string) => {
        return get().symbolData.get(symbol);
    }
}));