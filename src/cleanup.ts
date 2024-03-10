import path from "path"
import { CollectedTestName, Test } from "./types"
import { cleanupSnapshotFolders } from "./utils/cleanupSnapshotFolders"

export const cleanup = async (
  filePaths: string[],
  options?: {
    snapshotsFolderName?: string
    shouldOverwrite?: boolean
    shouldMatch?: string
    isCI?: boolean
    shouldReRun?: boolean
  },
  collectedTestNames: CollectedTestName[] = []
) => {
  if (filePaths.length === 0) {
    cleanupSnapshotFolders(collectedTestNames)
    return
  }

  const [filePath, ...rest] = filePaths
  const resolvedFilePath = path.resolve(filePath)
  const { tests }: { tests: Test[] } = await import(resolvedFilePath)

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

  cleanup(rest, options, [...collectedTestNames, currentCollectedTestNames])
}
