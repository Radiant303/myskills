import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE;
// Optional browser fixture suite. Set PLAYWRIGHT_MODULE + BROWSER_EXECUTABLE locally.
// Never contacts BOSS or sends a real message.
test('browser fixtures: education controls, legacy config and skip behavior', { skip: !modulePath }, async () => {
  const pw = await import(modulePath.startsWith('file:') ? modulePath : pathToFileURL(modulePath).href);
  const browser = await (pw.chromium || pw.default.chromium).launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
  try {
    const page = await browser.newPage();
    await page.setContent('<li class="job-card-box"><a class="job-name" href="/job_detail/1234567890abcdefTEST.html">Java实习生</a><span class="boss-name">测试科技</span></li><div class="job-detail-container"><div class="job-detail-header"><span class="job-name">Java实习生</span><span class="job-salary">200-300元/天</span><ul class="tag-list"><li>深圳</li><li>硕士</li></ul><a ka="cpc_job_list_chat_1234567890abcdefTEST" class="op-btn-chat">立即沟通</a></div><span>20-99人</span></div>');
    await page.evaluate(() => {
      window.chatClicks = 0;
      document.querySelector('.op-btn-chat').onclick = () => { window.chatClicks++; };
      window.chrome = { runtime: { getURL: () => 'data:text/css,' }, storage: { local: { get: (_, cb) => cb({ bossApplyConfig: { titleKeywords: 'java' } }), set: value => { window.savedConfig = value; } } } };
    });
    for (const f of ['lib/filters.js','lib/dom.js','content/panel.js']) await page.addScriptTag({ content: await fs.readFile(new URL('../chrome-extensions/boss-job-apply/' + f, import.meta.url), 'utf8') });
    const shadow = page.locator('#boss-apply-panel-host');
    await page.waitForFunction(() => document.getElementById('boss-apply-panel-host')?.shadowRoot.querySelector('#greeting').value);
    const defaults = await page.evaluate(() => [...document.getElementById('boss-apply-panel-host').shadowRoot.querySelectorAll('#educationChecks input:checked')].map(x => x.value));
    assert.deepEqual(defaults, ['学历不限','本科']);
    assert.equal(await shadow.locator('#educationChecks input').count(), 8);
    await shadow.locator('#start').click();
    await page.waitForFunction(() => document.getElementById('boss-apply-panel-host').shadowRoot.querySelector('#log').innerText.includes('学历不匹配：硕士'));
    assert.equal(await page.evaluate(() => window.chatClicks), 0);
    assert.deepEqual(await page.evaluate(() => window.savedConfig.bossApplyConfig.educationAllow), ['学历不限','本科']);
    // The all-skipped run must finish instead of retrying the same card forever.
    await page.waitForFunction(() => !document.getElementById('boss-apply-panel-host').shadowRoot.querySelector('#start').disabled);
    for (const box of await shadow.locator('#educationChecks input').all()) await box.uncheck();
    await shadow.locator('#start').click();
    await page.waitForFunction(() => document.getElementById('boss-apply-panel-host').shadowRoot.querySelector('#log').innerText.includes('请勾选学历'));
    assert.equal(await page.evaluate(() => window.chatClicks), 0);
  } finally { await browser.close(); }
});
