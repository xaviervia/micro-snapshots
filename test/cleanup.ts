import { cleanup } from "../src"
import { SNAPSHOTS_FOLDER_NAME } from "./constants"
import { testFiles } from "./testFiles"

cleanup(testFiles, {
  snapshotsFolderName: SNAPSHOTS_FOLDER_NAME,
})
