
// Simulation configuration
const UPDATE_INTERVAL_MS = 200; // 5 updates per second
const SCANNER_INTERVAL_MS = 2000; // New signal every 2 seconds

// Mock Tickers
const TICKERS = [
    "FED-DEC23", "CPI-NOV", "GDP-Q4", "NVDA-EARN", "BTC-100K-EOY",
    "TSLA-DELIV", "SPX-4600-DEC", "UNEMP-RATE", "GOOG-ANTITRUST"
];

const STRATEGIES = [
    { name: "Continuation", type: "bull" },
    { name: "Alpha Predator", type: "bull" },
    { name: "Bon Shorty", type: "bear" },
    { name: "Mean Reversion", type: "neutral" },
    { name: "Volume Breakout", type: "bull" }
];

// Helper to generate a random price between 1 and 99
const randomPrice = () => Math.floor(Math.random() * 98) + 1;

// Helper to generate order book depth
const generateDepth = (midPrice) => {
    const depth = [];
    // Generate 5 levels of bids
    let currentBid = midPrice;
    for (let i = 0; i < 5; i++) {
        if (currentBid <= 0) break;
        depth.push({
            price: currentBid,
            size: Math.floor(Math.random() * 1000) + 100,
            orders: Math.floor(Math.random() * 10) + 1
        });
        currentBid -= Math.floor(Math.random() * 3);
    }
    return depth;
};

// --- API ---

// Simulates a Level II Data Stream
export const subscribeToTicker = (ticker, callback) => {
    const interval = setInterval(() => {
        // Random walk for mid price
        const yesPrice = randomPrice();
        const noPrice = 100 - yesPrice; // Reciprocal

        const data = {
            ticker,
            timestamp: Date.now(),
            yes: {
                price: yesPrice,
                bids: generateDepth(yesPrice)
            },
            no: {
                price: noPrice,
                bids: generateDepth(noPrice)
            },
            lastTrade: {
                price: yesPrice,
                side: Math.random() > 0.5 ? 'YES' : 'NO',
                size: Math.floor(Math.random() * 500)
            }
        };
        callback(data);
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
};

// Simulates "Market Race" data (ranking by % change)
export const subscribeToMarketRace = (callback) => {
    // Initialize random starting deltas
    let racers = TICKERS.map(t => ({
        ticker: t,
        delta: (Math.random() * 10) - 5, // -5% to +5%
        volatility: Math.random()
    }));

    const interval = setInterval(() => {
        // Update deltas
        racers = racers.map(r => ({
            ...r,
            delta: r.delta + (Math.random() - 0.5), // Random walk delta
        })).sort((a, b) => b.delta - a.delta); // Sort by highest gainer

        callback(racers);
    }, 500);

    return () => clearInterval(interval);
};

// Simulates "Holly" Scanner Alerts
export const subscribeToScanner = (callback) => {
    const interval = setInterval(() => {
        const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
        const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];

        const alert = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            ticker,
            strategy: strategy.name,
            type: strategy.type,
            conviction: Math.floor(Math.random() * 3) + 1, // 1-3 bars
            description: `${strategy.name} triggered on ${ticker} at $${randomPrice()}`
        };

        callback(alert);
    }, SCANNER_INTERVAL_MS);

    return () => clearInterval(interval);
};
