import './globals.css';
import {ReactNode} from 'react';

export const metadata = {
    title: 'Binance Profit Tracker',
    description: 'Track your Binance trades and profits',
};

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="th">
        <head/>
        <body className="bg-gray-50 text-gray-900">
        {children}
        </body>
        </html>
    );
}
