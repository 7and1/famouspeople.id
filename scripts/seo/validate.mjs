#!/usr/bin/env node
/**
 * SEO Validation Script (local or remote)
 *
 * Examples:
 *   node scripts/seo/validate.mjs --start-local
 *   node scripts/seo/validate.mjs --base-url https://famouspeople.id
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const getArgValue = (name) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
};

const baseUrlArg = getArgValue('--base-url');
const startLocal = args.has('--start-local');
const jsonOutput = args.has('--json');

const DEFAULT_LOCAL_PORT = 3100;

const withTimeout = async (promise, ms, label) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const fetchText = async (url, { timeoutMs = 10000 } = {}) => {
  return withTimeout(async (signal) => {
    const res = await fetch(url, { signal, redirect: 'follow' });
    const text = await res.text();
    return { status: res.status, headers: res.headers, text };
  }, timeoutMs, `fetch ${url}`);
};

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

const checkXml = (text, rootTag) => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('<?xml')) return false;
  return trimmed.includes(`<${rootTag}`) || trimmed.includes(`<${rootTag} `);
};

const result = {
  baseUrl: '',
  checks: [],
  summary: { pass: 0, warn: 0, fail: 0 },
};

const addCheck = (name, status, details) => {
  result.checks.push({ name, status, details });
  if (status === 'pass') result.summary.pass += 1;
  else if (status === 'warn') result.summary.warn += 1;
  else result.summary.fail += 1;
};

let serverProcess = null;
let baseUrl = baseUrlArg;

try {
  if (startLocal) {
    const port = Number(getArgValue('--port') || DEFAULT_LOCAL_PORT);
    baseUrl = `http://localhost:${port}`;

    const run = (cmd, argsList, cwd) =>
      new Promise((resolve, reject) => {
        const p = spawn(cmd, argsList, { cwd, stdio: 'inherit', env: process.env });
        p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
      });

    await run('npm', ['run', 'build'], 'web');

    serverProcess = spawn('npm', ['run', 'start'], {
      cwd: 'web',
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: String(port),
        NEXT_PUBLIC_SITE_URL: baseUrl,
      },
    });

    // Wait for server
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${baseUrl}/robots.txt`, { redirect: 'follow' });
        if (res.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }

  result.baseUrl = baseUrl;

  // robots.txt
  {
    const { status, text } = await fetchText(`${baseUrl}/robots.txt`);
    if (status !== 200) {
      addCheck('robots.txt status', 'fail', `Expected 200, got ${status}`);
    } else {
      addCheck('robots.txt status', 'pass', '200 OK');
    }

    if (/Sitemap:\s*\S+/i.test(text)) {
      addCheck('robots.txt sitemap', 'pass', 'Sitemap directive present');
    } else {
      addCheck('robots.txt sitemap', 'fail', 'Missing Sitemap directive');
    }
  }

  // sitemap.xml
  {
    const { status, text } = await fetchText(`${baseUrl}/sitemap.xml`);
    if (status !== 200) {
      addCheck('sitemap.xml status', 'fail', `Expected 200, got ${status}`);
    } else {
      addCheck('sitemap.xml status', 'pass', '200 OK');
    }

    if (checkXml(text, 'sitemapindex')) {
      addCheck('sitemap.xml format', 'pass', 'sitemapindex XML');
    } else if (checkXml(text, 'urlset')) {
      addCheck('sitemap.xml format', 'warn', 'urlset XML (expected sitemap index)');
    } else {
      addCheck('sitemap.xml format', 'fail', 'Invalid XML');
    }
  }

  // rss.xml
  {
    const { status, text } = await fetchText(`${baseUrl}/rss.xml`);
    if (status !== 200) {
      addCheck('rss.xml status', 'warn', `Expected 200, got ${status}`);
    } else {
      addCheck('rss.xml status', 'pass', '200 OK');
    }
    if (text.includes('<rss') && text.includes('<channel>')) {
      addCheck('rss.xml format', 'pass', 'RSS 2.0 XML');
    } else {
      addCheck('rss.xml format', 'warn', 'RSS XML missing <rss>/<channel>');
    }
  }

  // Homepage content checks
  {
    const { status, text } = await fetchText(`${baseUrl}/`);
    if (status !== 200) {
      addCheck('homepage status', 'fail', `Expected 200, got ${status}`);
    } else {
      addCheck('homepage status', 'pass', '200 OK');
    }

    const title = parseTagContent(text, 'title') || '';
    addCheck('homepage title length', title.length >= 40 && title.length <= 65 ? 'pass' : 'warn', `title length=${title.length}`);

    const description = parseMeta(text, 'description') || '';
    addCheck('homepage meta description', description.length >= 120 && description.length <= 170 ? 'pass' : 'warn', `description length=${description.length}`);

    const canonical = parseCanonical(text);
    addCheck('homepage canonical', canonical ? 'pass' : 'fail', canonical || 'Missing canonical');

    const h1Count = (text.match(/<h1[\s>]/gi) || []).length;
    addCheck('homepage H1', h1Count === 1 ? 'pass' : 'warn', `H1 count=${h1Count}`);

    const wordCount = countWords(stripHtml(text));
    addCheck(
      'homepage word count',
      wordCount >= 1500 && wordCount <= 2200 ? 'pass' : 'warn',
      `word count=${wordCount} (target 1500–2000)`
    );

    const ldJsonCount = (text.match(/application\/ld\+json/gi) || []).length;
    addCheck('homepage structured data', ldJsonCount >= 1 ? 'pass' : 'warn', `JSON-LD scripts=${ldJsonCount}`);

    const internalLinks = (text.match(new RegExp(`href="${baseUrl.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'g')) || []).length
      + (text.match(/href="\/(?!\/)/g) || []).length;
    addCheck('homepage internal links', internalLinks >= 3 ? 'pass' : 'warn', `internal links≈${internalLinks}`);
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(result, null, 2));
  } else {
    const lines = [
      `SEO validation for ${result.baseUrl}`,
      `Pass: ${result.summary.pass} | Warn: ${result.summary.warn} | Fail: ${result.summary.fail}`,
      '',
      ...result.checks.map((c) => `- [${c.status.toUpperCase()}] ${c.name}: ${c.details}`),
      '',
    ];
    process.stdout.write(lines.join('\n'));
  }

  if (result.summary.fail > 0) {
    process.exitCode = 1;
  }
} finally {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
}

