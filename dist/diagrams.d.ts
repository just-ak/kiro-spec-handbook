import type { DiagramRef, Handbook } from './types.js';
/**
 * Build diagram references for a spec from a sorted list of SVG file paths.
 * Diagrams are collected both from the spec root (e.g. `design-sketch.svg`) and
 * from an optional `diagrams/` subfolder.
 */
export declare function buildDiagrams(specId: string, svgAbsPaths: string[], toRel: (abs: string) => string): DiagramRef[];
/**
 * Assign sequential, handbook-wide figure numbers to every diagram in document
 * order (specs are already sorted by id). Mutates the diagram refs in place and
 * returns the flat, ordered list.
 */
export declare function assignFigureNumbers(handbook: Handbook): DiagramRef[];
