import path from "path"
import { CollectedTestName, Test } from "./types"
import { run } from "./run"
import { readFileSync, unlinkSync } from "fs"
import chalk from "chalk"
import { cleanupSnapshotFolders } from "./utils/cleanupSnapshotFolders"

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

let notifiedAboutMatch = false

export const runFiles = (
  filePaths: string[],
  options?: {
    snapshotsFolderName?: string
    shouldOverwrite?: boolean
    shouldMatch?: string
    isCI?: boolean
    shouldReRun?: boolean
    shouldCleanup?: boolean
  },
  collectedTestNames: CollectedTestName[] = []
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

    if (options?.shouldCleanup === true) {
      cleanupSnapshotFolders(collectedTestNames)
    }

    return
  }

  const toMatch = getToMatch(options)

  if (toMatch !== undefined && notifiedAboutMatch === false) {
    console.log()
    console.log(chalk.bold("//matching"))
    console.log(toMatch)
    console.log()
    notifiedAboutMatch = true
  }

  const [filePath, ...rest] = filePaths
  const resolvedFilePath = path.resolve(filePath)
  const { tests }: { tests: Test[] } = require(resolvedFilePath)

  const snapshotFolderPrefix = options?.snapshotsFolderName ?? "__snapshots__"

  const snapshotsDirPath = path.resolve(
    resolvedFilePath,
    "..",
    snapshotFolderPrefix
  )

  const currentCollectedTestNames: CollectedTestName = {
    snapshotsDirPath,
    testNames: tests.map(([name]) => name),
  }

  run(
    tests,
    snapshotsDirPath,
    options?.shouldOverwrite ?? false,
    options?.isCI,
    toMatch,
    () => {
      runFiles(rest, options, [
        ...collectedTestNames,
        currentCollectedTestNames,
      ])
    }
  )
}
