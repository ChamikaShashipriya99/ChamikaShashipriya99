import { mkdir, writeFile } from 'node:fs/promises';

const out = 'assets/terminal';
await mkdir(out, { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const text = (x, y, value, size = 18, color = '#b6c9bc', extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(value)}</text>`;
const rect = (x, y, width, height, fill, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
function svg(height, title, body, width = 1000) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title>
<style>
  .cursor { animation: blink 1.2s steps(1,end) infinite; }
  .status { animation: pulse 4s ease-in-out infinite; }
  @keyframes blink { 0%,49% {opacity:1} 50%,100% {opacity:0} }
  @keyframes pulse { 0%,100% {opacity:.45} 50% {opacity:1} }
  @media (prefers-reduced-motion:reduce) { .cursor,.status {animation:none} }
</style>
${rect(1, 1, width - 2, height - 2, '#0d1110', 'rx="10" stroke="#27352d"')}
<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace">${body}</g></svg>`;
}
function heading(command, label) {
  return ['#39ed70', '#637469', '#34473b'].map((color, i) => `<circle cx="${25 + i * 13}" cy="24" r="4" fill="${color}"/>`).join('')
    + text(81, 29, label, 12, '#708378')
    + text(26, 72, `chamika@github:~ $ ${command}`, 21, '#e3ede6', 'font-weight="700"')
    + rect(26, 89, 948, 1, '#27352d')
    + rect(950, 56, 10, 18, '#39ed70', 'class="cursor"');
}
async function save(name, height, title, body, width) {
  await writeFile(`${out}/${name}.svg`, svg(height, title, body, width));
}
await save('about', 300, 'About Chamika Shashipriya', heading('cat about.txt', '~/profile/about.txt')
  + text(28, 130, 'Full-stack web developer / Software engineering undergraduate', 20, '#e3ede6')
  + text(28, 163, 'Ambalangoda, Sri Lanka', 17, '#39ed70')
  + text(28, 202, 'I build modern web applications and explore interactive 3D experiences.', 18)
  + text(28, 240, '> building', 16, '#39ed70') + text(170, 240, 'Next.js / React / Node.js / Spring Boot', 17)
  + text(28, 271, '> exploring', 16, '#39ed70') + text(170, 271, 'Three.js / Framer Motion / Scalable architectures', 17));
await save('projects', 108, 'Featured projects', heading('ls projects/', '~/workspace — 6 featured projects'));

const projects = [
  ['portfolio', '01', 'Modern 3D Portfolio', 'Interactive developer portfolio with 3D experiences,', 'project showcases, and motion.', ['Next.js', 'TypeScript', 'Three.js', 'Tailwind']],
  ['planner', '02', 'RP Planner (J26-IT-302)', 'Collaborative project and workflow planning', 'for research teams.', ['C++', 'Application']],
  ['campus', '03', 'Smart Campus PAF System', 'Campus management platform for modern', 'academic workflows.', ['JavaScript', 'Node.js', 'Web']],
  ['events', '04', 'Event Management System', 'Event coordination, ticket management,', 'and attendee workflows.', ['JavaScript', 'Full-Stack']],
  ['yamaha', '05', 'Yamaha MT-15 Service Hub', 'A dedicated portal to record, manage,', 'and monitor motorcycle maintenance.', ['TypeScript', 'React', 'Web']],
  ['greenpulse', '06', 'GreenPulse IoT System', 'Smart environmental monitoring', 'and automation with IoT.', ['C++', 'IoT', 'Hardware / Cloud']],
];
for (const [name, number, title, line1, line2, tags] of projects) {
  let body = rect(1, 20, 3, 126, '#39ed70', 'rx="1"')
    + text(26, 39, `~/projects/${number}`, 12, '#708378')
    + text(26, 76, title, 25, '#e3ede6', 'font-weight="700"')
    + text(26, 111, line1, 17) + text(26, 137, line2, 17)
    + text(959, 39, '[ open repository ↗ ]', 15, '#39ed70', 'text-anchor="end"');
  let x = 26;
  for (const tag of tags) {
    const width = tag.length * 9 + 26;
    body += rect(x, 155, width, 27, '#13251c', 'rx="4" stroke="#244d32"') + text(x + 13, 174, tag, 15, '#39ed70');
    x += width + 10;
  }
  body += '<circle cx="955" cy="168" r="4" fill="#39ed70" class="status"/>';
  await save(`project-${name}`, 200, `${title}: ${line1} ${line2} Stack: ${tags.join(', ')}. Open repository.`, body);
}
let stack = heading('cat stack.txt', '~/profile/stack.txt');
const rows = [
  ['FRONTEND', 'TypeScript / JavaScript / React / Next.js / Vue / Tailwind CSS'],
  ['BACKEND', 'Node.js / Express / Java / Spring Boot / C# / .NET / PHP'],
  ['DATA', 'MySQL / MongoDB / Firebase'],
  ['CREATIVE', 'Three.js / Framer Motion / Figma'],
  ['TOOLS', 'Git / Linux / Vercel'],
];
rows.forEach(([label, value], i) => {
  const y = 128 + i * 48;
  stack += text(28, y, label, 15, '#39ed70') + text(180, y, value, 16);
  if (i < rows.length - 1) stack += rect(28, y + 17, 944, 1, '#1b2920');
});
await save('stack', 356, 'Technology stack: ' + rows.map(row => row.join(': ')).join('. '), stack);
for (const [name, label, detail] of [
  ['portfolio', 'PORTFOLIO', 'chamikashashipriya.dev'],
  ['linkedin', 'LINKEDIN', 'Let’s connect'],
  ['email', 'EMAIL', 'Get in touch'],
]) {
  await save(`contact-${name}`, 94, `${label}: ${detail}`, text(18, 31, `> ${label}`, 15, '#39ed70') + text(18, 63, detail, 14, '#e3ede6') + text(307, 33, '↗', 20, '#39ed70', 'text-anchor="end"'), 330);
}
console.log('Generated 12 matching terminal section assets.');
