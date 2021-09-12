import chalk from "chalk";
import * as diff from "diff";
import fs from "fs";
import path from "path";

type Result = boolean | number | string | [] | {} | undefined | null;

type Test = [string, () => Result];

function iterate(diffs: diff.Change[], result: string[]): string[] {
  if (diffs.length === 0) {
    return result;
  }

  const [diff, ...rest] = diffs;
  const value = diff.value.length === 1 ? diff.value : diff.value.slice(0, -1);

  if (diff.removed === true) {
    return iterate(rest, [
      ...result,
      ...value.split("\n").map((line) => chalk.red(`- ${line}`)),
    ]);
  }

  if (diff.added === true) {
    return iterate(rest, [
      ...result,
      ...value.split("\n").map((line) => chalk.green(`+ ${line}`)),
    ]);
  }

  return iterate(rest, [...result, ...value.split("\n")]);
}

const overwriteTest = (filePath: string, result: Result) => {
  if (typeof result === "string") {
    fs.writeFileSync(filePath, result);
  } else {
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(result, null, 2));
  }
};

const runTest =
  (snapshotsDirPath: string, overwrite: boolean) =>
  ([name, test]: Test) => {
    const filePath = path.resolve(snapshotsDirPath, name);
    let result: Result;

    try {
      result = test();
    } catch (e) {
      console.error(chalk.red(chalk.bold("//failed")));
      console.error(chalk.red(name));
      console.error();
      console.error(e);
      process.exit(1);
    }

    if (!overwrite) {
      let currentValue: string | null = null;
      try {
        currentValue = fs.readFileSync(filePath, "utf-8");

        const resultString =
          typeof result === "string" ? result : JSON.stringify(result, null, 2);

        if (currentValue !== resultString) {
          const theDiff = diff.diffLines(currentValue, resultString);

          console.error(chalk.yellow(chalk.bold("//diff")));
          console.error(chalk.yellow(name));
          console.log();

          iterate(theDiff, []).forEach((line) => console.log(line));

          console.log();
          process.exit(1);
        }
      } catch (e) {}
    }

    overwriteTest(filePath, result);
  };

export const run = (
  tests: Test[],
  basePath = "",
  prefix = "__snapshots__",
  overwrite = false,
  match?: string
) => {
  const snapshotsDirPath = path.resolve(basePath, "..", prefix);
  try {
    fs.mkdirSync(snapshotsDirPath);
  } catch (e) {}

  const runTestWithPath = runTest(snapshotsDirPath, overwrite);

  tests
    .filter(([name]) =>
      match !== undefined ? new RegExp(match).test(name) : true
    )
    .forEach(runTestWithPath);
};

export const runFiles = (
  filePaths: string[],
  options?: {
    snapshotsFolderName?: string;
    shouldOverwrite?: boolean;
    shouldMatch?: string;
  }
) => {
  filePaths.forEach((filePath) => {
    const resolvedFilePath = path.resolve(filePath);
    const { tests }: { tests: Test[] } = require(resolvedFilePath);

    run(
      tests,
      resolvedFilePath,
      options?.snapshotsFolderName ?? "__snapshots__",
      options?.shouldOverwrite ?? false,
      options?.shouldMatch
    );
  });
};
