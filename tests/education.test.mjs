import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../chrome-extensions/boss-job-apply/', import.meta.url);
function load(doc = {}) {
  const ctx = vm.createContext({ window: {}, document: doc, setTimeout });
  for (const f of ['lib/filters.js', 'lib/dom.js']) vm.runInContext(fs.readFileSync(new URL(f, root), 'utf8'), ctx);
  return { F: ctx.window.BossFilters, D: ctx.window.BossDom };
}
const options = { sizeAllow: ['20-99人'], educationAllow: ['本科', '学历不限'], dailyPayFloor: 200, salaryMode: 'rangeMin' };
const job = { size: '20-99人', salary: '200-300元/天', campus: true };
test('education: explicit requirements only, supported aliases', () => {
  const { F } = load();
  for (const [input, output] of [['本科及以上','本科'],['全日制本科','本科'],['大学专科','大专'],['研究生/硕士','硕士'],['不限学历','学历不限'],['中专/中技','中专/中技']]) assert.equal(F.normalizeEducation(input), output);
  assert.equal(F.normalizeEducation('我们欢迎本科或硕士学生'), null);
  assert.equal(F.normalizeEducation(''), null);
  assert.equal(F.normalizeEducation('本科/硕士'), null);
});
test('education: bachelor passes; master, unknown, empty selections fail closed', () => {
  const { F } = load();
  assert.equal(F.evaluateJob({ ...job, education: '本科' }, options).ok, true);
  assert.equal(F.evaluateJob({ ...job, education: '学历不限' }, options).ok, true);
  for (const education of ['硕士','博士',null,undefined]) assert.equal(F.evaluateJob({ ...job, education }, options).ok, false);
  assert.equal(F.evaluateJob({ ...job, education: '本科' }, { ...options, educationAllow: [] }).ok, false);
  assert.match(F.evaluateJob({ ...job, education: null }, options).why, /学历/);
});
test('salary and company-size checks still apply', () => {
  const { F } = load();
  assert.equal(F.evaluateJob({ ...job, education: '本科', salary: '150-250元/天' }, options).ok, false);
  assert.equal(F.evaluateJob({ ...job, education: '本科', size: '10000人以上' }, options).ok, false);
});
function el(text, selectors = {}) {
  return { innerText: text, textContent: text, querySelector: (s) => s.split(',').map(x => x.trim()).map(x => selectors[x]).find(Boolean) ?? null, querySelectorAll: (s) => selectors[s] ?? [], getAttribute: () => null };
}
test('detail: only selected pane, no education from other cards or injected UI', () => {
  const { D } = load({ body: { innerText: '其他岗位 本科 公司规模 20-99人' }, querySelector: () => null, querySelectorAll: () => [] });
  const pane = el('Java研发 硕士 200-300元/天', { '.job-title': el('Java研发'), '.job-info': el('深圳 5天/周 6个月 硕士', { 'li,span,p': [el('深圳'),el('硕士')] }) });
  const d = D.readDetail(pane);
  assert.equal(d.education, '硕士');
  assert.equal(d.size, null);
  assert.equal(D.readDetail(null).education, null);
});
test('detail: degree words in description do not count as a requirement', () => {
  const { D } = load();
  const pane = el('职位描述：与本科、硕士团队合作', { '.job-info': el('深圳 经验不限', { 'li,span,p': [el('深圳'),el('经验不限')] }) });
  assert.equal(D.readDetail(pane).education, null);
});
test('detail: job identity must match the selected card', () => {
  const { D } = load();
  assert.equal(D.detailMatches({ title:'Java实习生',company:'A科技' }, { title:'Java实习生',company:'A科技' }), true);
  assert.equal(D.detailMatches({ title:'Java实习生',company:'B科技' }, { title:'Java实习生',company:'A科技' }), false);
  assert.equal(D.detailMatches({ title:'后端工程师',company:'A科技' }, { title:'Java实习生',company:'A科技' }), false);
});
