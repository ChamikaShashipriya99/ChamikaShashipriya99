// CSS animation remains self-contained when GitHub embeds the SVG as an image.
export function animateDashboard(svg) {
  if (svg.includes('id="dashboard-motion"')) return svg;
  const style = `<style id="dashboard-motion">
    .contribution-cell { animation: grid-reveal 8s ease-in-out infinite; }
    .activity-bar { transform-box: fill-box; transform-origin: center bottom; animation: bar-grow 8s ease-in-out infinite; }
    .terminal-cursor { animation: cursor-blink 1.2s steps(1, end) infinite; }
    .portrait-scan { animation: portrait-scan 8s linear infinite; }
    @keyframes grid-reveal {
      0%, 3% { opacity: .18; }
      16%, 88% { opacity: 1; }
      100% { opacity: .18; }
    }
    @keyframes bar-grow {
      0%, 5% { transform: scaleY(.04); opacity: .4; }
      22%, 88% { transform: scaleY(1); opacity: 1; }
      100% { transform: scaleY(.04); opacity: .4; }
    }
    @keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
    @keyframes portrait-scan {
      0% { transform: translateY(0); opacity: 0; }
      10% { opacity: .35; }
      65% { transform: translateY(270px); opacity: .35; }
      70%, 100% { transform: translateY(270px); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .contribution-cell, .activity-bar, .terminal-cursor, .portrait-scan { animation: none; }
      .portrait-scan { display: none; }
    }
  </style>`;
  svg = svg.replace('</defs>', `</defs>${style}`);
  svg = svg.replace(/<rect x="([\d.]+)" y="([\d.]+)" width="13" height="13"([^>]*)\/>/g,
    (match, x, y, attributes) => {
      const delay = ((Number(x) - 62) / 16.8 * .035 + (Number(y) - 125) / 17 * .018).toFixed(3);
      return `<rect x="${x}" y="${y}" width="13" height="13"${attributes} class="contribution-cell" style="animation-delay:${delay}s"/>`;
    });
  svg = svg.replace(/<rect x="([\d.]+)" y="([\d.]+)" width="25" height="([\d.]+)"([^>]*)\/>/g,
    (match, x, y, height, attributes) => `<rect x="${x}" y="${y}" width="25" height="${height}"${attributes} class="activity-bar" style="animation-delay:${(.6 + (Number(x) - 480) / 39 * .07).toFixed(2)}s"/>`);
  // Clip the scanner to the portrait so it never crosses profile labels.
  svg = svg.replace(/(<image\b[^>]*\/>)/, '$1<g clip-path="url(#portrait)" aria-hidden="true"><rect class="portrait-scan" x="54" y="360" width="360" height="2" fill="#39ed70"/></g>');
  svg = svg.replace('</g></svg>', '<rect class="terminal-cursor" x="648" y="301" width="9" height="16" fill="#39ed70" aria-hidden="true"/></g></svg>');
  return svg;
}
