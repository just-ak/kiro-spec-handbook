#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { loadConfig, resolveFromRepo } from './config.js';
import { gitChangeHistory, revisionHistory } from './changelog.js';
import { changedSpecPaths, currentRevision, isGitRepo, lastCommitDate } from './git.js';
import {
  diagramIndex,
  requirementsIndex,
  specIndex,
  tasksIndex,
  traceabilityMatrix,
} from './indexer.js';
import { buildLock, computeDelta, readLock, serialiseLock } from './lock.js';
import { logger } from './logger.js';
import { render, type HandbookParts } from './renderer.js';
import { scanSpecs } from './scanner.js';
import {
  appendices,
  architectureDecisions,
  architectureOverview,
  documentInfo,
  steeringSection,
  tokenSummary,
} from './sections.js';
import type { Handbook, HandbookConfig } from './types.js';
import { validateSpecs } from './validation.js';
import { chunkPdf, isValidChunkSize, suggestChunkSize } from './pdf-chunker.js';

/** Resolve a deterministic build date from config, SOURCE_DATE_EPOCH, or git. */
async function resolveBuildDate(config: HandbookConfig): Promise<string> {
  if (config.build_date && config.build_date.trim()) return config.build_date.trim();
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }
  const commitDate = await lastCommitDate(config.repoRoot);
  if (commitDate) return commitDate;
  logger.warn('Build date is not deterministic (no config.build_date, SOURCE_DATE_EPOCH, or git).');
  return new Date().toISOString();
}

/** Scan + assemble the in-memory handbook model shared by all commands. */
async function buildModel(config: HandbookConfig): Promise<Handbook> {
  const specs = await scanSpecs(config);
  if (specs.length === 0) {
    logger.warn(`No specs found under ${resolveFromRepo(config, config.source.specs)}.`);
  }
  const buildDate = await resolveBuildDate(config);
  const revision = (await isGitRepo(config.repoRoot))
    ? await currentRevision(config.repoRoot)
    : undefined;
  return { specs, buildDate, revision };
}

async function assembleParts(config: HandbookConfig, handbook: Handbook): Promise<HandbookParts> {
  return {
    documentInfo: documentInfo(handbook, config),
    revisionHistory: await revisionHistory(config, handbook),
    architectureOverview: architectureOverview(handbook, config),
    specIndex: specIndex(handbook),
    requirementsIndex: requirementsIndex(handbook),
    tasksIndex: tasksIndex(handbook),
    // diagramIndex assigns figure numbers; must run before spec bodies render.
    diagramIndex: diagramIndex(handbook),
    steering: await steeringSection(config),
    architectureDecisions: architectureDecisions(handbook),
    traceability: traceabilityMatrix(handbook),
    gitHistory: await gitChangeHistory(config, handbook),
    appendices: appendices(handbook, [await tokenSummary(handbook, config)]),
  };
}

function printValidation(report: ReturnType<typeof validateSpecs>): void {
  for (const issue of report.issues) {
    const tag = issue.level === 'error' ? chalk.red('error') : chalk.yellow('warn');
    process.stdout.write(`  ${tag} [${issue.specId}] ${issue.message}\n`);
  }
  logger.info(`${report.errorCount} error(s), ${report.warningCount} warning(s).`);
}

const program = new Command();

program
  .name('handbook')
  .description('Generate an indexed PDF handbook from Kiro specifications.')
  .option('-c, --config <path>', 'path to handbook.yml');

program
  .command('build')
  .description('Scan specs and build the assembled markdown + PDF handbook.')
  .option('--allow-warnings', 'proceed even if validation warnings exist (default true)', true)
  .action(async (opts: { allowWarnings: boolean }) => {
    const config = loadConfig({ configPath: program.opts().config });
    logger.info(`Repository: ${config.repoRoot}`);
    const handbook = await buildModel(config);

    const report = validateSpecs(handbook.specs);
    printValidation(report);
    if (!report.ok) {
      logger.error('Validation failed with errors. Fix them before building.');
      process.exitCode = 1;
      return;
    }
    if (report.warningCount > 0 && !opts.allowWarnings) {
      logger.error('Warnings present and --allow-warnings=false.');
      process.exitCode = 1;
      return;
    }

    const parts = await assembleParts(config, handbook);
    const result = await render(handbook, config, parts);

    // Update the lock file for delta detection on the next build.
    const lockPath = join(resolveFromRepo(config, config.output.directory), 'handbook.lock.json');
    const previous = readLock(lockPath);
    const delta = computeDelta(handbook, previous);
    const nextLock = buildLock(handbook, previous);
    writeFileSync(lockPath, serialiseLock(nextLock), 'utf8');

    logger.success(
      `Lock updated: +${delta.added.length} new, ~${delta.changed.length} changed, -${delta.removed.length} removed.`,
    );
    if (!result.pandocAvailable) {
      logger.info('Markdown is ready; install pandoc to emit the PDF.');
    }
  });

program
  .command('validate')
  .description('Validate spec metadata and cross references. Exits non-zero on errors.')
  .action(async () => {
    const config = loadConfig({ configPath: program.opts().config });
    const handbook = await buildModel(config);
    const report = validateSpecs(handbook.specs);
    printValidation(report);
    process.exitCode = report.ok ? 0 : 1;
  });

program
  .command('index')
  .description('Print the specification, requirements, tasks, and diagram indexes.')
  .option('-o, --out <file>', 'write the indexes to a markdown file instead of stdout')
  .action(async (opts: { out?: string }) => {
    const config = loadConfig({ configPath: program.opts().config });
    const handbook = await buildModel(config);
    const body = [
      specIndex(handbook),
      requirementsIndex(handbook),
      tasksIndex(handbook),
      diagramIndex(handbook),
    ].join('\n\n');
    if (opts.out) {
      const target = resolveFromRepo(config, opts.out);
      writeFileSync(target, body + '\n', 'utf8');
      logger.success(`Wrote indexes: ${target}`);
    } else {
      process.stdout.write(body + '\n');
    }
  });

program
  .command('changes')
  .description('Report specs changed since the last handbook build (via the lock file).')
  .option('--since <ref>', 'also show spec files changed since a git ref')
  .action(async (opts: { since?: string }) => {
    const config = loadConfig({ configPath: program.opts().config });
    const handbook = await buildModel(config);
    const lockPath = join(resolveFromRepo(config, config.output.directory), 'handbook.lock.json');
    const previous = readLock(lockPath);
    const delta = computeDelta(handbook, previous);

    if (!previous) {
      logger.info('No previous lock file; every spec is new relative to the last publish.');
    }
    logger.info(`Added:     ${delta.added.join(', ') || '(none)'}`);
    logger.info(`Changed:   ${delta.changed.join(', ') || '(none)'}`);
    logger.info(`Removed:   ${delta.removed.join(', ') || '(none)'}`);
    logger.info(`Unchanged: ${delta.unchanged.length} spec(s).`);

    if (opts.since) {
      if (await isGitRepo(config.repoRoot)) {
        const paths = await changedSpecPaths(config, opts.since);
        logger.info(`Files changed since ${opts.since}:`);
        for (const p of paths) process.stdout.write(`  ${p}\n`);
      } else {
        logger.warn('Not a git repository; --since ignored.');
      }
    }
  });

program
  .command('chunk')
  .description('Split a PDF into chunks for Kiro upload (max 4MB per attachment).')
  .option('-i, --input <path>', 'path to the PDF file to chunk (relative to repo root)', 'ledgiventa-handbook.pdf')
  .option('-s, --size <mb>', 'chunk size in MB (1, 2, 3, or 4)', '3')
  .option('-o, --output <dir>', 'output directory for chunks (relative to repo root)')
  .option('--dry-run', 'show what would be created without writing files', false)
  .option('--auto-size', 'automatically determine optimal chunk size', false)
  .action(
    async (opts: {
      input: string;
      size: string;
      output?: string;
      dryRun: boolean;
      autoSize: boolean;
    }) => {
      try {
        const config = loadConfig({ configPath: program.opts().config });
        let { input, size: sizeStr, output: outputDir, dryRun, autoSize } = opts;

        // Resolve paths relative to repo root
        const inputPath = resolveFromRepo(config, input);
        const effectiveOutputDir = outputDir ? resolveFromRepo(config, outputDir) : dirname(inputPath);

        let chunkSize: 1 | 2 | 3 | 4 = 3;
        if (autoSize) {
          // Read file to determine optimal size
          const { statSync } = await import('node:fs');
          try {
            const stat = statSync(inputPath);
            chunkSize = suggestChunkSize(stat.size);
            logger.info(`Auto-detected optimal chunk size: ${chunkSize}MB`);
          } catch (err) {
            logger.error(`Failed to read file for auto-sizing: ${err}`);
            process.exitCode = 1;
            return;
          }
        } else {
          const parsedSize = parseInt(sizeStr, 10);
          if (!isValidChunkSize(parsedSize)) {
            logger.error(
              `Invalid chunk size: ${sizeStr}. Must be one of: 1, 2, 3, or 4 (MB)`,
            );
            process.exitCode = 1;
            return;
          }
          chunkSize = parsedSize;
        }

        const result = await chunkPdf({
          inputPath,
          outputDir: effectiveOutputDir,
          chunkSizeMB: chunkSize,
          dryRun,
        });

        logger.info('');
        logger.info(`Summary:`);
        logger.info(`  Total PDF size: ${result.totalSizeMB.toFixed(2)} MB`);
        logger.info(`  Chunk size: ${result.chunkSizeMB} MB`);
        logger.info(`  Chunks created: ${result.chunksCreated}`);
        logger.info('');
        logger.info(`Chunks:`);
        for (const chunk of result.chunks) {
          logger.info(
            `  [${chunk.index}] ${chunk.path} (${chunk.sizeMB} MB, ${chunk.pages} pages)`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(msg);
        process.exitCode = 1;
      }
    },
  );

program.parseAsync(process.argv).catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
