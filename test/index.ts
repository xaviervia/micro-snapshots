import { runFiles } from '../src'

const SNAPSHOTS_FOLDER_NAME = '__snapshots__'
const shouldOverwrite = process.argv.includes('-u')
const shouldMatch = process.argv.slice(2).filter((argument) => argument !== '-u')[0]

runFiles(
  ['./test/demo.spec.ts'],
  { 
    snapshotsFolderName: SNAPSHOTS_FOLDER_NAME,
    shouldOverwrite,
    shouldMatch,
  }
)
