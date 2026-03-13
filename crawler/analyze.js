/*
  Analyze crawler report.json against PRD expected routes.

  Usage:
    node analyze.js --prd ../prd4.1.3.md --report ./out/data/report.json [--host example.com]

  Outputs a console summary and writes a JSON diff alongside the report.
*/

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { prdPath: null, reportPath: null, host: null, outPath: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prd') args.prdPath = argv[++i];
    else if (a === '--report') args.reportPath = argv[++i];
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--out') args.outPath = argv[++i];
  }
  if (!args.prdPath || !args.reportPath) {
    console.error('Usage: node analyze.js --prd <path.md> --report <report.json> [--host host]');
    process.exit(1);
  }
  return args;
}

function extractExpectedRoutes(prdMarkdown) {
  const expected = new Set(['/']);
  // From the site map table rows like: | **서비스 소개** | `/service-overview` | ... |
  const tableRegex = /\|\s*\*\*[^|]*\*\*\s*\|\s*`([^`]+)`\s*\|/g;
  let m;
  while ((m = tableRegex.exec(prdMarkdown)) !== null) {
    expected.add(m[1].trim());
  }
  // From Appendix ASCII map lines like: ├── /service-overview (서비스 소개)
  const lines = prdMarkdown.split(/\r?\n/);
  for (const line of lines) {
    const mm = line.match(/[├└]──\s+(\/[a-zA-Z0-9\-_/]+)/);
    if (mm) expected.add(mm[1]);
  }
  return [...expected];
}

function urlToRoute(u) {
  try {
    const url = new URL(u);
    return { host: url.host, path: url.pathname || '/' };
  } catch {
    return null;
  }
}

function analyze({ prdPath, reportPath, host, outPath }) {
  const prd = fs.readFileSync(prdPath, 'utf8');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  const expectedRoutes = extractExpectedRoutes(prd);
  const pages = report.pages || [];

  const foundByRoute = new Map();
  for (const p of pages) {
    const u = urlToRoute(p.url);
    if (!u) continue;
    if (host && u.host !== host) continue;
    const key = u.path || '/';
    if (!foundByRoute.has(key)) foundByRoute.set(key, []);
    foundByRoute.get(key).push({ url: p.url, status: p.status, ok: p.ok, title: p.title, assets: p.assets });
  }

  const foundRoutes = [...foundByRoute.keys()].sort();

  const missing = expectedRoutes.filter(r => !foundByRoute.has(r)).sort();
  const covered = expectedRoutes.filter(r => foundByRoute.has(r)).sort();
  const extras = foundRoutes.filter(r => !expectedRoutes.includes(r));

  // Status breakdown for covered
  const coveredStatus = covered.map(r => {
    const entries = foundByRoute.get(r) || [];
    const best = entries.find(e => e.ok) || entries[0];
    return { route: r, status: best?.status ?? null, ok: !!best?.ok, url: best?.url ?? null, title: best?.title ?? '' };
  });

  const summary = {
    host: host || null,
    expectedCount: expectedRoutes.length,
    visitedCount: foundRoutes.length,
    coveredCount: covered.length,
    missingCount: missing.length,
    extraCount: extras.length
  };

  const diff = { summary, expectedRoutes, foundRoutes, coveredStatus, missing, extras };
  const defaultOut = path.join(path.dirname(reportPath), 'diff.json');
  const out = outPath ? path.resolve(outPath) : defaultOut;
  fs.writeFileSync(out, JSON.stringify(diff, null, 2));

  // Console summary
  console.log('--- Coverage Summary ---');
  console.log(`Expected routes: ${summary.expectedCount}`);
  console.log(`Visited routes:  ${summary.visitedCount}`);
  console.log(`Covered:         ${summary.coveredCount}`);
  console.log(`Missing:         ${summary.missingCount}`);
  console.log(`Extras:          ${summary.extraCount}`);
  if (missing.length) {
    console.log('\nMissing routes:');
    for (const r of missing) console.log(' -', r);
  }
  if (extras.length) {
    console.log('\nExtra routes discovered:');
    for (const r of extras) console.log(' -', r);
  }
  console.log('\nDiff written to:', out);
}

const args = parseArgs(process.argv);
analyze(args);

