import chalk from "chalk";

const format = {
  info: (msg) => chalk.cyan(msg),
  success: (msg) => chalk.green(msg),
  warn: (msg) => chalk.yellow(msg),
  error: (msg) => chalk.red(msg),
  subtle: (msg) => chalk.gray(msg),
  headline: (msg) => chalk.bold(msg),
};

export const logger = {
  info: (msg) => console.log(format.info(msg)),
  success: (msg) => console.log(format.success(msg)),
  warn: (msg) => console.log(format.warn(msg)),
  error: (msg) => console.error(format.error(msg)),
  subtle: (msg) => console.log(format.subtle(msg)),
  headline: (msg) => console.log(format.headline(msg)),
  raw: (msg) => console.log(msg),
};

export const styles = format;