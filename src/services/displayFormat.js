/**
 * displayFormat.js — Shared display formatting utilities for market prices,
 * P&L values, and side labels.
 *
 * All monetary values in Kalshi are stored in cents (1–99 for prices,
 * arbitrary integers for P&L). This module normalises mixed raw/cents
 * inputs into consistent display strings.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return a finite number or the supplied fallback (default 0). */
function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** True when the value is null, undefined, or not a finite number. */
function isInvalid(value) {
  return value == null || !Number.isFinite(Number(value));
}

// ---------------------------------------------------------------------------
// 1. Probability / Cents rendering
// ---------------------------------------------------------------------------

/**
 * Format a price in cents for display.
 *
 * @param {number|string|null|undefined} cents  Price value (1–99 range).
 * @param {object}  [opts]
 * @param {string}  [opts.placeholder='--']  Returned when value is invalid.
 * @param {number}  [opts.decimals=0]        Decimal places (0 → "42¢", 2 → "42.00¢").
 * @param {string}  [opts.suffix='¢']        Unit suffix.
 * @returns {string}
 */
export function formatCents(cents, opts = {}) {
  const { placeholder = '--', decimals = 0, suffix = '¢' } = opts;
  if (isInvalid(cents)) return placeholder;
  return `${toNumber(cents).toFixed(decimals)}${suffix}`;
}

/**
 * Format a probability as a percentage string.
 * Input is cents (e.g. 42 → "42%"). Handles raw 0‑1 floats automatically
 * (e.g. 0.42 → "42%") so callers don't need to know the input scale.
 *
 * @param {number|string|null|undefined} value  Probability in cents OR 0‑1 float.
 * @param {object}  [opts]
 * @param {string}  [opts.placeholder='--']
 * @param {number}  [opts.decimals=0]
 * @returns {string}
 */
export function formatProbability(value, opts = {}) {
  const { placeholder = '--', decimals = 0 } = opts;
  if (isInvalid(value)) return placeholder;
  let n = toNumber(value);
  // Heuristic: values strictly between 0 and 1 (exclusive) are raw floats.
  if (n > 0 && n < 1) n = n * 100;
  return `${n.toFixed(decimals)}%`;
}

/**
 * Given a YES price in cents, return the NO price (100 − yes).
 *
 * @param {number} yesCents
 * @returns {number}
 */
export function invertPrice(yesCents) {
  return 100 - toNumber(yesCents);
}

// ---------------------------------------------------------------------------
// 2. Dollar / P&L formatting
// ---------------------------------------------------------------------------

/**
 * Format a cent value as a dollar string.
 *
 * @param {number|string|null|undefined} cents
 * @param {object}  [opts]
 * @param {string}  [opts.placeholder='--']
 * @param {number}  [opts.decimals=2]
 * @param {boolean} [opts.showSign=false]  Prefix with +/- for non-zero values.
 * @returns {string}
 */
export function formatDollars(cents, opts = {}) {
  const { placeholder = '--', decimals = 2, showSign = false } = opts;
  if (isInvalid(cents)) return placeholder;
  const n = toNumber(cents);
  const abs = Math.abs(n / 100).toFixed(decimals);
  if (showSign) {
    if (n > 0) return `+$${abs}`;
    if (n < 0) return `-$${abs}`;
  }
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

/**
 * Format a P&L value (in cents) with sign prefix and dollar symbol.
 * Positive → "+$1.23", Negative → "−$4.56", Zero → "$0.00".
 *
 * @param {number|string|null|undefined} cents
 * @param {object}  [opts]
 * @param {string}  [opts.placeholder='--']
 * @param {number}  [opts.decimals=2]
 * @returns {string}
 */
export function formatPnl(cents, opts = {}) {
  return formatDollars(cents, { ...opts, showSign: true });
}

/**
 * Return a CSS class token for P&L colouring.
 *
 * @param {number|string|null|undefined} value
 * @returns {'pnl-positive'|'pnl-negative'|'pnl-zero'}
 */
export function pnlClass(value) {
  const n = toNumber(value);
  if (n > 0) return 'pnl-positive';
  if (n < 0) return 'pnl-negative';
  return 'pnl-zero';
}

/**
 * Convert centi-cents (Kalshi WS field) to dollars.  500000 → 0.05.
 *
 * @param {number} centiCents
 * @returns {number}
 */
export function centiCentsToDollars(centiCents) {
  return toNumber(centiCents) / 10000;
}

/**
 * Convert cents to dollars.  60 → 0.60.
 *
 * @param {number} cents
 * @returns {number}
 */
export function centsToDollars(cents) {
  return toNumber(cents) / 100;
}

/**
 * Convert dollars to cents (rounded).  0.60 → 60.
 *
 * @param {number} dollars
 * @returns {number}
 */
export function dollarsToCents(dollars) {
  return Math.round(toNumber(dollars) * 100);
}

// ---------------------------------------------------------------------------
// 3. Side-label mapping
// ---------------------------------------------------------------------------

/**
 * Normalise a raw side value from feed payloads into a canonical lowercase
 * token.  Handles 'YES'/'NO'/'yes'/'no'/'Yes'/'No'.
 *
 * @param {string|null|undefined} raw
 * @returns {'yes'|'no'|null}
 */
export function normalizeSide(raw) {
  if (raw == null) return null;
  const lower = String(raw).toLowerCase();
  if (lower === 'yes' || lower === 'y') return 'yes';
  if (lower === 'no' || lower === 'n') return 'no';
  return null;
}

/**
 * Map a side value to a display label for order context.
 *
 *   'yes' → 'YES'   |  'no' → 'NO'
 *
 * @param {string|null|undefined} side
 * @param {string} [fallback='--']
 * @returns {string}
 */
export function sideLabel(side, fallback = '--') {
  const s = normalizeSide(side);
  if (s === 'yes') return 'YES';
  if (s === 'no') return 'NO';
  return fallback;
}

/**
 * Map a side value to a position-style label.
 *
 *   'yes' → 'Long'  |  'no' → 'Short'
 *
 * @param {string|null|undefined} side
 * @param {string} [fallback='--']
 * @returns {string}
 */
export function positionSideLabel(side, fallback = '--') {
  const s = normalizeSide(side);
  if (s === 'yes') return 'Long';
  if (s === 'no') return 'Short';
  return fallback;
}

/**
 * Map a side value to a compact single-character label.
 *
 *   'yes' → 'B'  |  'no' → 'S'
 *
 * @param {string|null|undefined} side
 * @param {string} [fallback='-']
 * @returns {string}
 */
export function sideChar(side, fallback = '-') {
  const s = normalizeSide(side);
  if (s === 'yes') return 'B';
  if (s === 'no') return 'S';
  return fallback;
}

/**
 * Return a CSS class token for side colouring.
 *
 *   'yes' → 'side-yes'  |  'no' → 'side-no'  |  null → ''
 *
 * @param {string|null|undefined} side
 * @returns {string}
 */
export function sideClass(side) {
  const s = normalizeSide(side);
  if (s) return `side-${s}`;
  return '';
}
