import chalk from "chalk"
import { readdirSync, unlinkSync } from "fs"
import path from "path"
import { CollectedTestName } from "../types"

const groupBySnapshotsDirPath = (
  collectedTestNames: CollectedTestName[],
  result: Record<string, string[]> = {}
): Record<string, string[]> => {
  if (collectedTestNames.length === 0) {
    return result
  }

  const [{ snapshotsDirPath, testNames }, ...rest] = collectedTestNames

  if (result[snapshotsDirPath] === undefined) {
    return groupBySnapshotsDirPath(rest, {
      ...result,
      [snapshotsDirPath]: [...testNames],
    })
  }

  return groupBySnapshotsDirPath(rest, {
    ...result,
    [snapshotsDirPath]: [...result[snapshotsDirPath], ...testNames],
  })
}

export const cleanupSnapshotFolders = (
  collectedTestNames: CollectedTestName[]
) => {
  if (collectedTestNames.length === 0) {
    return
  }

  const groupedBySnapshotsDirPath = groupBySnapshotsDirPath(collectedTestNames)

  console.log()
  for (const snapshotsDirPath in groupedBySnapshotsDirPath) {
    const testNames = groupedBySnapshotsDirPath[snapshotsDirPath]
    const allFilesInDir = new Set(readdirSync(snapshotsDirPath))

    for (const testName of testNames) {
      allFilesInDir.delete(testName)
    }

    allFilesInDir.forEach((superfluousSnapshot) => {
      try {
        unlinkSync(path.resolve(snapshotsDirPath, superfluousSnapshot))
        console.log(chalk.green(chalk.bold("//removed")))
        console.log(chalk.green(snapshotsDirPath))
        console.log(chalk.green(superfluousSnapshot))
        console.log()
      } catch (e) {}
    })
  }
}
