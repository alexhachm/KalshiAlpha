// Hotkey scripting language parser — DAS Trader-inspired, adapted for Kalshi
// Provides parseHotkeyScript(), validateScript(), and COMMAND_REFERENCE

// ---------------------------------------------------------------------------
// Command Reference (drives help panel + validation)
// ---------------------------------------------------------------------------

const COMMAND_REFERENCE = {
  commands: [
    {
      name: 'Buy',
      syntax: 'Buy=Route:<route> Price=<expr> Share=<expr> TIF=<tif> [Side=<side>]',
      description: 'Place a buy order. On Kalshi this is a Yes order by default.',
      examples: [
        'Buy=Route:LIMIT Price=Ask+0.05 Share=100 TIF=DAY',
        'Buy=Route:MARKET Share=BP*0.1 TIF=IOC',
        'Buy=Route:LIMIT Price=Mid Share=50 TIF=GTC Side=YES',
      ],
      params: ['Route', 'Price', 'Share', 'TIF', 'Side'],
    },
    {
      name: 'Sell',
      syntax: 'Sell=Route:<route> Price=<expr> Share=<expr> TIF=<tif> [Side=<side>]',
      description: 'Place a sell order. Can sell position or go short (No side).',
      examples: [
        'Sell=Route:MARKET Share=Pos TIF=IOC',
        'Sell=Route:LIMIT Price=Bid-0.02 Share=Pos*0.5 TIF=DAY',
      ],
      params: ['Route', 'Price', 'Share', 'TIF', 'Side'],
    },
    {
      name: 'CXL',
      syntax: 'CXL',
      description: 'Cancel all open orders for the active ticker.',
      examples: ['CXL'],
      params: [],
    },
    {
      name: 'CXLBUY',
      syntax: 'CXLBUY',
      description: 'Cancel all open buy orders for the active ticker.',
      examples: ['CXLBUY'],
      params: [],
    },
    {
      name: 'CXLSELL',
      syntax: 'CXLSELL',
      description: 'Cancel all open sell orders for the active ticker.',
      examples: ['CXLSELL'],
      params: [],
    },
    {
      name: 'Focus',
      syntax: 'Focus=<target>',
      description: 'Focus a specific window type (montage, chart, positions, etc.).',
      examples: ['Focus=Montage', 'Focus=Chart', 'Focus=Positions'],
      params: ['target'],
    },
    {
      name: 'SwitchTicker',
      syntax: 'SwitchTicker=<ticker>',
      description: 'Change the active ticker in the currently focused window.',
      examples: ['SwitchTicker=KXBTC-26FEB25', 'SwitchTicker=KXINX-26FEB25'],
      params: ['ticker'],
    },
  ],
  variables: [
    { name: 'Bid', description: 'Current best bid price' },
    { name: 'Ask', description: 'Current best ask price' },
    { name: 'Last', description: 'Last traded price' },
    { name: 'Mid', description: 'Midpoint between bid and ask' },
    { name: 'Pos', description: 'Current position size (contracts held)' },
    { name: 'BP', description: 'Buying power — use with multiplier (e.g. BP*0.1)' },
    { name: 'MaxPos', description: 'Maximum position allowed by risk settings' },
    { name: 'Price', description: 'Base price keyword — use with offset (e.g. Price+0.05)' },
  ],
};

// ---------------------------------------------------------------------------
// Constants for validation
// ---------------------------------------------------------------------------

const VALID_ROUTES = ['LIMIT', 'MARKET'];
const VALID_TIF = ['DAY', 'GTC', 'IOC'];
const VALID_SIDES = ['YES', 'NO'];
const PRICE_KEYWORDS = ['BID', 'ASK', 'LAST', 'MID'];

const FOCUS_TARGETS = [
  'MONTAGE', 'CHART', 'POSITIONS', 'TRADELOG', 'EVENTLOG',
  'ACCOUNTS', 'TIMESALE', 'WATCHLIST', 'SCANNER', 'PRICELADDER',
];

const ORDER_COMMANDS = { BUY: 'BUY', SELL: 'SELL' };
const CANCEL_COMMANDS = {
  CXL: 'CANCEL_ALL',
  CXLBUY: 'CANCEL_BUY',
  CXLSELL: 'CANCEL_SELL',
};

// ---------------------------------------------------------------------------
// Price expression parser
// ---------------------------------------------------------------------------

function parsePriceExpr(raw) {
  if (!raw) return { error: 'Price is required for order commands' };

  const upper = raw.toUpperCase();

  // Pure keyword: Bid, Ask, Last, Mid
  if (PRICE_KEYWORDS.includes(upper)) {
    return { type: 'market', base: upper.toLowerCase() };
  }

  // Keyword with offset: Ask+0.05, Bid-0.10, Price+0.02
  const offsetMatch = raw.match(
    /^(Price|Bid|Ask|Last|Mid)([+-])(\d+(?:\.\d+)?)$/i
  );
  if (offsetMatch) {
    const base = offsetMatch[1].toLowerCase();
    const sign = offsetMatch[2] === '+' ? 1 : -1;
    const offset = parseFloat(offsetMatch[3]) * sign;
    return { type: 'offset', base, offset };
  }

  // Fixed numeric price
  const num = parseFloat(raw);
  if (!isNaN(num) && num >= 0) {
    return { type: 'fixed', value: num };
  }

  return { error: `Invalid price expression: "${raw}"` };
}

// ---------------------------------------------------------------------------
// Share expression parser
// ---------------------------------------------------------------------------

function parseShareExpr(raw) {
  if (!raw) return { error: 'Share is required for order commands' };

  const upper = raw.toUpperCase();

  // Position-based: Pos
  if (upper === 'POS') {
    return { type: 'position' };
  }

  // Fractional position: Pos*0.5
  const posMultMatch = raw.match(/^Pos\*(\d+(?:\.\d+)?)$/i);
  if (posMultMatch) {
    return { type: 'position_fraction', multiplier: parseFloat(posMultMatch[1]) };
  }

  // MaxPos
  if (upper === 'MAXPOS') {
    return { type: 'max_position' };
  }

  // Buying-power based: BP*0.1
  const bpMatch = raw.match(/^BP\*(\d+(?:\.\d+)?)$/i);
  if (bpMatch) {
    return { type: 'buying_power', factor: parseFloat(bpMatch[1]) };
  }

  // Fixed integer
  const num = parseInt(raw, 10);
  if (!isNaN(num) && num > 0 && String(num) === raw) {
    return { type: 'fixed', value: num };
  }

  return { error: `Invalid share expression: "${raw}"` };
}

// ---------------------------------------------------------------------------
// Token parser (key=value or key:value)
// ---------------------------------------------------------------------------

function parseToken(token) {
  // key=value  (e.g. Share=100, Price=Ask+0.05)
  const eqIdx = token.indexOf('=');
  if (eqIdx > 0) {
    return { key: token.slice(0, eqIdx), value: token.slice(eqIdx + 1) };
  }
  // key:value  (e.g. Route:LIMIT) — only used inside compound first-token
  const colonIdx = token.indexOf(':');
  if (colonIdx > 0) {
    return { key: token.slice(0, colonIdx), value: token.slice(colonIdx + 1) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// parseHotkeyScript(scriptString) -> { action, params, errors[] }
// ---------------------------------------------------------------------------

function parseHotkeyScript(scriptString) {
  const errors = [];

  if (!scriptString || typeof scriptString !== 'string') {
    return { action: null, params: {}, errors: ['Empty or invalid script'] };
  }

  const trimmed = scriptString.trim();
  if (!trimmed) {
    return { action: null, params: {}, errors: ['Empty script'] };
  }

  const tokens = trimmed.split(/\s+/);
  const firstToken = tokens[0];

  // --- Handle first token: may be "Buy=Route:LIMIT" or "CXL" or "Focus=Montage" ---
  const firstParsed = parseToken(firstToken);

  let command;
  let initialParams = {};

  if (firstParsed) {
    command = firstParsed.key;
    // The value may itself contain a key:value (e.g. "Route:LIMIT")
    const subParsed = parseToken(firstParsed.value);
    if (subParsed) {
      initialParams[subParsed.key.toUpperCase()] = subParsed.value;
    } else {
      // Plain value: Focus=Montage or SwitchTicker=KXBTC
      initialParams._FIRST_VALUE = firstParsed.value;
    }
  } else {
    command = firstToken;
  }

  const commandUpper = command.toUpperCase();

  // --- Cancel commands ---
  if (CANCEL_COMMANDS[commandUpper]) {
    if (tokens.length > 1) {
      errors.push(`${commandUpper} takes no parameters`);
    }
    return { action: CANCEL_COMMANDS[commandUpper], params: {}, errors };
  }

  // --- Focus command ---
  if (commandUpper === 'FOCUS') {
    const target = initialParams._FIRST_VALUE;
    if (!target) {
      errors.push('Focus requires a target (e.g. Focus=Montage)');
      return { action: 'FOCUS', params: {}, errors };
    }
    if (!FOCUS_TARGETS.includes(target.toUpperCase())) {
      errors.push(
        `Unknown focus target "${target}". Valid: ${FOCUS_TARGETS.map((t) => t.charAt(0) + t.slice(1).toLowerCase()).join(', ')}`
      );
    }
    return { action: 'FOCUS', params: { target: target.toLowerCase() }, errors };
  }

  // --- SwitchTicker command ---
  if (commandUpper === 'SWITCHTICKER') {
    const ticker = initialParams._FIRST_VALUE;
    if (!ticker) {
      errors.push('SwitchTicker requires a ticker (e.g. SwitchTicker=KXBTC)');
      return { action: 'SWITCH_TICKER', params: {}, errors };
    }
    return { action: 'SWITCH_TICKER', params: { ticker }, errors };
  }

  // --- Order commands (Buy / Sell) ---
  if (ORDER_COMMANDS[commandUpper]) {
    const action = ORDER_COMMANDS[commandUpper];
    const paramMap = { ...initialParams };
    delete paramMap._FIRST_VALUE;

    // Parse remaining tokens
    for (let i = 1; i < tokens.length; i++) {
      const parsed = parseToken(tokens[i]);
      if (!parsed) {
        errors.push(`Unrecognized token: "${tokens[i]}"`);
        continue;
      }
      // Handle key:value inside value (e.g. Route:LIMIT as standalone token)
      const subParsed = parseToken(parsed.value);
      if (subParsed) {
        paramMap[subParsed.key.toUpperCase()] = subParsed.value;
      } else {
        paramMap[parsed.key.toUpperCase()] = parsed.value;
      }
    }

    const params = {};

    // Route
    if (paramMap.ROUTE) {
      const route = paramMap.ROUTE.toUpperCase();
      if (!VALID_ROUTES.includes(route)) {
        errors.push(`Invalid route "${paramMap.ROUTE}". Valid: ${VALID_ROUTES.join(', ')}`);
      }
      params.route = route;
    }

    // Price (optional for MARKET orders)
    if (paramMap.PRICE) {
      const priceResult = parsePriceExpr(paramMap.PRICE);
      if (priceResult.error) {
        errors.push(priceResult.error);
      } else {
        params.price = priceResult;
      }
    } else if (paramMap.ROUTE && paramMap.ROUTE.toUpperCase() === 'LIMIT') {
      errors.push('Price is required for LIMIT orders');
    }

    // Share
    if (paramMap.SHARE) {
      const shareResult = parseShareExpr(paramMap.SHARE);
      if (shareResult.error) {
        errors.push(shareResult.error);
      } else {
        params.shares = shareResult;
      }
    }

    // TIF
    if (paramMap.TIF) {
      const tif = paramMap.TIF.toUpperCase();
      if (!VALID_TIF.includes(tif)) {
        errors.push(`Invalid TIF "${paramMap.TIF}". Valid: ${VALID_TIF.join(', ')}`);
      }
      params.tif = tif;
    }

    // Side (Kalshi-specific: YES/NO)
    if (paramMap.SIDE) {
      const side = paramMap.SIDE.toUpperCase();
      if (!VALID_SIDES.includes(side)) {
        errors.push(`Invalid side "${paramMap.SIDE}". Valid: ${VALID_SIDES.join(', ')}`);
      }
      params.side = side;
    }

    return { action, params, errors };
  }

  // --- Unknown command ---
  errors.push(
    `Unknown command "${command}". Valid commands: Buy, Sell, CXL, CXLBUY, CXLSELL, Focus, SwitchTicker`
  );
  return { action: null, params: {}, errors };
}

// ---------------------------------------------------------------------------
// validateScript(scriptString) -> { valid: boolean, errors: string[] }
// ---------------------------------------------------------------------------

function validateScript(scriptString) {
  const result = parseHotkeyScript(scriptString);
  return {
    valid: result.errors.length === 0 && result.action !== null,
    errors: result.errors,
  };
}

export { parseHotkeyScript, validateScript, COMMAND_REFERENCE };
