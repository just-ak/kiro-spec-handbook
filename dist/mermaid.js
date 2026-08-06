import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
// Matches ```mermaid … ``` and ~~~mermaid … ~~~ fenced blocks.
const MERMAID_FENCE = /(^|\n)(`{3,}|~{3,})[ \t]*mermaid[ \t]*\n([\s\S]*?)\n\2[ \t]*(?=\n|$)/g;
/** Extract mermaid code blocks from a document in order. */
export function extractMermaidBlocks(content) {
    const blocks = [];
    let m;
    MERMAID_FENCE.lastIndex = 0;
    let i = 0;
    while ((m = MERMAID_FENCE.exec(content)) !== null) {
        blocks.push({ code: m[3], index: i++ });
    }
    return blocks;
}
/**
 * Replace each mermaid fenced block with the result of `replacer(index)`.
 * Blocks are numbered in document order so callers can map to rendered images.
 */
export function replaceMermaidBlocks(content, replacer) {
    let i = 0;
    MERMAID_FENCE.lastIndex = 0;
    return content.replace(MERMAID_FENCE, (_full, lead, _fence, code) => {
        const replacement = replacer({ code, index: i++ });
        return `${lead}${replacement}`;
    });
}
/**
 * Conservatively repair common, parser-hostile patterns in hand-authored mermaid
 * so it renders, without changing the specs on disk or the diagram's meaning:
 *
 *  - Sequence diagrams: a `;` inside message/note text is treated by mermaid as a
 *    statement terminator and breaks parsing. Replace `;` with `,` in text after
 *    the first `:` on message/note lines.
 *  - Flowcharts: a `subgraph` title containing `()`/`&` etc. must be quoted.
 *
 * Returns the (possibly unchanged) code.
 */
export function sanitizeMermaid(code) {
    const lines = code.split(/\r?\n/);
    const firstMeaningful = lines.find((l) => l.trim().length > 0)?.trim() ?? '';
    const isSequence = /^sequenceDiagram\b/.test(firstMeaningful);
    return lines
        .map((line) => {
        if (isSequence) {
            // Message (`A->>B: text`) or note (`Note over A: text`) — sanitise text after ':'.
            const colon = line.indexOf(':');
            const looksLikeMessage = /(-?-?>>?|--?x|<<-?|Note\b|activate|deactivate)/.test(line);
            if (colon !== -1 && looksLikeMessage) {
                const head = line.slice(0, colon + 1);
                const text = line.slice(colon + 1).replace(/;/g, ',');
                return head + text;
            }
            return line;
        }
        // Flowchart: quote subgraph titles with special characters.
        const sg = /^(\s*subgraph\s+)(.+?)\s*$/.exec(line);
        if (sg) {
            const title = sg[2];
            const alreadySafe = /^".*"$/.test(title) || /^\[.*\]$/.test(title);
            if (!alreadySafe && /[()&:,]/.test(title)) {
                return `${sg[1]}"${title.replace(/"/g, '')}"`;
            }
        }
        return line;
    })
        .join('\n');
}
/** Locate the mmdc binary (mermaid-cli). Returns null when unavailable. */
export function findMmdc(repoRoot) {
    const local = join(repoRoot, 'node_modules', '.bin', 'mmdc');
    if (existsSync(local))
        return local;
    return null;
}
/**
 * Render a single mermaid diagram to SVG using mmdc. Returns true on success.
 * A puppeteer config with `--no-sandbox` is written so it works in CI containers.
 */
export async function renderMermaidToSvg(mmdc, code, workDir, svgDest, env) {
    const mmdPath = svgDest.replace(/\.svg$/, '.mmd');
    const puppeteerCfg = join(workDir, 'puppeteer.json');
    const mermaidCfg = join(workDir, 'mermaid-config.json');
    writeFileSync(mmdPath, sanitizeMermaid(code), 'utf8');
    if (!existsSync(puppeteerCfg)) {
        writeFileSync(puppeteerCfg, JSON.stringify({ args: ['--no-sandbox'] }), 'utf8');
    }
    if (!existsSync(mermaidCfg)) {
        // Render labels as native SVG <text> (not HTML <foreignObject>), otherwise
        // rsvg-convert drops all label text when converting the SVG to PDF, leaving
        // empty boxes. Use a widely-available font so the text renders.
        writeFileSync(mermaidCfg, JSON.stringify({
            htmlLabels: false,
            flowchart: { htmlLabels: false, useMaxWidth: true },
            class: { htmlLabels: false },
            themeVariables: { fontFamily: 'Helvetica, Arial, sans-serif' },
        }), 'utf8');
    }
    try {
        await execa(mmdc, ['-i', mmdPath, '-o', svgDest, '-b', 'white', '-p', puppeteerCfg, '-c', mermaidCfg], { env, cwd: workDir });
        return existsSync(svgDest);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=mermaid.js.map