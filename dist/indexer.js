import { assignFigureNumbers } from './diagrams.js';
import { anchors } from './references.js';
/** Escape pipe characters so table cells never break markdown tables. */
function cell(text) {
    return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
/**
 * Build a pipe-table delimiter row that encodes relative column widths via dash
 * counts. Pandoc turns these into explicit fractional widths, so the table spans
 * the full page width and each column is sized deliberately (no wasted space).
 */
function delimiter(cols) {
    const cells = cols.map(({ w, align = 'l' }) => {
        const dashes = '-'.repeat(Math.max(3, w));
        if (align === 'r')
            return `${dashes}:`;
        if (align === 'c')
            return `:${dashes}:`;
        return `:${dashes}`;
    });
    return `| ${cells.join(' | ')} |`;
}
/**
 * Wrap an index table in a landscape page at a compact 8pt so wide rows (long
 * spec/requirement/task IDs) fit on a single line. The raw-LaTeX lines are
 * ignored by non-LaTeX writers.
 */
function landscapeCompact(tableLines) {
    // \blandscape/\elandscape are command wrappers (defined in the template) so
    // pandoc still parses the markdown table between them.
    return [
        '\\blandscape',
        '\\begingroup\\fontsize{8pt}{10pt}\\selectfont',
        '',
        ...tableLines,
        '',
        '\\endgroup',
        '\\elandscape',
        '',
    ];
}
function specLink(spec) {
    return `[${cell(spec.title)}](#${anchors.spec(spec.slug)})`;
}
/** Specification index: id, title, version, status, requirement/task/diagram counts. */
export function specIndex(handbook) {
    const rows = handbook.specs.map((s) => `| ${cell(s.id)} | ${specLink(s)} | ${cell(s.version)} | ${cell(s.status)} | ${s.requirements.length} | ${s.tasks.length} | ${s.diagrams.length} |`);
    return [
        '# Specification Index',
        '',
        ...landscapeCompact([
            '| Spec ID | Title | Version | Status | Reqs | Tasks | Figs |',
            delimiter([
                { w: 26 },
                { w: 42 },
                { w: 8 },
                { w: 10 },
                { w: 5, align: 'r' },
                { w: 5, align: 'r' },
                { w: 5, align: 'r' },
            ]),
            ...rows,
        ]),
    ].join('\n');
}
/** Requirements index: every requirement across all specs, ordered by spec then number. */
export function requirementsIndex(handbook) {
    const rows = [];
    for (const spec of handbook.specs) {
        for (const req of spec.requirements) {
            // The Requirement ID already encodes the spec, so no separate Spec column.
            rows.push(`| ${cell(req.id)} | [Req ${req.number}: ${cell(req.title)}](#${anchors.requirement(spec.slug, req.number)}) |`);
        }
    }
    return [
        '# Requirements Index',
        '',
        ...landscapeCompact([
            '| Requirement ID | Requirement |',
            delimiter([{ w: 30 }, { w: 70 }]),
            ...rows,
        ]),
    ].join('\n');
}
/** Tasks index: every task across all specs with completion state. */
export function tasksIndex(handbook) {
    const rows = [];
    for (const spec of handbook.specs) {
        for (const task of spec.tasks) {
            const status = task.done ? '☑' : '☐';
            // Task ID already encodes both the spec and the task number, so the
            // redundant Spec and # columns are dropped to give the description room.
            rows.push(`| ${cell(task.id)} | ${status} | ${cell(task.title)} |`);
        }
    }
    return [
        '# Tasks Index',
        '',
        ...landscapeCompact([
            '| Task ID | Done | Task |',
            delimiter([{ w: 34 }, { w: 6, align: 'c' }, { w: 62 }]),
            ...rows,
        ]),
    ].join('\n');
}
/** Diagram index: figure number, id, caption, owning spec. Assigns figure numbers. */
export function diagramIndex(handbook) {
    const all = assignFigureNumbers(handbook);
    const rows = all.map((d) => `| Figure ${d.figureNumber} | ${cell(d.id)} | ${cell(d.caption)} | [${cell(d.specId)}](#${anchors.spec(specSlugForId(handbook, d.specId))}) |`);
    return [
        '# Diagram Index',
        '',
        '| Figure | Diagram ID | Caption | Spec |',
        '| --- | --- | --- | --- |',
        ...rows,
        '',
    ].join('\n');
}
function specSlugForId(handbook, specId) {
    return handbook.specs.find((s) => s.id === specId)?.slug ?? specId;
}
/**
 * Traceability matrix: Requirement -> Design -> Task -> Code/Test.
 *
 * The Design column reflects whether the owning spec has a design document; the
 * Task column lists the tasks that reference the requirement; the Code/Test column
 * is derived from task references and left as "see tasks" where none is explicit.
 */
export function traceabilityMatrix(handbook) {
    const rows = [];
    for (const spec of handbook.specs) {
        const hasDesign = spec.documents.some((d) => d.kind === 'design');
        for (const req of spec.requirements) {
            // A task references requirement N if any of its dotted refs starts with `${N}`.
            const linkedTasks = spec.tasks.filter((t) => t.requirementNumbers.some((r) => {
                const head = Number.parseInt(r, 10);
                return head === req.number;
            }));
            const taskCells = linkedTasks.length > 0
                ? linkedTasks
                    .map((t) => `[${t.number}](#${anchors.tasks(spec.slug)})`)
                    .join(', ')
                : '—';
            const designCell = hasDesign
                ? `[design](#${anchors.design(spec.slug)})`
                : '—';
            const codeCell = linkedTasks.length > 0 ? 'see tasks' : '—';
            rows.push(`| ${cell(req.id)} | [Req ${req.number}](#${anchors.requirement(spec.slug, req.number)}) | ${designCell} | ${taskCells} | ${codeCell} |`);
        }
    }
    return [
        '# Traceability Matrix',
        '',
        'Requirement → Design → Task → Code/Test, derived from spec cross references.',
        '',
        '| Requirement ID | Requirement | Design | Tasks | Code/Test |',
        '| --- | --- | --- | --- | --- |',
        ...rows,
        '',
    ].join('\n');
}
//# sourceMappingURL=indexer.js.map