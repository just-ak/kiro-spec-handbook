import { basename } from 'node:path';
import { captionFromFileName } from './markdown.js';
import { diagramId } from './metadata.js';
/**
 * Build diagram references for a spec from a sorted list of SVG file paths.
 * Diagrams are collected both from the spec root (e.g. `design-sketch.svg`) and
 * from an optional `diagrams/` subfolder.
 */
export function buildDiagrams(specId, svgAbsPaths, toRel) {
    return svgAbsPaths.map((absPath, i) => {
        const file = basename(absPath);
        return {
            id: diagramId(specId, i + 1),
            specId,
            caption: captionFromFileName(file),
            absPath,
            relPath: toRel(absPath),
        };
    });
}
/**
 * Assign sequential, handbook-wide figure numbers to every diagram in document
 * order (specs are already sorted by id). Mutates the diagram refs in place and
 * returns the flat, ordered list.
 */
export function assignFigureNumbers(handbook) {
    let n = 0;
    const all = [];
    for (const spec of handbook.specs) {
        for (const d of spec.diagrams) {
            d.figureNumber = ++n;
            all.push(d);
        }
    }
    return all;
}
//# sourceMappingURL=diagrams.js.map