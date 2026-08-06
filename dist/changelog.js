import { commitHistory, releaseTags } from './git.js';
import { anchors } from './references.js';
function cell(text) {
    return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
/**
 * Revision history table built from release tags. Falls back to a single
 * "current build" row when the repo has no matching tags.
 */
export async function revisionHistory(config, handbook) {
    const tags = await releaseTags(config);
    const rows = [];
    if (tags.length > 0) {
        for (const t of tags) {
            rows.push(`| ${cell(t.name)} | ${cell(t.date)} | Release |`);
        }
    }
    rows.push(`| ${cell(handbook.revision ?? 'working tree')} | ${cell(handbook.buildDate)} | Handbook build |`);
    return [
        '# Revision History',
        '',
        '| Revision | Date | Notes |',
        '| --- | --- | --- |',
        ...rows,
        '',
    ].join('\n');
}
/**
 * Git change-history appendix. Groups recent commits and links any spec ids
 * mentioned in commit subjects back to their handbook sections.
 */
export async function gitChangeHistory(config, handbook) {
    const commits = await commitHistory(config, { pathspec: config.source.specs });
    if (commits.length === 0) {
        return ['# Git Change History', '', '_No git history available._', ''].join('\n');
    }
    const slugById = new Map(handbook.specs.map((s) => [s.id, s.slug]));
    const linkSpecs = (c) => {
        if (c.specIds.length === 0)
            return '';
        const links = c.specIds.map((id) => {
            const slug = slugById.get(id);
            return slug ? `[${id}](#${anchors.spec(slug)})` : id;
        });
        return ` _(${links.join(', ')})_`;
    };
    const rows = commits.map((c) => `| ${cell(c.shortHash)} | ${cell(c.date.slice(0, 10))} | ${cell(c.author)} | ${cell(c.subject)}${linkSpecs(c)} |`);
    return [
        '# Git Change History',
        '',
        `Commits touching \`${config.source.specs}\` (most recent first).`,
        '',
        '| Commit | Date | Author | Subject |',
        '| --- | --- | --- | --- |',
        ...rows,
        '',
    ].join('\n');
}
//# sourceMappingURL=changelog.js.map