import path from "path"
import { CollectedTestName, Test } from "./types"
import { run } from "./run"
import { readFileSync } from "fs"
import { cleanupSnapshotFolders } from "./utils/cleanupSnapshotFolders"
import { removeCacheFile } from "./cacheFile"
import * as logs from "./logs"

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

export const runFiles = async (
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
    removeCacheFile()

    if (options?.shouldCleanup === true) {
      cleanupSnapshotFolders(collectedTestNames)
    }

    return
  }

  const toMatch = getToMatch(options)

  if (toMatch !== undefined && notifiedAboutMatch === false) {
    logs.matching(toMatch)
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

  await run(
    tests,
    snapshotsDirPath,
    options?.shouldOverwrite ?? false,
    options?.isCI,
    toMatch,
    async () => {
      await runFiles(rest, options, [
        ...collectedTestNames,
        currentCollectedTestNames,
      ])
    }
  )
}
