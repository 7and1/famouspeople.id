#!/usr/bin/env node
/**
 * Keyword opportunity generator (Top 20 clusters) with optional Keywords Everywhere metrics.
 *
 * Usage:
 *   node scripts/seo/keyword-opportunities.mjs
 *   KEYWORDS_EVERYWHERE_API_KEY=... node scripts/seo/keyword-opportunities.mjs --json
 */

import process from 'node:process';

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has('--json');

const API_KEY = process.env.KEYWORDS_EVERYWHERE_API_KEY || '';
const BASE_URL = 'https://api.keywordseverywhere.com/v1';

const COUNTRY = process.env.KEYWORDS_EVERYWHERE_COUNTRY || 'us';
const CURRENCY = process.env.KEYWORDS_EVERYWHERE_CURRENCY || 'USD';

const TOP_20 = [
  { keyword: '{name} net worth', intent: 'informational', page: 'Person profile', notes: 'Primary money query; include sources + update date.' },
  { keyword: '{name} net worth 2026', intent: 'informational', page: 'Person profile', notes: 'Freshness modifier; align updated_at and feed.' },
  { keyword: 'what is {name} net worth', intent: 'informational', page: 'Person profile', notes: 'Featured snippet target (40–60 word definition).' },
  { keyword: '{name} height', intent: 'informational', page: 'Person profile', notes: 'Add metric + imperial conversion; cite.' },
  { keyword: 'how tall is {name}', intent: 'informational', page: 'Person profile', notes: 'Snippet target; use FAQ schema question.' },
  { keyword: '{name} age', intent: 'informational', page: 'Person profile', notes: 'Age derived from birth date; show calculation.' },
  { keyword: 'how old is {name}', intent: 'informational', page: 'Person profile', notes: 'FAQ schema; keep answer short + factual.' },
  { keyword: '{name} birthday', intent: 'informational', page: 'Person profile', notes: 'Display and link to birthday hubs.' },
  { keyword: 'when is {name} birthday', intent: 'informational', page: 'Person profile', notes: 'Snippet target; avoid ambiguity (month/day).' },
  { keyword: '{name} zodiac sign', intent: 'informational', page: 'Person profile', notes: 'Link to `/zodiac/{sign}` for internal linking.' },
  { keyword: '{name} mbti', intent: 'informational', page: 'Person profile', notes: 'Personality query; link to `/mbti/{type}`.' },
  { keyword: '{name} spouse', intent: 'informational', page: 'Person profile', notes: 'If present in relationships graph; avoid speculation.' },
  { keyword: '{name} dating history', intent: 'informational', page: 'Relationships page', notes: 'Use relationship graph; include citations where possible.' },
  { keyword: '{name} children', intent: 'informational', page: 'Relationships page', notes: 'Family edges; avoid sensitive data if unknown.' },
  { keyword: '{name} parents', intent: 'informational', page: 'Relationships page', notes: 'Family edges; include sources if available.' },
  { keyword: '{name} nationality', intent: 'informational', page: 'Person profile', notes: 'Map to country hubs for internal links.' },
  { keyword: 'richest {occupation}', intent: 'informational', page: 'Ranking hub', notes: 'High-scale pSEO: occupation-based rankings.' },
  { keyword: 'tallest {occupation}', intent: 'informational', page: 'Ranking hub', notes: 'Height rankings by occupation.' },
  { keyword: '{name1} vs {name2} net worth', intent: 'commercial', page: 'Compare page', notes: 'Comparison intent; drive to `/compare/...`.' },
  { keyword: 'famous birthdays today', intent: 'informational', page: 'Birthday hub', notes: 'Already supported by `/birthday-today`.' },
];

async function getKeywordData(keywords) {
  if (!API_KEY) return null;

  const res = await fetch(`${BASE_URL}/get_keyword_data`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      country: COUNTRY,
      currency: CURRENCY,
      dataSource: 'gkp',
      kw: keywords,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Keywords Everywhere API error (${res.status}): ${text.slice(0, 160)}`);
  }

  return res.json();
}

function normalizeKeywordTemplate(template) {
  // Replace multi-vars with a stable “sample” so we can request metrics.
  return template
    .replaceAll('{name}', 'taylor swift')
    .replaceAll('{name1}', 'elon musk')
    .replaceAll('{name2}', 'jeff bezos')
    .replaceAll('{occupation}', 'actor');
}

async function main() {
  const payloadKeywords = TOP_20.map((k) => normalizeKeywordTemplate(k.keyword));
  let metrics = null;

  try {
    metrics = await getKeywordData(payloadKeywords);
  } catch (err) {
    // Fallback: report without metrics.
    metrics = null;
  }

  const metricMap = new Map();
  if (metrics?.data && Array.isArray(metrics.data)) {
    for (const row of metrics.data) {
      if (row && typeof row.keyword === 'string') metricMap.set(row.keyword, row);
    }
  }

  const results = TOP_20.map((row) => {
    const sampleKeyword = normalizeKeywordTemplate(row.keyword);
    const m = metricMap.get(sampleKeyword);
    return {
      ...row,
      sampleKeyword,
      volume: typeof m?.vol === 'number' ? m.vol : null,
      competition: typeof m?.competition === 'number' ? m.competition : null,
      cpc: typeof m?.cpc?.value === 'string' ? m.cpc.value : null,
      creditsConsumed: typeof metrics?.credits_consumed === 'number' ? metrics.credits_consumed : null,
    };
  });

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), country: COUNTRY, currency: CURRENCY, hasApiKey: !!API_KEY, results }, null, 2)}\n`);
    return;
  }

  const lines = [
    `Top 20 keyword opportunities (${new Date().toISOString()})`,
    `Country: ${COUNTRY} | Currency: ${CURRENCY} | Keywords Everywhere: ${API_KEY ? 'enabled' : 'not configured (set KEYWORDS_EVERYWHERE_API_KEY)'}`,
    '',
    '| Keyword Template | Sample Keyword | Intent | Target Page | Vol | Comp | CPC | Notes |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | --- |',
    ...results.map((r) => `| ${r.keyword} | ${r.sampleKeyword} | ${r.intent} | ${r.page} | ${r.volume ?? ''} | ${r.competition ?? ''} | ${r.cpc ?? ''} | ${r.notes} |`),
    '',
  ];
  process.stdout.write(lines.join('\n'));
}

await main();

