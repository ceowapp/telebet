export type BookmakerOdds = {
  bookmaker: string;
  market: string;
  outcomeKey: string; // e.g. "home", "draw", "away" or any unique key per market
  odds: number; // decimal odds
};

export type MarketOdds = {
  sport: string;
  league: string;
  match: string; // e.g. "Team A - Team B"
  market: string; // e.g. "1x2", "Both to score"
  updatedAt?: string;
  selections: BookmakerOdds[];
};

export type SurebetBet = {
  bookmaker: string;
  market: string;
  odds: number;
  stake: number;
};

export type Surebet = {
  id: string;
  roi: number; // percentage, e.g. 2.1 means 2.1%
  profit: number; // in same unit as totalStake
  sport: string;
  updatedAt: string;
  match: string;
  league: string;
  date?: string;
  bets: SurebetBet[];
};

export type FindSurebetsOptions = {
  totalStake: number; // how much bankroll to distribute across selections
  minRoiPct?: number; // filter by minimum ROI percentage
};

function calculateImpliedProbability(odds: number): number {
  return 1 / odds;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Given best odds per outcome, compute arbitrage and stakes.
function computeArbStakes(
  outcomeOdds: { outcomeKey: string; bookmaker: string; odds: number; market: string }[],
  totalStake: number
) {
  const impliedSum = outcomeOdds.reduce((acc, o) => acc + calculateImpliedProbability(o.odds), 0);
  const isArb = impliedSum < 1;
  if (!isArb) return null;

  const payout = totalStake / impliedSum; // guaranteed return if lines hold
  const profit = payout - totalStake;
  const roiPct = (profit / totalStake) * 100;

  const bets = outcomeOdds.map((o) => {
    const stake = (totalStake * calculateImpliedProbability(o.odds)) / impliedSum;
    return {
      bookmaker: o.bookmaker,
      market: o.market,
      odds: o.odds,
      stake: round2(stake),
    } as SurebetBet;
  });

  return { roiPct, profit: round2(profit), bets };
}

// For a market, pick the best odds per outcomeKey across all bookmakers
function pickBestPerOutcome(selections: BookmakerOdds[]) {
  const bestByOutcome = new Map<string, BookmakerOdds>();
  for (const s of selections) {
    const prev = bestByOutcome.get(s.outcomeKey);
    if (!prev || s.odds > prev.odds) {
      bestByOutcome.set(s.outcomeKey, s);
    }
  }
  return Array.from(bestByOutcome.values());
}

export function findSurebets(
  markets: MarketOdds[],
  options: FindSurebetsOptions
): Surebet[] {
  const { totalStake, minRoiPct = 0 } = options;
  const result: Surebet[] = [];

  let idCounter = 1;
  for (const market of markets) {
    const best = pickBestPerOutcome(market.selections);
    if (best.length < 2) continue; // need at least 2 outcomes

    const comp = computeArbStakes(
      best.map((b) => ({ outcomeKey: b.outcomeKey, bookmaker: b.bookmaker, odds: b.odds, market: market.market })),
      totalStake
    );

    if (!comp) continue;
    if (comp.roiPct < minRoiPct) continue;

    result.push({
      id: `${market.match}-${market.market}-${idCounter++}`,
      roi: round2(comp.roiPct),
      profit: comp.profit,
      sport: market.sport,
      updatedAt: market.updatedAt || new Date().toISOString(),
      match: market.match,
      league: market.league,
      bets: comp.bets,
    });
  }

  return result.sort((a, b) => b.roi - a.roi);
}

// Simple helpers to normalize common market shapes
export function buildOneXTwoMarket(
  params: {
    sport: string;
    league: string;
    match: string;
    market?: string;
  },
  odds: {
    bookmaker: string;
    home?: number;
    draw?: number;
    away?: number;
  }
): MarketOdds {
  const selections: BookmakerOdds[] = [];
  if (odds.home) selections.push({ bookmaker: odds.bookmaker, market: params.market || "1x2", outcomeKey: "home", odds: odds.home });
  if (odds.draw) selections.push({ bookmaker: odds.bookmaker, market: params.market || "1x2", outcomeKey: "draw", odds: odds.draw });
  if (odds.away) selections.push({ bookmaker: odds.bookmaker, market: params.market || "1x2", outcomeKey: "away", odds: odds.away });
  return {
    sport: params.sport,
    league: params.league,
    match: params.match,
    market: params.market || "1x2",
    selections,
  };
}

export function buildTwoWayMarket(
  params: { sport: string; league: string; match: string; market: string },
  odds: { bookmaker: string; outcomeA?: number; outcomeB?: number; keyA?: string; keyB?: string }
): MarketOdds {
  const selections: BookmakerOdds[] = [];
  const keyA = odds.keyA || "a";
  const keyB = odds.keyB || "b";
  if (odds.outcomeA) selections.push({ bookmaker: odds.bookmaker, market: params.market, outcomeKey: keyA, odds: odds.outcomeA });
  if (odds.outcomeB) selections.push({ bookmaker: odds.bookmaker, market: params.market, outcomeKey: keyB, odds: odds.outcomeB });
  return { sport: params.sport, league: params.league, match: params.match, market: params.market, selections };
}


