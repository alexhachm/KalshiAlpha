import React, { useState, useEffect } from 'react';
import { subscribeToMarketRace } from '../services/mockData';

const MarketRace = () => {
    const [racers, setRacers] = useState([]);

    useEffect(() => {
        const cleanup = subscribeToMarketRace(setRacers);
        return cleanup;
    }, []);

    return (
        <div className="h-full bg-[#121212] p-2 overflow-y-auto">
            {racers.map((racer, index) => (
                <div key={racer.ticker} className="mb-2 relative h-6 group cursor-pointer">
                    {/* Background Bar (Zero Line) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#333] z-0"></div>

                    <div className="flex items-center w-full h-full relative z-10 transition-all duration-500 ease-out"
                        style={{ transform: `translateY(${index * 0}px)` }} // Simplified for list, normally would use absolute positioning for smooth rank swap
                    >
                        {/* Ticker Label */}
                        <div className="w-24 text-[10px] items-center flex justify-end pr-2 text-[#a0a0a0] font-bold z-20 bg-[#121212]">
                            {racer.ticker}
                        </div>

                        {/* The Bar */}
                        <div className="flex-1 h-4 relative bg-[#1a1a1a] rounded overflow-hidden">
                            <div
                                className={`absolute top-0 bottom-0 transition-all duration-300 ${racer.delta >= 0 ? 'bg-[#00ff00] left-0' : 'bg-[#ff4444] right-0'}`}
                                style={{
                                    width: `${Math.min(Math.abs(racer.delta) * 10, 100)}%`, // Scale Factor
                                    left: racer.delta >= 0 ? '0' : 'auto',
                                    right: racer.delta < 0 ? '0' : 'auto',
                                    opacity: 0.6 + (Math.abs(racer.delta) / 20)
                                }}
                            ></div>
                            {/* Value */}
                            <span className={`absolute top-0.5 text-[9px] font-mono px-1 ${racer.delta >= 0 ? 'left-0 text-black' : 'right-0 text-white'}`}>
                                {racer.delta > 0 ? '+' : ''}{racer.delta.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketRace;
