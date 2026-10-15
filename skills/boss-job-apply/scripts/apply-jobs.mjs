#!/usr/bin/env node
// Filter collected jobs by company size and salary, then send the greeting.
// Resumable: progress is stored in <outputDir>/apply-progress.json.
//
// Usage: node scripts/apply-jobs.mjs [config.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newTab, closeTab, evalIn, sleep, readJobDetail, clickChat, sendGreeting } from './cdp.mjs';

const configPath = process.argv[2] || fileURLToPath(new URL('./config.json', import.meta.url));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outDir = path.resolve(path.dirname(configPath), config.outputDir || './out');
fs.mkdirSync(outDir, { recursive: true });
const candidates = JSON.parse(fs.readFileSync(path.join(outDir, 'candidates.json'), 'utf8'));
const progressFile = path.join(outDir, 'apply-progress.json');

let state = { applied: 0, checked: [], results: [] };
if (fs.existsSync(progressFile)) {
  try { state = JSON.parse(fs.readFileSync(progressFile, 'utf8')); } catch {}
}
const checked = new Set(state.checked);
const sizeAllow = new Set(config.companySizeAllow || []);
const blocked = (config.blockedCompanies || []).map((s) => s.toLowerCase());
const limit = config.targetCount || 50;

function parseSalary(text) {
  const range = text.match(/(\d{2,4})-(\d{2,4})元\/天/);
  if (range) return { kind: 'daily', low: +range[1], high: +range[2] };
  const single = text.match(/(\d{2,4})元\/天/);
  if (single) return { kind: 'daily', low: +single[1], high: +single[1] };
  const monthly = text.match(/(\d{1,3})-(\d{1,3})K/);
  if (monthly) return { kind: 'monthly', low: +monthly[1], high: +monthly[2] };
  return null;
}

function qualifies(size, salary, campus) {
  if (!sizeAllow.has(size)) return { ok: false, why: 'company-size:' + size };
  const s = parseSalary(salary || '');
  if (!s) return { ok: false, why: 'salary-unparsed' };
  const value = (config.salaryMode === 'rangeMin') ? s.low : s.high;
  if (s.kind === 'daily') {
    if (value >= (config.dailyPayFloor ?? 200)) return { ok: true, why: 'daily>=' + (config.dailyPayFloor ?? 200) };
  } else if (s.kind === 'monthly' && campus) {
    if (value >= (config.campusMonthlyFloorK ?? 7)) return { ok: true, why: 'campus-monthly>=' + (config.campusMonthlyFloorK ?? 7) + 'K' };
  }
  return { ok: false, why: 'salary' };
}

for (const job of candidates) {
  if (state.applied >= limit) break;
  if (checked.has(job.href)) continue;
  if (blocked.some((b) => (job.company || '').toLowerCase().includes(b))) { checked.add(job.href); continue; }

  const { tabId, info } = await readJobDetail(job.href).catch(() => ({ tabId: null, info: null }));
  if (!info) { if (tabId) await closeTab(tabId); continue; }

  const decision = qualifies(info.size, info.salary, info.campus);
  checked.add(job.href);

  if (decision.ok) {
    try {
      const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
      const ws = tabs.find((t) => t.id === tabId)?.webSocketDebuggerUrl;
      await clickChat(ws);
      await sleep(6000);
      const tabs2 = await (await fetch('http://127.0.0.1:9222/json/list')).json();
      const ws2 = tabs2.find((t) => t.id === tabId)?.webSocketDebuggerUrl;
      const result = await sendGreeting(ws2, config.greeting);
      if (result === 'typed-sent' || result === 'already-sent') state.applied++;
      state.results.push({ ...job, size: info.size, salary: info.salary, decision: decision.why, result });
    } catch (e) {
      state.results.push({ ...job, size: info.size, salary: info.salary, error: String(e.message || e) });
    }
  } else {
    state.results.push({ ...job, size: info.size, salary: info.salary, skipped: decision.why });
  }

  state.checked = [...checked];
  fs.writeFileSync(progressFile, JSON.stringify(state, null, 2), 'utf8');
  if (tabId) await closeTab(tabId);
  await sleep(300);
}

console.log(JSON.stringify({ applied: state.applied, checked: state.checked.length }, null, 2));
