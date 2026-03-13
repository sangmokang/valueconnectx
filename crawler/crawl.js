/*
  QA crawler using Playwright.
  - Starts from one or more base URLs
  - Restricts crawl to allowed hosts (by default, hosts of the base URLs)
  - BFS discovers <a href> links
  - Saves screenshot and HTML per page
  - Records status, title, console errors, and network failures

  Usage examples:
    node crawl.js --url https://route-online-79776131.figma.site/ --out ./out --max 1000 --concurrency 4
    node crawl.js --url https://example.com --url https://prod.example.com --stay-same-host
*/

const fs = require('fs');
const path = require('path');
const { chromium, firefox, webkit } = require('playwright');

// ---- CLI args ----
function parseArgs(argv) {
  const args = {
    urls: [],
    outDir: path.resolve(process.cwd(), 'out'),
    maxPages: 2000,
    concurrency: 4,
    browser: 'chromium', // chromium | firefox | webkit
    sameHost: true,
    includeHashRoutes: false, // set true if site uses hash-based routing as pages
    waitUntil: 'networkidle',
    navTimeoutMs: 30000,
    screenshotFullPage: true
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' || a === '-u') {
      args.urls.push(argv[++i]);
    } else if (a === '--out' || a === '-o') {
      args.outDir = path.resolve(argv[++i]);
    } else if (a === '--max') {
      args.maxPages = Number(argv[++i]);
    } else if (a === '--concurrency' || a === '-c') {
      args.concurrency = Number(argv[++i]);
    } else if (a === '--browser' || a === '-b') {
      args.browser = argv[++i];
    } else if (a === '--stay-same-host') {
      args.sameHost = true;
    } else if (a === '--no-same-host') {
      args.sameHost = false;
    } else if (a === '--hash-routes') {
      args.includeHashRoutes = true;
    } else if (a === '--wait-until') {
      args.waitUntil = argv[++i]; // load | domcontentloaded | networkidle | commit
    } else if (a === '--timeout') {
      args.navTimeoutMs = Number(argv[++i]);
    } else if (a === '--no-fullpage') {
      args.screenshotFullPage = false;
    }
  }
  if (args.urls.length === 0) {
    console.error('Error: Provide at least one --url');
    process.exit(1);
  }
  return args;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    // Normalize: lower-case protocol/host, remove default ports, remove trailing slash except root
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();
    if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
      u.port = '';
    }
    // Clean up multiple slashes
    u.pathname = u.pathname.replace(/\/+/, '/');
    // Remove trailing slash except root
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    // Keep query params as part of identity; they can represent detail pages
    return u.toString();
  } catch (e) {
    return null;
  }
}

function isSameHost(target, allowedHosts) {
  try {
    const u = new URL(target);
    return allowedHosts.has(u.host);
  } catch {
    return false;
  }
}

function isHttpUrl(raw) {
  return /^https?:\/\//i.test(raw);
}

function shouldVisit(href) {
  if (!href) return false;
  if (href.startsWith('javascript:')) return false;
  if (href.startsWith('mailto:')) return false;
  if (href.startsWith('tel:')) return false;
  return isHttpUrl(href) || href.startsWith('/') || href.startsWith('#');
}

function urlToPath(u) {
  // Create filesystem-friendly path under host directory.
  const url = new URL(u);
  const base = url.hostname;
  let fileSafePath = url.pathname;
  if (fileSafePath === '' || fileSafePath === '/') fileSafePath = '/index';
  // Replace special chars and ensure nested dirs are represented
  const q = url.search ? '_' + url.search.slice(1).replace(/[^a-zA-Z0-9._=-]+/g, '-') : '';
  const h = url.hash ? '_' + url.hash.slice(1).replace(/[^a-zA-Z0-9._=-]+/g, '-') : '';
  const full = path.join(base, fileSafePath) + q + h;
  return full.replace(/\/+/, '/');
}

async function extractLinks(page, includeHash, baseUrl) {
  const anchors = await page.$$eval('a[href]', (as) => as.map(a => a.getAttribute('href') || ''));
  const out = new Set();
  for (const href of anchors) {
    if (!shouldVisit(href)) continue;
    // Resolve relative
    let abs;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (!includeHash) {
      // Drop hash if we are not treating them as routes
      const u = new URL(abs);
      u.hash = '';
      abs = u.toString();
    }
    out.add(abs);
  }
  return [...out];
}

async function createBrowser(name) {
  if (name === 'chromium') return chromium.launch({ headless: true });
  if (name === 'firefox') return firefox.launch({ headless: true });
  if (name === 'webkit') return webkit.launch({ headless: true });
  throw new Error(`Unknown browser: ${name}`);
}

async function crawl(opts) {
  const allowedHosts = new Set();
  for (const u of opts.urls) allowedHosts.add(new URL(u).host);

  const outScreens = path.join(opts.outDir, 'screenshots');
  const outHtml = path.join(opts.outDir, 'html');
  const outData = path.join(opts.outDir, 'data');
  ensureDir(outScreens); ensureDir(outHtml); ensureDir(outData);

  const report = {
    startedAt: new Date().toISOString(),
    options: {
      urls: opts.urls,
      maxPages: opts.maxPages,
      concurrency: opts.concurrency,
      browser: opts.browser,
      sameHost: opts.sameHost,
      includeHashRoutes: opts.includeHashRoutes
    },
    pages: [],
    errors: [],
    networkErrors: []
  };

  const toVisit = [];
  const enqueued = new Set();
  const visited = new Set();

  function enqueue(u) {
    const n = normalizeUrl(u);
    if (!n) return;
    if (enqueued.has(n)) return;
    if (opts.sameHost && !isSameHost(n, allowedHosts)) return;
    enqueued.add(n);
    toVisit.push(n);
  }

  for (const u of opts.urls) enqueue(u);

  const browser = await createBrowser(opts.browser);
  const ctx = await browser.newContext();

  const workers = new Array(Math.max(1, opts.concurrency)).fill(null).map((_, idx) => (async () => {
    while (report.pages.length < opts.maxPages && toVisit.length > 0) {
      const url = toVisit.shift();
      if (!url || visited.has(url)) continue;
      visited.add(url);

      const page = await ctx.newPage();
      const pageMeta = {
        url,
        title: '',
        status: null,
        ok: false,
        console: [],
        requests: [],
        responses: [],
        failedRequests: []
      };

      page.on('console', (msg) => {
        pageMeta.console.push({ type: msg.type(), text: msg.text() });
      });
      page.on('requestfailed', (req) => {
        pageMeta.failedRequests.push({ url: req.url(), method: req.method(), failure: req.failure() });
      });
      page.on('response', (res) => {
        const status = res.status();
        if (status >= 400) {
          report.networkErrors.push({ page: url, resource: res.url(), status });
        }
      });

      try {
        const resp = await page.goto(url, { waitUntil: opts.waitUntil, timeout: opts.navTimeoutMs });
        pageMeta.status = resp ? resp.status() : null;
        pageMeta.ok = resp ? resp.ok() : false;
        pageMeta.title = (await page.title()) || '';

        // Discover links
        const links = await extractLinks(page, opts.includeHashRoutes, url);
        for (const link of links) enqueue(link);

        // Save assets
        const rel = urlToPath(url);
        const pngPath = path.join(outScreens, rel + '.png');
        const htmlPath = path.join(outHtml, rel + '.html');
        ensureDir(path.dirname(pngPath));
        ensureDir(path.dirname(htmlPath));
        await page.screenshot({ path: pngPath, fullPage: opts.screenshotFullPage });
        const html = await page.content();
        fs.writeFileSync(htmlPath, html);

        report.pages.push({ ...pageMeta, assets: { screenshot: pngPath, html: htmlPath } });
        console.log(`[${idx}] Visited (${report.pages.length}):`, url);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        report.errors.push({ url, error: msg });
        console.error(`[${idx}] Error:`, url, msg);
      } finally {
        await page.close().catch(() => {});
      }
    }
  })());

  await Promise.all(workers);
  await ctx.close();
  await browser.close();

  report.finishedAt = new Date().toISOString();
  const reportPath = path.join(outData, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('Crawl complete. Report at:', reportPath);
}

(async () => {
  const opts = parseArgs(process.argv);
  await crawl(opts);
})();

