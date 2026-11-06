import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [mode, input, output] = process.argv.slice(2);
if (!['--snake', '--landscape'].includes(mode) || !input || !output) {
  throw new Error('Usage: node scripts/theme-activity.mjs --snake|--landscape input.svg output.svg');
}
const source = await readFile(input, 'utf8');
const snake = mode === '--snake';
const height = snake ? 350 : 820;
const command = snake ? './snake.sh' : './activity-3d.sh';
let content;
if (snake) {
  if (!source.includes('--cs:')) throw new Error('Unrecognized snake SVG: missing palette.');
  content = source.replace(/--cs:[^;}]+/g, '--cs:#39ed70')
    .replace(/--cb:[^;}]+/g, '--cb:#27352d')
    .replace(/--ce:[^;}]+/g, '--ce:#13251c')
    .replace(/--c0:[^;}]+/g, '--c0:#13251c')
    .replace(/--c1:[^;}]+/g, '--c1:#06452a')
    .replace(/--c2:[^;}]+/g, '--c2:#087d3e')
    .replace(/--c3:[^;}]+/g, '--c3:#16bd51')
    .replace(/--c4:[^;}]+/g, '--c4:#39ed70');
  content = content.replace(/<svg\b([^>]+)>/, (_, attrs) => `<svg ${attrs.replace(/\s(?:width|height)="[^"]*"/g, '')} x="25" y="110" width="950" height="207" class="snake-motion">`);
} else {
  // The upstream renderer places the landscape in the first root-level group.
  // Keep every contribution block, and omit the radar, language chart and footer.
  const start = source.search(/<g\b/);
  if (start < 0) throw new Error('Missing landscape group.');
  const tags = /<g\b[^>]*>|<\/g>/g;
  tags.lastIndex = start;
  let depth = 0, end = -1, tag;
  while ((tag = tags.exec(source))) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = tags.lastIndex; break; }
  }
  if (end < 0) throw new Error('Unbalanced landscape groups.');
  content = source.slice(start, end)
    .replace(/<animate(?:Transform)?\b[^>]*>[\s\S]*?<\/animate(?:Transform)?>/g, '')
    .replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (_, r, g, b) => {
      const light = Math.max(Number(r), Number(g), Number(b)) / 255;
      return `rgb(${Math.round(5 + light * 35)}, ${Math.round(20 + light * 215)}, ${Math.round(15 + light * 90)})`;
    });
  content = `<g transform="translate(0 10) scale(.78)"><g class="landscape">${content}</g></g>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}" role="img" aria-labelledby="title">
<title id="title">${snake ? 'Animated green contribution snake' : 'Green 3D contribution landscape'}</title>
<style>
  .cursor { animation: blink 1.2s steps(1,end) infinite; }
  .landscape { animation: reveal 1.8s ease-out both; }
  @keyframes blink { 0%,49% {opacity:1} 50%,100% {opacity:0} }
  @keyframes reveal { from {opacity:.1} to {opacity:1} }
  @media (prefers-reduced-motion:reduce) { .cursor,.landscape,.snake-motion * {animation:none!important} }
</style>
<rect x="1" y="1" width="998" height="${height - 2}" rx="10" fill="#0d1110" stroke="#27352d"/>
<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace">
<circle cx="25" cy="24" r="4" fill="#39ed70"/><circle cx="38" cy="24" r="4" fill="#637469"/><circle cx="51" cy="24" r="4" fill="#34473b"/>
<text x="81" y="29" fill="#708378" font-size="12">~/activity/${snake ? 'snake' : 'landscape'}</text>
<text x="26" y="72" fill="#e3ede6" font-size="21" font-weight="700">chamika@github:~ $ ${command}</text>
<rect x="950" y="56" width="10" height="18" fill="#39ed70" class="cursor"/>
<path d="M26 89H974" stroke="#27352d"/>
${content}
<text x="26" y="${height - 18}" fill="#708378" font-size="11">${snake ? 'contribution grid / animated playback' : 'contribution landscape / daily activity'}</text>
</g></svg>`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg);
console.log(`Styled ${mode.slice(2)}: ${output}`);
