#!/usr/bin/env node
// Collect deduplicated BOSS直聘 job-detail links for the configured cities and
// queries. Writes <outputDir>/candidates.json.
//
// Usage: node scripts/collect-candidates.mjs [config.json]
import fs from 'node:fs';
import path from 'node:path';
import { newTab, closeTab, evalIn, sleep } from './cdp.mjs';

const configPath = process.argv[2] || new URL('./config.json', import.meta.url).pathname.replace(/^\//, '');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outDir = path.resolve(path.dirname(configPath), config.outputDir || './out');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'candidates.json');

const READ_CARDS = `(function(){
  var out = [];
  var cards = document.querySelectorAll('.job-card-box');
  for (var i = 0; i < cards.length; i++) {
    var a = cards[i].querySelector('a');
    out.push({
      href: (a && a.getAttribute('href')) || '',
      lines: (cards[i].innerText || '').split(String.fromCharCode(10)),
    });
  }
  return out;
})()`;

let rows = [];
if (fs.existsSync(outFile)) {
  try { rows = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch { rows = []; }
}
const seen = new Set(rows.map((r) => r.href));
const titleInclude = (config.titleInclude || ['java']).map((s) => s.toLowerCase());
const freshRe = new RegExp(config.freshnessPattern || '.', 'i');

let added = 0;
for (const city of config.cities) {
  for (const q of config.queries) {
    let tab;
    try {
      tab = await newTab('https://www.zhipin.com/web/geek/jobs?city=' + city.code + '&query=' + encodeURIComponent(q));
    } catch { continue; }
    await sleep(6500);
    let cards = [];
    try { cards = await evalIn(tab.webSocketDebuggerUrl, READ_CARDS); } catch {}
    if (Array.isArray(cards)) {
      for (const c of cards) {
        const title = (c.lines || [])[0] || '';
        if (!titleInclude.some((k) => title.toLowerCase().includes(k))) continue;
        if (!freshRe.test((c.lines || []).join(' '))) continue;
        if (!c.href || seen.has(c.href)) continue;
        seen.add(c.href);
        let company = '';
        for (let k = 2; k < c.lines.length; k++) {
          if (/[·]/.test(c.lines[k]) || c.lines[k] === city.name) { company = c.lines[k - 1] || ''; break; }
        }
        rows.push({ city: city.name, title, company, href: c.href });
        added++;
      }
    }
    await closeTab(tab.id);
    await sleep(300);
  }
}
fs.writeFileSync(outFile, JSON.stringify(rows, null, 2), 'utf8');
console.log(JSON.stringify({ total: rows.length, added, outFile }, null, 2));
