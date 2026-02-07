import React, { useState, useEffect } from 'react';
import { subscribeToTicker } from '../services/mockData';
import clsx from 'clsx';

const OrderRow = ({ price, size, orders, type, isBest }) => (
    <div className={clsx(
        "grid grid-cols-3 text-right px-2 py-0.5 hover:bg-[#333] cursor-pointer font-mono text-xs",
        type === 'bid' ? "text-[#00ff00]" : "text-[#ff4444]",
        isBest && (type === 'bid' ? "bg-[#003300]" : "bg-[#330000]")
    )}>
        <span>{price.toFixed(0)}</span>
        <span>{size}</span>
        <span className="text-[#666]">{orders}</span>
    </div>
);

const Montage = ({ ticker }) => {
    const [data, setData] = useState(null);
    const [qty, setQty] = useState(100);

    useEffect(() => {
        const cleanup = subscribeToTicker(ticker, setData);
        return cleanup;
    }, [ticker]);

    if (!data) return <div className="p-4 text-[#666]">Connecting to Level II...</div>;

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Montage Header */}
            <div className="p-2 border-b border-[#333] bg-[#2a2a2a]">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <span className="font-bold text-lg text-white mr-2">{data.ticker}</span>
                        <span className="text-xs text-[#a0a0a0]">FED FUNDS FUTURES DEC</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-mono text-[#00ff00]">{data.lastTrade.price}</span>
                        <span className="text-[10px] text-[#a0a0a0]">Vol: 24,502</span>
                    </div>
                </div>

                {/* Order Entry Controls */}
                <div className="flex space-x-2 text-xs mb-1">
                    <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="bg-[#121212] border border-[#333] text-white px-2 py-1 w-20 rounded focus:border-[#00ff00] outline-none"
                    />
                    <button className="flex-1 bg-[#005500] text-white rounded hover:bg-[#007700] transition-colors border border-[#00ff00]/20">BUY MKT</button>
                    <button className="flex-1 bg-[#550000] text-white rounded hover:bg-[#770000] transition-colors border border-[#ff4444]/20">SELL MKT</button>
                </div>
            </div>

            {/* Level II / Reciprocal Order Book */}
            <div className="flex-1 overflow-auto grid grid-cols-2 divide-x divide-[#333]">
                {/* YES Side (Bids) */}
                <div>
                    <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#333] grid grid-cols-3 text-right px-2 py-1 text-[10px] text-[#666]">
                        <span>BID</span><span>SIZE</span><span>#</span>
                    </div>
                    {data.yes.bids.map((level, i) => (
                        <OrderRow key={i} {...level} type="bid" isBest={i === 0} />
                    ))}
                </div>

                {/* NO Side (Bids inverted to show Ask for YES) */}
                <div>
                    <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#333] grid grid-cols-3 text-right px-2 py-1 text-[10px] text-[#666]">
                        <span>ASK (IMP)</span><span>SIZE</span><span>#</span>
                    </div>
                    {data.no.bids.map((level, i) => (
                        // Implied Ask Price = 100 - No Bid Price
                        <OrderRow
                            key={i}
                            price={100 - level.price}
                            size={level.size}
                            orders={level.orders}
                            type="ask"
                            isBest={i === 0}
                        />
                    ))}
                </div>
            </div>

            {/* Tape */}
            <div className="h-24 border-t border-[#333] bg-[#121212] overflow-hidden flex flex-col p-1">
                <div className="text-[10px] text-[#666] mb-1">TIME & SALES</div>
                <div className="font-mono text-xs text-white">
                    <div className="grid grid-cols-3 text-[10px] text-[#444]">
                        <span>TIME</span><span>PRICE</span><span>SIZE</span>
                    </div>
                    {/* Simulated Tape History */}
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-3 text-[#a0a0a0]">
                            <span>14:02:{30 - i}</span>
                            <span className={i % 2 === 0 ? "text-win" : "text-loss"}>{data.lastTrade.price + (i % 2 === 0 ? 0 : -1)}</span>
                            <span>{Math.floor(Math.random() * 100)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Montage;
