import type { Handbook } from './types.js';
/** Specification index: id, title, version, status, requirement/task/diagram counts. */
export declare function specIndex(handbook: Handbook): string;
/** Requirements index: every requirement across all specs, ordered by spec then number. */
export declare function requirementsIndex(handbook: Handbook): string;
/** Tasks index: every task across all specs with completion state. */
export declare function tasksIndex(handbook: Handbook): string;
/** Diagram index: figure number, id, caption, owning spec. Assigns figure numbers. */
export declare function diagramIndex(handbook: Handbook): string;
/**
 * Traceability matrix: Requirement -> Design -> Task -> Code/Test.
 *
 * The Design column reflects whether the owning spec has a design document; the
 * Task column lists the tasks that reference the requirement; the Code/Test column
 * is derived from task references and left as "see tasks" where none is explicit.
 */
export declare function traceabilityMatrix(handbook: Handbook): string;
