import { NextRequest, NextResponse } from 'next/server';
import { findSurebets, type MarketOdds, buildOneXTwoMarket } from '@/lib/surebet';

// ---------- Utility ----------
async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error('fetchJson failed:', url, err);
    return null;
  }
}

// ---------- Type helpers ----------
interface StakeOutcome {
  id: string;
  odds: number;
  fixtureName?: string;
  fixtureAbreviation?: string;
  fixture?: {
    id: string;
    tournament?: {
      id: string;
      category?: {
        id: string;
        sport?: { id: string; slug?: string };
      };
    };
  };
}

interface StakeBet {
  id: string;
  outcomes: StakeOutcome[];
}

interface StakeResponse {
  data?: {
    highrollerSportBets?: {
      id: string;
      iid: string;
      bet?: StakeBet;
    }[];
  };
}

interface OneXBetEvent {
  L?: string;
  O1?: string;
  O2?: string;
  E?: Array<{ T: number; C: string; D: string; E: string }>;
}

interface OneXBetResponse {
  Value?: OneXBetEvent[];
}

interface DavidOutcome {
  type: '1' | 'X' | '2';
  odds: number;
}

interface DavidMarket {
  type: string;
  outcomes: DavidOutcome[];
}

interface DavidEvent {
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  markets?: DavidMarket[];
}

interface DavidLeague {
  name?: string;
  events?: DavidEvent[];
}

interface DavidSport {
  name?: string;
  leagues?: DavidLeague[];
}

interface DavidResponse {
  sports?: DavidSport[];
}

// ---------- Normalizers ----------
function normalizeStakeHighrollers(json: StakeResponse | null): MarketOdds[] {
  if (!json?.data?.highrollerSportBets) return [];
  const markets: MarketOdds[] = [];

  for (const item of json.data.highrollerSportBets) {
    const bet = item.bet;
    if (!bet?.outcomes) continue;

    const firstOutcome = bet.outcomes[0];
    const matchName = firstOutcome?.fixtureName ?? 'Unknown Match';
    const leagueName = firstOutcome?.fixture?.tournament?.category?.id ?? 'Unknown League';
    const sportSlug = firstOutcome?.fixture?.tournament?.category?.sport?.slug ?? 'sport';

    const selections = bet.outcomes
      .map((o) => ({
        bookmaker: 'Stake',
        market: 'Unspecified',
        outcomeKey: String(o.id ?? Math.random()),
        odds: Number(o.odds),
      }))
      .filter((s) => s.odds && isFinite(s.odds));

    if (selections.length >= 2) {
      markets.push({
        sport: sportSlug,
        league: leagueName,
        match: matchName,
        market: 'Stake Market',
        selections,
      });
    }
  }

  return markets;
}

function normalizeOneXBet(json: OneXBetResponse | null): MarketOdds[] {
  if (!json?.Value) return [];
  const markets: MarketOdds[] = [];

  for (const ev of json.Value) {
    const league = ev?.L || '1xBet League';
    const match = `${ev?.O1 ?? ''} - ${ev?.O2 ?? ''}`;
    const oddsSet = ev?.E?.find((e) => e?.T === 1);
    if (!oddsSet) continue;

    const home = Number(oddsSet.C);
    const draw = Number(oddsSet.D);
    const away = Number(oddsSet.E);
    if ([home, draw, away].every((v) => v && isFinite(v))) {
      markets.push(
        buildOneXTwoMarket(
          { sport: 'Football', league, match },
          { bookmaker: '1xBet', home, draw, away },
        ),
      );
    }
  }

  return markets;
}

function normalizeDavidSureBet(json: DavidResponse | null): MarketOdds[] {
  if (!json?.sports) return [];
  const markets: MarketOdds[] = [];

  for (const sport of json.sports) {
    for (const league of sport.leagues ?? []) {
      for (const event of league.events ?? []) {
        const match = `${event.homeTeam?.name ?? 'TeamA'} - ${event.awayTeam?.name ?? 'TeamB'}`;
        const market = event.markets?.find((m) => m.type === '1X2');
        if (!market?.outcomes) continue;

        const home = Number(market.outcomes.find((o) => o.type === '1')?.odds);
        const draw = Number(market.outcomes.find((o) => o.type === 'X')?.odds);
        const away = Number(market.outcomes.find((o) => o.type === '2')?.odds);
        if ([home, draw, away].every((v) => v && isFinite(v))) {
          markets.push(
            buildOneXTwoMarket(
              { sport: sport.name ?? 'Football', league: league.name ?? 'Unknown League', match },
              { bookmaker: 'DavidSureBet', home, draw, away },
            ),
          );
        }
      }
    }
  }

  return markets;
}

// ---------- Main handler ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minRoi = Number(searchParams.get('minRoi') ?? '0');
  const stake = Number(searchParams.get('stake') ?? '100');

  console.log('➡️ Incoming request params:', { minRoi, stake });

  const [oneX, imsptdls, stakeGql] = await Promise.all([
    fetchJson<OneXBetResponse>(
      'https://fun1x888.com/service-api/LiveFeed/Get1x2_VZip?count=20&lng=vi&gr=819&mode=4&country=43&virtualSports=true&noFilterBlockEvent=true',
    ),
    fetchJson<DavidResponse>('https://sb.imsptdls.com/api/Event/GetSportEventsDelta', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        SportId: 1,
        MarketTypeIds: [1, 2, 3],
        IncludeMarkets: true,
        IncludeEvents: true,
        Lang: 'en',
      }),
    }),
    fetchJson<StakeResponse>('https://stake.com/_api/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://stake.com',
        referer: 'https://stake.com/',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
      },
      body: JSON.stringify({
        query: `query BetsBoard_HighrollerSportBets($limit: Int!) {
          highrollerSportBets(limit: $limit) {
            id iid bet {
              __typename
              ... on SportBet {
                id
                outcomes {
                  id
                  odds
                  fixtureName
                  fixtureAbreviation
                  fixture {
                    id
                    tournament {
                      id
                      category { id sport { id slug } }
                    }
                  }
                }
              }
            }
          }
        }`,
        variables: { limit: 10 },
      }),
    }),
  ]);

  console.log('✅ Providers fetched:', { imsptdls });

  const markets: MarketOdds[] = [
    ...normalizeOneXBet(oneX),
    ...normalizeStakeHighrollers(stakeGql),
    ...normalizeDavidSureBet(imsptdls),
  ];

  console.log('📊 Normalized market counts:', {
    oneX: normalizeOneXBet(oneX).length,
    stake: normalizeStakeHighrollers(stakeGql).length,
    imsptdls: normalizeDavidSureBet(imsptdls).length,
  });

  const surebets = findSurebets(markets, {
    totalStake: isFinite(stake) ? stake : 100,
    minRoiPct: isFinite(minRoi) ? minRoi : 0,
  });

  console.log('💰 Surebets found:', surebets.length);
  if (surebets.length) console.log('Example surebet:', surebets[0]);

  return NextResponse.json({ count: surebets.length, surebets });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const markets = (body?.markets ?? []) as MarketOdds[];
    const totalStake = typeof body?.totalStake === 'number' ? body.totalStake : 100;
    const minRoiPct = typeof body?.minRoiPct === 'number' ? body.minRoiPct : 0;
    const surebets = findSurebets(markets, { totalStake, minRoiPct });
    return NextResponse.json({ surebets });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
