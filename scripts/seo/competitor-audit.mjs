#!/usr/bin/env node
/**
 * Competitor SEO audit script (fetches pages and extracts comparable metrics).
 *
 * Examples:
 *   node scripts/seo/competitor-audit.mjs
 *   node scripts/seo/competitor-audit.mjs --json
 *   node scripts/seo/competitor-audit.mjs https://example.com/page https://example.org/page
 */

import process from 'node:process';

const DEFAULT_URLS = [
  'https://www.famousbirthdays.com/people/taylor-swift.html',
  'https://www.celebritynetworth.com/richest-celebrities/singers/taylor-swift-net-worth/',
  'https://www.celebheights.com/s/Taylor-Swift-46917.html',
];

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const urls = args.filter((a) => !a.startsWith('--'));

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const withTimeout = async (promise, ms) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const fetchHtml = async (url, { timeoutMs = 15000 } = {}) => withTimeout(async (signal) => {
  const res = await fetch(url, {
    signal,
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
  });
  const text = await res.text().catch(() => '');
  return {
    url,
    finalUrl: res.url,
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    text,
  };
}, timeoutMs);

const stripHtml = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const countWords = (text) => {
  const cleaned = text.replace(/[^\p{L}\p{N}\s'-]+/gu, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length;
};

const parseTagContent = (html, tag) => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};

const parseMeta = (html, name) => {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  const m = html.match(re);
  if (!m) return null;
  const tag = m[0];
  const contentMatch = tag.match(/content=["']([^"']+)["']/i);
  return contentMatch ? contentMatch[1] : null;
};

const parseCanonical = (html) => {
  const re = /<link[^>]+rel=["']canonical["'][^>]*>/i;
  const m = html.match(re);
  if (!m) return null;
  const tag = m[0];
  const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
};

const getOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
};

const countInternalLinks = (html, baseUrl) => {
  const origin = getOrigin(baseUrl);
  if (!origin) return 0;

  const hrefs = Array.from(html.matchAll(/href=["']([^"'#]+)["']/gi)).map((m) => m[1]);
  const isInternal = (href) => href.startsWith('/') || href.startsWith(origin);
  return hrefs.filter(isInternal).length;
};

const extractJsonLdBlocks = (html) => {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    const raw = match[1]?.trim();
    if (raw) blocks.push(raw);
  }
  return blocks;
};

const collectSchemaTypes = (value, types) => {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const v of value) collectSchemaTypes(v, types);
    return;
  }
  if (typeof value === 'object') {
    const type = value['@type'];
    if (typeof type === 'string') types.add(type);
    else if (Array.isArray(type)) type.filter((t) => typeof t === 'string').forEach((t) => types.add(t));
    if (value['@graph']) collectSchemaTypes(value['@graph'], types);
  }
};

const parseJsonLdTypes = (html) => {
  const blocks = extractJsonLdBlocks(html);
  const types = new Set();
  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      collectSchemaTypes(parsed, types);
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }
  return Array.from(types).sort();
};

const auditOne = async (url) => {
  try {
    const { finalUrl, status, contentType, text } = await fetchHtml(url);
    const title = parseTagContent(text, 'title') || '';
    const description = parseMeta(text, 'description') || '';
    const canonical = parseCanonical(text);
    const h1Count = (text.match(/<h1[\s>]/gi) || []).length;
    const ldJsonBlocks = extractJsonLdBlocks(text);
    const schemaTypes = parseJsonLdTypes(text);
    const words = countWords(stripHtml(text));
    const internalLinks = countInternalLinks(text, finalUrl);

    return {
      url,
      finalUrl,
      status,
      contentType,
      title,
      titleLength: title.length,
      descriptionLength: description.length,
      canonical,
      h1Count,
      wordCount: words,
      jsonLdBlocks: ldJsonBlocks.length,
      schemaTypes,
      internalLinks,
    };
  } catch (err) {
    return {
      url,
      finalUrl: null,
      status: 0,
      contentType: '',
      title: '',
      titleLength: 0,
      descriptionLength: 0,
      canonical: null,
      h1Count: 0,
      wordCount: 0,
      jsonLdBlocks: 0,
      schemaTypes: [],
      internalLinks: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

const main = async () => {
  const list = (urls.length > 0 ? urls : DEFAULT_URLS);
  const results = await Promise.all(list.map((u) => auditOne(u)));

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
    return;
  }

  const lines = [
    `Competitor audit (${new Date().toISOString()})`,
    '',
    '| URL | Status | Words | H1 | Title | Desc | Canonical | JSON-LD | Schema Types |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- |',
    ...results.map((r) => {
      const urlShort = r.finalUrl || r.url;
      const canonicalShort = r.canonical ? r.canonical : '';
      const schema = (r.schemaTypes || []).slice(0, 6).join(', ') + ((r.schemaTypes || []).length > 6 ? ', …' : '');
      return `| ${urlShort} | ${r.status} | ${r.wordCount} | ${r.h1Count} | ${r.titleLength} | ${r.descriptionLength} | ${canonicalShort} | ${r.jsonLdBlocks} | ${schema} |`;
    }),
    '',
    'Tip: run with `--json` for machine-readable output.',
    '',
  ];
  process.stdout.write(lines.join('\n'));
};

await main();

