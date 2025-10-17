import { NextRequest, NextResponse } from 'next/server';
import { findSurebets, type MarketOdds, buildOneXTwoMarket } from '@/lib/surebet';

// --- Provider response types ---
type StakeHighrollerOutcome = {
  id?: string | number;
  odds?: number;
  fixtureName?: string;
  fixtureAbreviation?: string;
  fixture?: {
    id?: string;
    tournament?: {
      id?: string;
      category?: { id?: string; sport?: { id?: string; slug?: string } };
    };
  };
};
type StakeHighrollerBet = { outcomes?: StakeHighrollerOutcome[] };
type StakeHighrollerItem = { bet?: StakeHighrollerBet };
type StakeHighrollerResponse = { data?: { highrollerSportBets?: StakeHighrollerItem[] } } | null;

type OneXBetOddsEvent = { T?: number; C?: number; D?: number; E?: number };
type OneXBetEvent = { L?: string; O1?: string; O2?: string; E?: OneXBetOddsEvent[] };
type OneXBetResponse = { Value?: OneXBetEvent[] } | null;

type IMSOutcome = { type?: string; odds?: number };
type IMSMarket = { type?: string; outcomes?: IMSOutcome[] };
type IMSTeam = { name?: string };
type IMSEvent = { homeTeam?: IMSTeam; awayTeam?: IMSTeam; markets?: IMSMarket[] };
type IMSLeague = { name?: string; events?: IMSEvent[] };
type IMSSport = { name?: string; leagues?: IMSLeague[] };
type IMSResponse = { sports?: IMSSport[] } | null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.error('fetchJson failed:', url, e);
    return null;
  }
}

// --- Normalizers ---

function normalizeStakeHighrollers(json: StakeHighrollerResponse): MarketOdds[] {
  if (!json || !json.data?.highrollerSportBets) return [];
  const markets: MarketOdds[] = [];
  for (const item of json.data.highrollerSportBets) {
    const bet = item?.bet;
    if (!bet?.outcomes) continue;
    const matchName = bet.outcomes?.[0]?.fixtureName ?? 'Unknown Match';
    const leagueName = bet.outcomes?.[0]?.fixture?.tournament?.category?.id ?? 'Unknown League';
    const sportSlug = bet.outcomes?.[0]?.fixture?.tournament?.category?.sport?.slug ?? 'sport';

    const selections = bet.outcomes
      .map((o: StakeHighrollerOutcome) => ({
        bookmaker: 'Stake',
        market: 'Unspecified',
        outcomeKey: String(o?.id ?? Math.random()),
        odds: Number(o?.odds),
      }))
      .filter((s) => s.odds && isFinite(s.odds));

    if (selections.length >= 2) {
      markets.push({
        sport: sportSlug,
        league: String(leagueName),
        match: String(matchName),
        market: 'Stake Market',
        selections,
      });
    }
  }
  return markets;
}

function normalizeOneXBet(json: OneXBetResponse): MarketOdds[] {
  if (!json || !Array.isArray(json?.Value)) return [];
  const markets: MarketOdds[] = [];
  for (const ev of json.Value) {
    const league = ev?.L || '1xBet League';
    const match = `${ev?.O1 ?? ''} - ${ev?.O2 ?? ''}`;
    const oddsSet = ev?.E?.find((e: OneXBetOddsEvent) => e?.T === 1);
    if (!oddsSet) continue;

    const home = Number(oddsSet?.C);
    const draw = Number(oddsSet?.D);
    const away = Number(oddsSet?.E);
    if ([home, draw, away].every(v => v && isFinite(v))) {
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

// --- NEW: Normalize DavidSureBet / IMSPTDLS ---
function normalizeDavidSureBet(json: IMSResponse): MarketOdds[] {
  if (!json || !Array.isArray(json?.sports)) return [];
  const markets: MarketOdds[] = [];

  for (const sport of json.sports) {
    for (const league of sport?.leagues || []) {
      for (const event of league?.events || []) {
        const match = `${event?.homeTeam?.name ?? 'TeamA'} - ${event?.awayTeam?.name ?? 'TeamB'}`;
        const market = event?.markets?.find((m: IMSMarket) => m?.type === '1X2');
        if (!market || !Array.isArray(market?.outcomes)) continue;

        const home = Number(market.outcomes?.find((o: IMSOutcome) => o?.type === '1')?.odds);
        const draw = Number(market.outcomes?.find((o: IMSOutcome) => o?.type === 'X')?.odds);
        const away = Number(market.outcomes?.find((o: IMSOutcome) => o?.type === '2')?.odds);
        if ([home, draw, away].every(v => v && isFinite(v))) {
          markets.push(
            buildOneXTwoMarket(
              { sport: sport?.name ?? 'Football', league: league?.name ?? 'Unknown League', match },
              { bookmaker: 'DavidSureBet', home, draw, away },
            ),
          );
        }
      }
    }
  }

  return markets;
}

// --- Main handler ---

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minRoi = Number(searchParams.get('minRoi') || '0');
  const stake = Number(searchParams.get('stake') || '100');

  console.log('➡️ Incoming request params:', { minRoi, stake });

  const [_sbk, oneX, imsptdls, stakeGql] = await Promise.all([
    fetchJson<unknown>('https://landing-sports-api.sbk-prdasia.com/api/v2/en-gb/ROA/home', {
      headers: {
        Authorization: `Bearer ${process.env.SBK_API_TOKEN}`,
      },
    }),
    fetchJson<OneXBetResponse>('https://fun1x888.com/service-api/LiveFeed/Get1x2_VZip?count=20&lng=vi&gr=819&mode=4&country=43&virtualSports=true&noFilterBlockEvent=true'),
    fetchJson<IMSResponse>('https://sb.imsptdls.com/api/Event/GetSportEvents', {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-sc': 'AlIKXFEHXVBXUwJVVAEKAFdYVQMDV1dQC1pXBQ4NAwVXOSUmPVsOOmtUaxMkORQfBD0/A19gXnBB',
        'x-token': 'a37adab3-acda-4631-8e4f-ab56d631278a',
        'x-v': '81661'
      },
      body: JSON.stringify({
          SportId: 1,
          Market: 3,
          BetTypeIds: [1, 2, 3],
          PeriodIds: [1, 2],
          IsCombo: false,
          OddsType: 2,
          DateFrom: null,
          DateTo: null,
          CompetitionIds: [],
          SortType: 2,
          ProgrammeIds: []
      }),
    }),

    fetchJson<StakeHighrollerResponse>('https://stake.com/_api/graphql', {
      method: 'POST',
      headers: {
        'authority': 'stake.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://stake.com',
        'referer': 'https://stake.com/',
        'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'x-access-token': process.env.STAKE_ACCESS_TOKEN || '', 
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
        operationName: 'BetsBoard_HighrollerSportBets', // Add this too
      }),
    }),
  ]);

  console.log('✅ Providers fetched:');
  console.log('IMS PTDLS (DavidSureBet):', stakeGql);

  const markets: MarketOdds[] = [];

  const oneXMarkets = normalizeOneXBet(oneX);
  const stakeMarkets = normalizeStakeHighrollers(stakeGql);
  const imsMarkets = normalizeDavidSureBet(imsptdls);

  console.log('📊 Normalized market counts:', {
    oneX: oneXMarkets.length,
    stake: stakeMarkets.length,
    imsptdls: imsMarkets.length,
  });

  markets.push(...oneXMarkets);
  markets.push(...stakeMarkets);
  markets.push(...imsMarkets);

  console.log('📈 Total combined markets:', markets.length);

  const surebets = findSurebets(markets, {
    totalStake: isFinite(stake) ? stake : 100,
    minRoiPct: isFinite(minRoi) ? minRoi : 0,
  });

  console.log('💰 Surebets found:', surebets.length);
  if (surebets.length) {
    console.log('Example surebet:', surebets[0]);
  }

  return NextResponse.json({ count: surebets.length, surebets });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const markets = (body?.markets || []) as MarketOdds[];
    const totalStake = typeof body?.totalStake === 'number' ? body.totalStake : 100;
    const minRoiPct = typeof body?.minRoiPct === 'number' ? body.minRoiPct : 0;
    const surebets = findSurebets(markets, { totalStake, minRoiPct });
    return NextResponse.json({ surebets });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

