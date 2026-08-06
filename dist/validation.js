/**
 * Validate the parsed specs for metadata completeness and internal consistency.
 *
 * Errors (block a build):
 *  - duplicate spec ids (breaks stable-id guarantee / cross references)
 *
 * Warnings (surfaced, non-blocking):
 *  - missing front matter fields (spec_id/title/version/status)
 *  - missing requirements/design/tasks documents
 *  - tasks referencing requirement numbers that do not exist
 *  - specs with no requirements
 */
export function validateSpecs(specs) {
    const issues = [];
    // Duplicate id detection.
    const idCounts = new Map();
    for (const s of specs) {
        const list = idCounts.get(s.id) ?? [];
        list.push(s.slug);
        idCounts.set(s.id, list);
    }
    for (const [id, slugs] of idCounts) {
        if (slugs.length > 1) {
            issues.push({
                level: 'error',
                specId: id,
                message: `Duplicate spec id shared by directories: ${slugs.join(', ')}. Add distinct \`spec_id\` front matter.`,
            });
        }
    }
    for (const spec of specs) {
        const fm = spec.documents.find((d) => d.kind === 'requirements')?.frontMatter ?? {};
        if (fm.spec_id === undefined) {
            issues.push({
                level: 'warning',
                specId: spec.id,
                message: `No \`spec_id\` front matter; id derived from directory name (\`${spec.slug}\`).`,
            });
        }
        if (fm.title === undefined) {
            issues.push({ level: 'warning', specId: spec.id, message: 'No `title` in front matter.' });
        }
        if (fm.version === undefined) {
            issues.push({ level: 'warning', specId: spec.id, message: 'No `version` in front matter.' });
        }
        if (fm.status === undefined) {
            issues.push({ level: 'warning', specId: spec.id, message: 'No `status` in front matter.' });
        }
        const kinds = new Set(spec.documents.map((d) => d.kind));
        if (!kinds.has('requirements')) {
            issues.push({ level: 'warning', specId: spec.id, message: 'Missing requirements.md.' });
        }
        if (!kinds.has('design')) {
            issues.push({ level: 'warning', specId: spec.id, message: 'Missing design.md.' });
        }
        if (!kinds.has('tasks')) {
            issues.push({ level: 'warning', specId: spec.id, message: 'Missing tasks.md.' });
        }
        if (kinds.has('requirements') && spec.requirements.length === 0) {
            issues.push({
                level: 'warning',
                specId: spec.id,
                message: 'requirements.md present but no `### Requirement N:` headings were found.',
            });
        }
        // Tasks referencing non-existent requirements.
        const reqNumbers = new Set(spec.requirements.map((r) => r.number));
        if (reqNumbers.size > 0) {
            for (const task of spec.tasks) {
                for (const ref of task.requirementNumbers) {
                    const head = Number.parseInt(ref, 10);
                    if (!Number.isNaN(head) && !reqNumbers.has(head)) {
                        issues.push({
                            level: 'warning',
                            specId: spec.id,
                            message: `Task ${task.number} references requirement ${ref}, but Requirement ${head} does not exist.`,
                        });
                    }
                }
            }
        }
    }
    const errorCount = issues.filter((i) => i.level === 'error').length;
    const warningCount = issues.filter((i) => i.level === 'warning').length;
    return { issues, errorCount, warningCount, ok: errorCount === 0 };
}
//# sourceMappingURL=validation.js.map