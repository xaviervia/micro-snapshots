import chalk from "chalk"
import { Change } from "diff"

export function prettyPrintDiffChanges(
  diffs: Change[],
  result: string[]
): string[] {
  if (diffs.length === 0) {
    return result
  }

  const [diff, ...rest] = diffs
  const value = diff.value

  if (diff.removed === true) {
    return prettyPrintDiffChanges(rest, [
      ...result,
      ...value.split("\n").map((line) => chalk.red(`- ${line}`)),
    ])
  }

  if (diff.added === true) {
    return prettyPrintDiffChanges(rest, [
      ...result,
      ...value.split("\n").map((line) => chalk.green(`+ ${line}`)),
    ])
  }

  return prettyPrintDiffChanges(rest, [...result, ...value.split("\n")])
}
