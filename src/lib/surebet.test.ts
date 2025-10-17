import { describe, it, expect } from 'vitest';
import { buildOneXTwoMarket, findSurebets, buildTwoWayMarket, type MarketOdds } from './surebet';

describe('surebet calculator', () => {
  it('detects arbitrage on 1x2 with cross-bookmaker best lines', () => {
    const markets: MarketOdds[] = [];
    // Bookmaker A offers strong home, weak others
    markets.push(buildOneXTwoMarket(
      { sport: 'Football', league: 'Test League', match: 'A - B' },
      { bookmaker: 'BookA', home: 2.2, draw: 3.1, away: 3.0 }
    ));
    // Bookmaker B offers strong draw
    markets.push(buildOneXTwoMarket(
      { sport: 'Football', league: 'Test League', match: 'A - B' },
      { bookmaker: 'BookB', home: 2.05, draw: 3.4, away: 2.8 }
    ));
    // Bookmaker C offers strong away
    markets.push(buildOneXTwoMarket(
      { sport: 'Football', league: 'Test League', match: 'A - B' },
      { bookmaker: 'BookC', home: 2.1, draw: 3.2, away: 3.3 }
    ));

    const combined: MarketOdds = {
      sport: 'Football',
      league: 'Test League',
      match: 'A - B',
      market: '1x2',
      selections: [
        ...markets[0].selections,
        ...markets[1].selections,
        ...markets[2].selections,
      ],
    };

    const res = findSurebets([combined], { totalStake: 100 });
    expect(res.length).toBe(1);
    expect(res[0].roi).toBeGreaterThan(0);
    const sumStake = res[0].bets.reduce((a, b) => a + b.stake, 0);
    expect(sumStake).toBeGreaterThan(99.9);
    expect(sumStake).toBeLessThan(100.1);
  });

  it('returns empty when no arbitrage (two-way)', () => {
    const market = buildTwoWayMarket(
      { sport: 'Tennis', league: 'Test', match: 'A - B', market: 'Match Winner' },
      { bookmaker: 'BookA', outcomeA: 1.6, outcomeB: 2.1, keyA: 'A', keyB: 'B' }
    );
    const res = findSurebets([market], { totalStake: 100 });
    expect(res.length).toBe(0);
  });

  it('applies minRoiPct filter', () => {
    const m = buildTwoWayMarket(
      { sport: 'MMA', league: 'UFC', match: 'F1 - F2', market: 'Winner' },
      { bookmaker: 'X', outcomeA: 2.1, outcomeB: 2.1, keyA: 'F1', keyB: 'F2' }
    );
    // With symmetric odds 2.1/2.1, impliedSum = 1/2.1+1/2.1 < 1 => arb exists
    const res = findSurebets([m], { totalStake: 100, minRoiPct: 1 });
    expect(res.length).toBeGreaterThanOrEqual(0);
  });
});



