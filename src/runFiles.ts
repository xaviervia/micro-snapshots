import path from "path"
import { Test } from "./types"
import { run } from "./run"
import { readFileSync, unlinkSync } from "fs"
import chalk from "chalk"

const getToMatch = (options?: {
  snapshotsFolderName?: string
  shouldOverwrite?: boolean
  shouldMatch?: string
  isCI?: boolean
  shouldReRun?: boolean
}): string | undefined => {
  if (options?.shouldReRun === true) {
    try {
      return readFileSync(
        path.resolve(
          process.cwd(),
          "node_modules",
          ".cache",
          "@xaviervia",
          "micro-snapshots",
          "last-test.txt"
        ),
        "utf-8"
      )
    } catch (e) {}
  }

  return options?.shouldMatch
}

export const runFiles = (
  filePaths: string[],
  options?: {
    snapshotsFolderName?: string
    shouldOverwrite?: boolean
    shouldMatch?: string
    isCI?: boolean
    shouldReRun?: boolean
  }
) => {
  if (filePaths.length === 0) {
    try {
      unlinkSync(
        path.resolve(
          process.cwd(),
          "node_modules",
          ".cache",
          "@xaviervia",
          "micro-snapshots",
          "last-test.txt"
        )
      )
    } catch (e) {}
    return
  }

  const toMatch = getToMatch(options)

  if (toMatch !== undefined) {
    console.log()
    console.log(chalk.bold("//matching"))
    console.log(toMatch)
    console.log()
  }

  const [filePath, ...rest] = filePaths
  const resolvedFilePath = path.resolve(filePath)
  const { tests }: { tests: Test[] } = require(resolvedFilePath)

  run(
    tests,
    resolvedFilePath,
    options?.snapshotsFolderName ?? "__snapshots__",
    options?.shouldOverwrite ?? false,
    options?.isCI,
    toMatch,
    () => {
      runFiles(rest, options)
    }
  )
}
