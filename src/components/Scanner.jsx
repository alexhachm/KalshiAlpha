import React, { useState, useEffect, useRef } from 'react';
import { subscribeToScanner } from '../services/mockData';
import { Play } from 'lucide-react';

const Scanner = () => {
    const [alerts, setAlerts] = useState([]);
    const listRef = useRef(null);

    useEffect(() => {
        const cleanup = subscribeToScanner((newAlert) => {
            setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50
        });
        return cleanup;
    }, []);

    return (
        <div className="h-full bg-[#1e1e1e] overflow-y-auto custom-scrollbar flex flex-col">
            {/* Scanner Header Row */}
            <div className="grid grid-cols-12 text-[10px] text-[#666] px-2 py-1 border-b border-[#333] sticky top-0 bg-[#1e1e1e] z-10">
                <div className="col-span-2">TIME</div>
                <div className="col-span-3">TICKER</div>
                <div className="col-span-5">STRATEGY</div>
                <div className="col-span-2 text-right">CNV</div>
            </div>

            <div ref={listRef} className="flex-1">
                {alerts.map((alert, index) => (
                    <div
                        key={alert.id}
                        className={`grid grid-cols-12 text-xs px-2 py-1 border-b border-[#333]/50 hover:bg-[#2a2a2a] cursor-pointer ${index === 0 ? 'flash-up' : ''}`}
                    >
                        <div className="col-span-2 text-[#a0a0a0] font-mono text-[10px]">{alert.time}</div>
                        <div className="col-span-3 font-bold text-[#e0e0e0]">{alert.ticker}</div>
                        <div className={`col-span-5 ${alert.type === 'bull' ? 'text-win' :
                                alert.type === 'bear' ? 'text-loss' : 'text-[#a0a0a0]'
                            }`}>
                            {alert.strategy}
                        </div>
                        <div className="col-span-2 flex justify-end space-x-0.5">
                            {[...Array(alert.conviction)].map((_, i) => (
                                <div key={i} className={`w-1 h-3 ${alert.type === 'bull' ? 'bg-[#00ff00]' : 'bg-[#ff4444]'}`}></div>
                            ))}
                            {[...Array(3 - alert.conviction)].map((_, i) => (
                                <div key={i} className="w-1 h-3 bg-[#333]"></div>
                            ))}
                        </div>
                    </div>
                ))}

                {alerts.length === 0 && (
                    <div className="p-4 text-center text-[#666] text-xs">
                        <Play className="w-4 h-4 mx-auto mb-2 opacity-50" />
                        Waiting for Holly...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scanner;
