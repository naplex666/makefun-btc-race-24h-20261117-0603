import { runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

// A one-position continuation/mean-reversion system.  Entries require either a measured
// three-minute impulse or a close one percent below its 60-minute mean.  The exits are
// deliberately wider than the replay's roughly 26 bp round-trip cost.
const SYMBOL = 'CBBTC';
const SMA_LEN = 60;
const SURGE_BPS = 120;
const DIP_BPS = 100;
const TAKE_PROFIT_BPS = 120;
const STOP_BPS = 80;
const MAX_HOLD_BARS = 120;
const SIZE_BPS = 10_000;
const MAX_SLIPPAGE_BPS = 250;

const closes: bigint[] = [];
let cooldown = 0;
let heldSince = -1;

function buySignal(c: bigint): boolean {
  if (closes.length < 4) return false;
  const old = closes[closes.length - 4]!;
  const n = Math.min(SMA_LEN, closes.length);
  let sum = 0n;
  for (let i = closes.length - n; i < closes.length; i++) sum += closes[i]!;
  const sma = sum / BigInt(n);
  return c * 10_000n >= old * BigInt(10_000 + SURGE_BPS) || c * 10_000n <= sma * BigInt(10_000 - DIP_BPS);
}

await runBars({
  onBatch(state: BarsState, batch) {
    const bar = batch.bars.find((b: Bar) => b.symbol === SYMBOL);
    if (bar === undefined) return [];
    const c = BigInt(bar.c);
    closes.push(c);
    if (closes.length > SMA_LEN + 4) closes.shift();
    const held = state.positions.get(SYMBOL);
    if (cooldown > 0) cooldown--;
    if (held !== undefined) {
      const heldBars = heldSince < 0 ? 0 : batch.seq - heldSince;
      const value = state.value(SYMBOL, held.qty, c);
      const exit = value * 10_000n >= held.cost * BigInt(10_000 + TAKE_PROFIT_BPS) ||
        value * 10_000n <= held.cost * BigInt(10_000 - STOP_BPS) || heldBars >= MAX_HOLD_BARS;
      if (exit) {
        cooldown = 15;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS } satisfies SellInput];
      }
      return [];
    }
    if (cooldown > 0 || !buySignal(c)) return [];
    const spend = state.equity * BigInt(SIZE_BPS) / 10_000n;
    if (spend < BigInt(state.hello.fees.min_notional_quote_units) || spend > state.cash) return [];
    heldSince = batch.seq;
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: spend, max_slippage_bps: MAX_SLIPPAGE_BPS } satisfies BuyInput];
  },
});
