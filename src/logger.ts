import chalk from 'chalk';

/** Minimal, dependency-light logger with consistent, greppable prefixes. */
export const logger = {
  info(msg: string): void {
    process.stdout.write(`${chalk.cyan('ℹ')} ${msg}\n`);
  },
  success(msg: string): void {
    process.stdout.write(`${chalk.green('✓')} ${msg}\n`);
  },
  warn(msg: string): void {
    process.stderr.write(`${chalk.yellow('⚠')} ${msg}\n`);
  },
  error(msg: string): void {
    process.stderr.write(`${chalk.red('✗')} ${msg}\n`);
  },
  step(msg: string): void {
    process.stdout.write(`${chalk.dim('›')} ${chalk.dim(msg)}\n`);
  },
};
