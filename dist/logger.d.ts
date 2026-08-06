/** Minimal, dependency-light logger with consistent, greppable prefixes. */
export declare const logger: {
    info(msg: string): void;
    success(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
    step(msg: string): void;
};
