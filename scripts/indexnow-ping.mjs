// IndexNow ping — notifies Bing, Yandex, Seznam, Naver of URLs.
// Run AFTER Netlify deploys the key file at /<key>.txt.
//   node scripts/indexnow-ping.mjs

const HOST = 'myneatflow.com';
const KEY  = '6cc525d36e7f47979c65255994221a3f';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/blog/`,
  `https://${HOST}/about/`,
  `https://${HOST}/contact/`,
  `https://${HOST}/blog/ar-automation-for-it-services-and-msps-a-2026-buyers-guide/`,
  `https://${HOST}/blog/ar-recovery-system-should-you-build-it-yourself-or-buy/`,
  `https://${HOST}/blog/best-ar-automation-tools-for-small-b2b-service-firms-in-2026/`,
  `https://${HOST}/blog/cash-flow-problems-in-small-b2b-service-firms-2026-statistics-roundup/`,
  `https://${HOST}/blog/how-a-12-person-agency-recovered-47000-in-overdue-invoices-in-60-days/`,
  `https://${HOST}/blog/how-ai-agents-handle-invoice-disputes-and-partial-payments-in-2026/`,
  `https://${HOST}/blog/how-to-write-a-late-invoice-reminder-email-that-actually-works/`,
  `https://${HOST}/blog/quickbooks-vs-xero-vs-freshbooks-for-ar-in-service-businesses/`,
  `https://${HOST}/blog/the-hidden-cost-of-chasing-invoices-in-a-small-b2b-agency/`,
  `https://${HOST}/blog/when-to-hire-an-ar-clerk-vs-automate-accounts-receivable/`,
  `https://${HOST}/blog/automating-personal-email-with-claude-what-actually-works/`,
  `https://${HOST}/blog/whatsapp-automation-for-small-business-with-n8n-and-claude/`,
];

async function checkKeyLive() {
  const r = await fetch(KEY_LOCATION);
  if (!r.ok) throw new Error(`Key file not reachable: ${KEY_LOCATION} (${r.status})`);
  const body = (await r.text()).trim();
  if (body !== KEY) throw new Error(`Key file content mismatch. Got "${body}", expected "${KEY}".`);
  console.log(`✓ Key file live at ${KEY_LOCATION}`);
}

async function ping() {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URLS,
  };
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow response: ${r.status} ${r.statusText}`);
  const text = await r.text();
  if (text) console.log(`Body: ${text}`);
  if (r.status >= 200 && r.status < 300) {
    console.log(`✓ ${URLS.length} URLs submitted to Bing/Yandex/Seznam/Naver`);
  } else {
    console.error(`✗ Submission failed`);
    process.exit(1);
  }
}

await checkKeyLive();
await ping();
