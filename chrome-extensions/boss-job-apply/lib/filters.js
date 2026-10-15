// Pure filtering helpers. No DOM access, so these are easy to reason about
// and reuse. Loaded as a classic content script, so it attaches to window.
(function () {
  'use strict';

  const SIZE_BUCKETS = ['0-20人', '20-99人', '100-499人', '500-999人', '1000-9999人', '10000人以上'];

  const EDUCATION_BUCKETS = ['学历不限', '初中及以下', '高中', '中专/中技', '大专', '本科', '硕士', '博士'];
  function normalizeEducation(value) {
    const s = String(value || '').trim().replace(/\s+/g, '').replace(/^学历[：:]?/, '');
    const groups = {
      '学历不限': ['不限', '无学历要求'],
      '初中及以下': ['初中及以下', '初中'],
      '高中': ['高中', '高中及以上'],
      '中专/中技': ['中专/中技', '中专', '中技'],
      '大专': ['大专', '大学专科', '专科', '大专及以上', '专科及以上'],
      '本科': ['本科', '大学本科', '全日制本科', '本科及以上', '全日制本科及以上'],
      '硕士': ['硕士', '硕士及以上', '研究生', '硕士研究生', '研究生/硕士'],
      '博士': ['博士', '博士及以上', '博士研究生'],
    };
    if (s === '学历不限' || s === '不限学历') return '学历不限';
    return Object.keys(groups).find((key) => groups[key].includes(s)) || null;
  }

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
    const education = normalizeEducation(job.education);
    const educationAllow = options.educationAllow || ['本科', '学历不限'];
    if (!education) return { ok: false, why: '学历未知，跳过' };
    if (!educationAllow.includes(education)) return { ok: false, why: '学历不匹配：' + education };
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
    SIZE_BUCKETS, EDUCATION_BUCKETS, normalizeEducation, parseSalary, findSize, titleMatches, isBlocked, evaluateJob,
  };
})();
