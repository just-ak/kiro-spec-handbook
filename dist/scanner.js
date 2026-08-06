import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, relative, sep } from 'node:path';
import { globby } from 'globby';
import { resolveFromRepo } from './config.js';
import { buildDiagrams } from './diagrams.js';
import { extractH1, parseRequirements, parseTasks } from './markdown.js';
import { deriveSpecId, parseFrontMatter, resolveStatus, resolveTitle, resolveVersion, } from './metadata.js';
/** Normalise a path to POSIX separators for stable, cross-platform output. */
function toPosix(p) {
    return p.split(sep).join('/');
}
function classify(fileName) {
    const lower = fileName.toLowerCase();
    if (lower === 'requirements.md')
        return 'requirements';
    if (lower === 'design.md')
        return 'design';
    if (lower === 'tasks.md')
        return 'tasks';
    return 'other';
}
/** Deterministic content hash over all source files that make up a spec. */
function hashSpec(entries) {
    const hash = createHash('sha256');
    const sorted = [...entries].sort((a, b) => a.relPath.localeCompare(b.relPath));
    for (const { relPath, bytes } of sorted) {
        hash.update(relPath, 'utf8');
        hash.update('\0');
        hash.update(bytes);
        hash.update('\0');
    }
    return hash.digest('hex');
}
/**
 * Discover and parse every spec under `config.source.specs`.
 * Returns specs sorted by their stable id for deterministic output.
 */
export async function scanSpecs(config) {
    const specsRoot = resolveFromRepo(config, config.source.specs);
    const toRel = (abs) => toPosix(relative(config.repoRoot, abs));
    // Each immediate subdirectory of specsRoot is one spec.
    const dirs = await globby('*', {
        cwd: specsRoot,
        onlyDirectories: true,
        absolute: true,
    });
    dirs.sort();
    const specs = [];
    for (const dir of dirs) {
        const slug = basename(dir);
        const mdPaths = await globby(['*.md', 'references/**/*.md'], {
            cwd: dir,
            absolute: true,
        });
        const svgPaths = await globby(['*.svg', 'diagrams/**/*.svg'], {
            cwd: dir,
            absolute: true,
        });
        const refPaths = await globby(['references/**/*'], {
            cwd: dir,
            absolute: true,
            onlyFiles: true,
        });
        mdPaths.sort();
        svgPaths.sort();
        refPaths.sort();
        if (mdPaths.length === 0 && svgPaths.length === 0)
            continue;
        const hashInputs = [];
        // Parse markdown documents.
        const documents = [];
        let frontMatterForId = {};
        let h1;
        for (const absPath of mdPaths) {
            const rawBytes = readFileSync(absPath);
            hashInputs.push({ relPath: toRel(absPath), bytes: rawBytes });
            const { frontMatter, content } = parseFrontMatter(rawBytes.toString('utf8'));
            const kind = classify(basename(absPath));
            const isReference = toPosix(absPath).includes('/references/');
            documents.push({
                kind: isReference ? 'reference' : kind,
                absPath,
                relPath: toRel(absPath),
                content,
                frontMatter,
            });
            // Prefer requirements.md front matter/H1 as the spec's canonical metadata.
            if (kind === 'requirements') {
                frontMatterForId = frontMatter;
                h1 = extractH1(content);
            }
        }
        // If no requirements.md, fall back to the first document's metadata.
        if (Object.keys(frontMatterForId).length === 0 && documents.length > 0) {
            frontMatterForId = documents[0].frontMatter;
            h1 = h1 ?? extractH1(documents[0].content);
        }
        for (const absPath of svgPaths) {
            hashInputs.push({ relPath: toRel(absPath), bytes: readFileSync(absPath) });
        }
        const specId = deriveSpecId(slug, frontMatterForId);
        const requirementsDoc = documents.find((d) => d.kind === 'requirements');
        const tasksDoc = documents.find((d) => d.kind === 'tasks');
        const references = refPaths.map((absPath) => ({
            specId,
            absPath,
            relPath: toRel(absPath),
            title: basename(absPath),
        }));
        const spec = {
            id: specId,
            slug,
            title: resolveTitle(slug, frontMatterForId, h1),
            version: resolveVersion(frontMatterForId),
            status: resolveStatus(frontMatterForId),
            dir,
            documents,
            requirements: requirementsDoc
                ? parseRequirements(specId, requirementsDoc.content)
                : [],
            tasks: tasksDoc ? parseTasks(specId, tasksDoc.content) : [],
            diagrams: buildDiagrams(specId, svgPaths, toRel),
            references,
            contentHash: hashSpec(hashInputs),
        };
        specs.push(spec);
    }
    specs.sort((a, b) => a.id.localeCompare(b.id));
    return specs;
}
//# sourceMappingURL=scanner.js.map