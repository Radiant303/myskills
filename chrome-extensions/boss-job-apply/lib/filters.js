// Pure filtering helpers. No DOM access, so these are easy to reason about
// and reuse. Loaded as a classic content script, so it attaches to window.
(function () {
  'use strict';

  const SIZE_BUCKETS = ['0-20人', '20-99人', '100-499人', '500-999人', '1000-9999人', '10000人以上'];

  function parseSalary(text) {
    if (!text) return null;
    const range = text.match(/(\d{2,4})-(\d{2,4})元\/天/);
    if (range) return { kind: 'daily', low: +range[1], high: +range[2], raw: range[0] };
    const single = text.match(/(\d{2,4})元\/天/);
    if (single) return { kind: 'daily', low: +single[1], high: +single[1], raw: single[0] };
    const monthly = text.match(/(\d{1,3})-(\d{1,3})K/);
    if (monthly) return { kind: 'monthly', low: +monthly[1], high: +monthly[2], raw: monthly[0] };
    const monthlySingle = text.match(/(\d{1,3})K/);
    if (monthlySingle) return { kind: 'monthly', low: +monthlySingle[1], high: +monthlySingle[1], raw: monthlySingle[0] };
    return null;
  }

  function findSize(text) {
    if (!text) return null;
    for (const bucket of SIZE_BUCKETS) if (text.includes(bucket)) return bucket;
    return null;
  }

  function titleMatches(title, keywords) {
    if (!keywords || !keywords.length) return true;
    const t = (title || '').toLowerCase();
    return keywords.some((k) => k && t.includes(String(k).toLowerCase()));
  }

  function isBlocked(company, blocked) {
    if (!company || !blocked || !blocked.length) return false;
    const c = company.toLowerCase();
    return blocked.some((b) => b && c.includes(String(b).toLowerCase()));
  }

  // Decide whether a job passes the user's filters.
  // options: { sizeAllow:[], dailyPayFloor, campusMonthlyFloorK, salaryMode:'rangeMax'|'rangeMin' }
  function evaluateJob(job, options) {
    const sizeAllow = options.sizeAllow || [];
    if (sizeAllow.length && !sizeAllow.includes(job.size)) {
      return { ok: false, why: '公司规模 ' + (job.size || '未知') };
    }
    const salary = parseSalary(job.salary);
    if (!salary) return { ok: false, why: '薪资无法识别' };
    const value = options.salaryMode === 'rangeMin' ? salary.low : salary.high;
    if (salary.kind === 'daily') {
      if (value >= (options.dailyPayFloor ?? 200)) return { ok: true, why: '日薪 ' + salary.raw };
      return { ok: false, why: '日薪低于 ' + (options.dailyPayFloor ?? 200) };
    }
    if (job.campus && value >= (options.campusMonthlyFloorK ?? 7)) {
      return { ok: true, why: '校招月薪 ' + salary.raw };
    }
    return { ok: false, why: '不满足薪资条件' };
  }

  window.BossFilters = {
    SIZE_BUCKETS, parseSalary, findSize, titleMatches, isBlocked, evaluateJob,
  };
})();
