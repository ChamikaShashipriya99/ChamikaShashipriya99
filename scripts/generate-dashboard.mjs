import { mkdir, writeFile } from 'node:fs/promises';
import { animateDashboard } from './animate-dashboard.mjs';

const username = process.env.PROFILE_USERNAME || 'ChamikaShashipriya99';
const headers = { 'User-Agent': 'profile-dashboard', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
async function get(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response;
}
const user = await (await get(`https://api.github.com/users/${username}`)).json();
let repos = [];
for (let page = 1; ; page++) {
  const batch = await (await get(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`)).json();
  repos.push(...batch);
  if (batch.length < 100) break;
}
let weeks, total;
if (process.env.GITHUB_TOKEN) {
  const response = await getGraph();
  ({ weeks, totalContributions: total } = response);
} else {
  // Public GitHub contribution calendar; used for local generation without a token.
  const html = await (await get(`https://github.com/users/${username}/contributions`)).text();
  const counts = new Map([...html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)].map(m => [m[1], Number(m[2].replace(/<[^>]*>/g, '').trim().match(/^([\d,]+)/)?.[1]?.replaceAll(',', '') || 0)]));
  const days = [...html.matchAll(/<td\b[^>]*data-date="[^"]+"[^>]*>/g)].map(m => {
    const attr = name => m[0].match(new RegExp(`${name}="([^"]+)"`))?.[1];
    return { date: attr('data-date'), contributionCount: counts.get(attr('id')) || 0, level: Number(attr('data-level') || 0) };
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (!days.length) throw new Error('No contribution calendar found; refusing to generate an empty dashboard.');
  weeks = [];
  for (const day of days) {
    if (!weeks.length || new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0) weeks.push({ contributionDays: [] });
    weeks.at(-1).contributionDays.push(day);
  }
  total = days.reduce((sum, day) => sum + day.contributionCount, 0);
}
async function getGraph() {
  const response = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount color}}}}}}', variables: { login: username } }) });
  const result = await response.json();
  if (!response.ok || result.errors) throw new Error(JSON.stringify(result.errors || result));
  return result.data.user.contributionsCollection.contributionCalendar;
}
const avatarResponse = await get(user.avatar_url);
const avatarType = avatarResponse.headers.get('content-type')?.split(';')[0] || 'image/png';
const avatar = Buffer.from(await avatarResponse.arrayBuffer()).toString('base64');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const palette = ['#13251c', '#06452a', '#087d3e', '#16bd51', '#39ed70'];
const parts = [];
const text = (x, y, value, size = 12, color = '#8b9892', extra = '') => parts.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`);
const rect = (x, y, w, h, fill, extra = '') => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`);
parts.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-labelledby="title desc"><title id="title">Chamika’s GitHub terminal dashboard</title><desc id="desc">Contribution calendar, profile portrait, public repository statistics and monthly contributions.</desc><defs><clipPath id="portrait"><rect x="54" y="349" width="360" height="285" rx="8"/></clipPath><filter id="mono"><feColorMatrix type="saturate" values="0"/></filter></defs><g font-family="ui-monospace, SFMono-Regular, Consolas, monospace">');
rect(0, 0, 1000, 760, '#0d1110', 'rx="12"');
text(28, 32, `${username} / README.md`, 11);
text(500, 82, 'chamika@github:~ $ ./contributions.sh', 18, '#e3ede6', 'text-anchor="middle" font-weight="700"');
let month = '';
weeks.forEach((week, wi) => week.contributionDays.forEach(day => {
  const date = new Date(`${day.date}T00:00:00Z`);
  const x = 62 + wi * 16.8, y = 125 + date.getUTCDay() * 17;
  const label = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  if (label !== month && (wi === 0 || date.getUTCDate() <= 7)) { text(x, 113, label, 10); month = label; }
  const level = day.level ?? (day.contributionCount === 0 ? 0 : day.color === '#9be9a8' ? 4 : day.color === '#40c463' ? 3 : day.color === '#30a14e' ? 2 : 1);
  rect(x, y, 13, 13, palette[level], 'rx="2"');
  parts.push(`<title>${esc(day.date)}: ${day.contributionCount} contributions</title>`);
}));
text(23, 153, 'Mon', 9); text(23, 187, 'Wed', 9); text(23, 221, 'Fri', 9);
text(62, 270, `${total.toLocaleString('en')} contributions in the last year`, 12, '#b6c9bc');
text(804, 270, 'less', 9); palette.forEach((c, i) => rect(835 + i * 17, 260, 12, 12, c, 'rx="2"')); text(927, 270, 'more', 9);
text(500, 315, 'chamika@github:~ $ whoami', 18, '#e3ede6', 'text-anchor="middle" font-weight="700"');
rect(28, 336, 412, 374, '#101614', 'rx="6" stroke="#27352d"');
rect(454, 336, 518, 374, '#101614', 'rx="6" stroke="#27352d"');
for (const x of [42, 468]) { ['#39ed70', '#637469', '#34473b'].forEach((c, i) => parts.push(`<circle cx="${x + i * 11}" cy="348" r="3" fill="${c}"/>`)); }
parts.push(`<image x="54" y="360" width="360" height="274" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" filter="url(#mono)" xlink:href="data:${avatarType};base64,${avatar}" opacity="0.85"/>`);
text(54, 660, 'CHAMIKA SHASHIPRIYA', 18, '#e3ede6', 'font-weight="700"');
text(54, 682, 'Full-stack developer / Sri Lanka', 12);
const stars = repos.reduce((n, repo) => n + repo.stargazers_count, 0);
const cells = [['PUBLIC REPOSITORIES', user.public_repos], ['FOLLOWERS', user.followers], ['YEARLY CONTRIBUTIONS', total], ['REPOSITORY STARS', stars], ['FOLLOWING', user.following], ['BUILDING WITH', 'Next.js / React']];
cells.forEach(([label, value], i) => { const x = 480 + (i % 2) * 245, y = 385 + Math.floor(i / 2) * 77; text(x, y, label, 10); text(x, y + 30, typeof value === 'number' ? value.toLocaleString('en') : value, i === 5 ? 16 : 26, i === 0 || i === 2 ? '#39ed70' : '#e3ede6', 'font-weight="700"'); });
text(480, 603, 'CONTRIBUTIONS / MONTH', 10);
const months = new Map();
for (const day of weeks.flatMap(w => w.contributionDays)) months.set(day.date.slice(0, 7), (months.get(day.date.slice(0, 7)) || 0) + day.contributionCount);
const entries = [...months.entries()].slice(-12), max = Math.max(1, ...entries.map(e => e[1]));
entries.forEach(([date, count], i) => { const height = count / max * 60; rect(480 + i * 39, 681 - height, 25, Math.max(1, height), '#23d45c', 'rx="2"'); text(492 + i * 39, 698, date.slice(5), 8, '#8b9892', 'text-anchor="middle"'); });
text(28, 739, 'learn. build. improve.', 10, '#39ed70');
text(972, 739, `updated ${new Date().toISOString().slice(0, 10)} UTC / public GitHub data`, 9, '#708378', 'text-anchor="end"');
parts.push('</g></svg>');
await mkdir('assets', { recursive: true });
await writeFile('assets/github-dashboard.svg', animateDashboard(parts.join('\n')));
console.log(`Generated dashboard: ${total} contributions, ${user.public_repos} public repos.`);
