import { runFiles } from "../src"
import { SNAPSHOTS_FOLDER_NAME } from "./constants"
import { testFiles } from "./testFiles"

const shouldOverwrite = process.argv.includes("-u")
const shouldMatch = process.argv
  .slice(2)
  .filter((argument) => argument !== "-u")[0]

runFiles(testFiles, {
  snapshotsFolderName: SNAPSHOTS_FOLDER_NAME,
  shouldOverwrite,
  shouldMatch,
})
