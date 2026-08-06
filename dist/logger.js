import chalk from 'chalk';
/** Minimal, dependency-light logger with consistent, greppable prefixes. */
export const logger = {
    info(msg) {
        process.stdout.write(`${chalk.cyan('ℹ')} ${msg}\n`);
    },
    success(msg) {
        process.stdout.write(`${chalk.green('✓')} ${msg}\n`);
    },
    warn(msg) {
        process.stderr.write(`${chalk.yellow('⚠')} ${msg}\n`);
    },
    error(msg) {
        process.stderr.write(`${chalk.red('✗')} ${msg}\n`);
    },
    step(msg) {
        process.stdout.write(`${chalk.dim('›')} ${chalk.dim(msg)}\n`);
    },
};
//# sourceMappingURL=logger.js.map