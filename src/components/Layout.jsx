import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Settings, Layout as LayoutIcon, User } from 'lucide-react';
import Montage from './Montage';
import MarketRace from './MarketRace';
import Scanner from './Scanner';
import ChartPlaceholder from './ChartPlaceholder';

const Header = () => (
    <header className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 select-none">
        <div className="flex items-center space-x-4">
            <div className="flex items-center text-white font-bold tracking-wider">
                <Activity className="w-4 h-4 text-[#00ff00] mr-2" />
                KALSHI<span className="text-[#00ff00]">ALPHA</span>
            </div>
            <div className="h-4 w-px bg-[#333]"></div>
            <div className="flex space-x-2 text-xs text-[#a0a0a0]">
                <span className="hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#333]">File</span>
                <span className="hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#333]">Ver</span>
                <span className="hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#333]">Tools</span>
                <span className="hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#333]">Help</span>
            </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-[#666]">
            <div className="flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-[#00ff00]" />
                <span className="text-[#00ff00] font-mono">14ms</span>
            </div>
            <div className="flex items-center space-x-1">
                <span>Quote Server:</span>
                <span className="text-white">QS-NYC-04</span>
            </div>
            <User className="w-4 h-4 hover:text-white cursor-pointer" />
        </div>
    </header>
);

const Toolbar = () => (
    <div className="w-12 bg-[#1e1e1e] border-r border-[#333] flex flex-col items-center py-4 space-y-4">
        <div className="p-2 rounded hover:bg-[#333] cursor-pointer text-[#a0a0a0] hover:text-[#00ff00]">
            <LayoutIcon className="w-5 h-5" />
        </div>
        <div className="p-2 rounded hover:bg-[#333] cursor-pointer text-[#a0a0a0] hover:text-[#00ff00]">
            <Activity className="w-5 h-5" />
        </div>
        <div className="p-2 rounded hover:bg-[#333] cursor-pointer text-[#a0a0a0] hover:text-[#00ff00]">
            <Settings className="w-5 h-5" />
        </div>
    </div>
);

const Layout = () => {
    return (
        <div className="flex flex-col h-screen w-screen bg-[#121212] overflow-hidden text-sm">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Toolbar />
                <main className="flex-1 p-2 gap-2 grid grid-cols-12 grid-rows-6 h-full">
                    {/* Top Row: Chart + Montage */}
                    <div className="col-span-8 row-span-4 bg-[#1e1e1e] border border-[#333] rounded flex flex-col relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-black/50 text-xs px-2 py-1 rounded text-[#00ff00]">PIP ENABLED</span>
                        </div>
                        <ChartPlaceholder symbol="FED-DEC23" />
                    </div>

                    <div className="col-span-4 row-span-4 bg-[#1e1e1e] border border-[#333] rounded flex flex-col">
                        <Montage ticker="FED-DEC23" />
                    </div>

                    {/* Bottom Row: Market Race + Scanner */}
                    <div className="col-span-8 row-span-2 bg-[#1e1e1e] border border-[#333] rounded flex flex-col overflow-hidden">
                        <div className="px-2 py-1 bg-[#2a2a2a] text-xs font-bold text-[#a0a0a0] border-b border-[#333]">MARKET RACE</div>
                        <div className="flex-1 relative">
                            <MarketRace />
                        </div>
                    </div>

                    <div className="col-span-4 row-span-2 bg-[#1e1e1e] border border-[#333] rounded flex flex-col overflow-hidden">
                        <div className="px-2 py-1 bg-[#2a2a2a] text-xs font-bold text-[#a0a0a0] border-b border-[#333] flex justify-between">
                            <span>HOLLY SCANS</span>
                            <span className="text-[#00d2ff]">LIVE</span>
                        </div>
                        <div className="flex-1 relative">
                            <Scanner />
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer / Status Bar */}
            <div className="h-6 bg-[#1e1e1e] border-t border-[#333] flex items-center px-4 text-[10px] text-[#666] justify-between select-none">
                <div className="flex space-x-4">
                    <span>BP: <span className="text-white">$142,050.50</span></span>
                    <span>Unrealized: <span className="text-win">+$1,240.00</span></span>
                    <span>Realized: <span className="text-loss">-$420.50</span></span>
                </div>
                <div>
                    <span>Connected: <span className="text-[#00ff00]">WebSocket Stream v2</span></span>
                </div>
            </div>
        </div>
    );
};

export default Layout;
