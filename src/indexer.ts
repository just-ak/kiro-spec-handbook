import { assignFigureNumbers } from './diagrams.js';
import { anchors } from './references.js';
import { cell, delimiter, portraitCompact } from './table.js';
import type { DiagramRef, Handbook, Spec } from './types.js';

function specLink(spec: Spec): string {
  return `[${cell(spec.title)}](#${anchors.spec(spec.slug)})`;
}

/** Specification index: id, title, version, status, requirement/task/diagram counts. */
export function specIndex(handbook: Handbook): string {
  const rows = handbook.specs.map(
    (s) =>
      `| ${cell(s.id)} | ${specLink(s)} | ${cell(s.version)} | ${cell(s.status)} | ${s.requirements.length} | ${s.tasks.length} | ${s.diagrams.length} |`,
  );
  return portraitCompact(
    [
      '| Spec ID | Title | Ver | Status | Reqs | Tasks | Figs |',
      delimiter([
        { w: 34 },
        { w: 26 },
        { w: 5 },
        { w: 13 },
        { w: 7, align: 'r' },
        { w: 7, align: 'r' },
        { w: 6, align: 'r' },
      ]),
      ...rows,
    ],
    '# Specification Index',
  ).join('\n');
}

/** Requirements index: every requirement across all specs, ordered by spec then number. */
export function requirementsIndex(handbook: Handbook): string {
  const rows: string[] = [];
  for (const spec of handbook.specs) {
    for (const req of spec.requirements) {
      // The Requirement ID already encodes the spec, so no separate Spec column.
      rows.push(
        `| ${cell(req.id)} | [Req ${req.number}: ${cell(req.title)}](#${anchors.requirement(spec.slug, req.number)}) |`,
      );
    }
  }
  return portraitCompact(
    [
      '| Requirement ID | Requirement |',
      delimiter([{ w: 34 }, { w: 66 }]),
      ...rows,
    ],
    '# Requirements Index',
  ).join('\n');
}

/** Tasks index: every task across all specs with completion state. */
export function tasksIndex(handbook: Handbook): string {
  const rows: string[] = [];
  for (const spec of handbook.specs) {
    for (const task of spec.tasks) {
      const status = task.done ? '☑' : '☐';
      // Task ID already encodes both the spec and the task number, so the
      // redundant Spec and # columns are dropped to give the description room.
      rows.push(`| ${cell(task.id)} | ${status} | ${cell(task.title)} |`);
    }
  }
  return portraitCompact(
    [
      '| Task ID | Done | Task |',
      delimiter([{ w: 38 }, { w: 8, align: 'c' }, { w: 54 }]),
      ...rows,
    ],
    '# Tasks Index',
  ).join('\n');
}

/** Diagram index: figure number, id, caption, owning spec. Assigns figure numbers. */
export function diagramIndex(handbook: Handbook): string {
  const all: DiagramRef[] = assignFigureNumbers(handbook);
  const rows = all.map(
    (d) =>
      `| Figure ${d.figureNumber} | ${cell(d.id)} | ${cell(d.caption)} | [${cell(d.specId)}](#${anchors.spec(specSlugForId(handbook, d.specId))}) |`,
  );
  return [
    '# Diagram Index',
    '',
    '| Figure | Diagram ID | Caption | Spec |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

function specSlugForId(handbook: Handbook, specId: string): string {
  return handbook.specs.find((s) => s.id === specId)?.slug ?? specId;
}

/**
 * Traceability matrix: Requirement -> Design -> Task -> Code/Test.
 *
 * The Design column reflects whether the owning spec has a design document; the
 * Task column lists the tasks that reference the requirement; the Code/Test column
 * is derived from task references and left as "see tasks" where none is explicit.
 */
export function traceabilityMatrix(handbook: Handbook): string {
  const rows: string[] = [];

  for (const spec of handbook.specs) {
    const hasDesign = spec.documents.some((d) => d.kind === 'design');
    for (const req of spec.requirements) {
      // A task references requirement N if any of its dotted refs starts with `${N}`.
      const linkedTasks = spec.tasks.filter((t) =>
        t.requirementNumbers.some((r) => {
          const head = Number.parseInt(r, 10);
          return head === req.number;
        }),
      );
      const taskCells =
        linkedTasks.length > 0
          ? linkedTasks
              .map((t) => `[${t.number}](#${anchors.tasks(spec.slug)})`)
              .join(', ')
          : '—';
      const designCell = hasDesign
        ? `[design](#${anchors.design(spec.slug)})`
        : '—';
      const codeCell = linkedTasks.length > 0 ? 'see tasks' : '—';
      rows.push(
        `| ${cell(req.id)} | [Req ${req.number}](#${anchors.requirement(spec.slug, req.number)}) | ${designCell} | ${taskCells} | ${codeCell} |`,
      );
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
