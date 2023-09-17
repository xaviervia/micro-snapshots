import path from "path"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import chalk from "chalk"
import { diffLines } from "diff"
import { createInterface } from "readline"
import isPromise from "is-promise"
import { Result, Test } from "./types"
import { prettyPrintDiffChanges } from "./utils/prettyPrintDiffChanges"
import { resultToString } from "./utils/resultToString"
import * as logs from "./logs"
import { removeCacheFile, writeCacheFile } from "./cacheFile"
import { getMatcher } from "./utils/getMatcher"

export const run = async (
  tests: Test[],
  snapshotsDirPath: string,
  overwrite = false,
  ci = false,
  match?: string,
  continuation: () => Promise<any> = async () => {}
) => {
  try {
    mkdirSync(snapshotsDirPath)
  } catch (e) {}

  const matcher = getMatcher(match)
  const matchedTests = tests.filter(([name]) => {
    return matcher(name)
  })

  await recurseOverTests(
    matchedTests,
    snapshotsDirPath,
    overwrite,
    ci,
    continuation
  )
}

const recurseOverTests = async (
  tests: Test[],
  snapshotsDirPath: string,
  overwrite: boolean,
  ci: boolean,
  continuation: () => Promise<any>
) => {
  if (tests.length === 0) {
    await continuation()
    return
  }

  const [[name, test], ...rest] = tests

  const filePath = path.resolve(snapshotsDirPath, name)
  let result: Result | Promise<Result>

  try {
    result = test()
  } catch (e) {
    logs.errorFailure(name, e as Error)

    process.exit(1)
  }

  if (isPromise(result)) {
    const promisedResult = await result

    await processResult(
      promisedResult as Result,
      overwrite,
      filePath,
      name,
      ci,
      rest,
      snapshotsDirPath,
      continuation
    )
    return
  }

  await processResult(
    result,
    overwrite,
    filePath,
    name,
    ci,
    rest,
    snapshotsDirPath,
    continuation
  )
}

const processResult = async (
  result: Result,
  overwrite: boolean,
  filePath: string,
  name: string,
  ci: boolean,
  rest: Test[],
  snapshotsDirPath: string,
  continuation: () => Promise<any>
) => {
  const resultString = resultToString(result)

  if (!overwrite) {
    let currentValue: string | null = null
    try {
      currentValue = readFileSync(filePath, "utf-8")

      if (currentValue !== resultString) {
        const theDiff = diffLines(currentValue, resultString)

        logs.diff(name)

        const prettyPrintedLineList = prettyPrintDiffChanges(theDiff, [])

        prettyPrintedLineList.forEach((line) => console.log(line))

        console.log()

        if (!ci) {
          askQuestion(
            prettyPrintedLineList,
            filePath,
            resultString,
            name,
            rest,
            snapshotsDirPath,
            overwrite,
            ci,
            continuation
          )
        } else {
          process.exit(1)
        }
      } else {
        writeFileSync(filePath, resultToString(result))
        await recurseOverTests(
          rest,
          snapshotsDirPath,
          overwrite,
          ci,
          continuation
        )
      }
    } catch (e: any) {
      processError(
        e,
        ci,
        resultString,
        filePath,
        name,
        rest,
        snapshotsDirPath,
        overwrite,
        continuation
      )
    }
  } else {
    writeFileSync(filePath, resultToString(result))
    await recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
  }
}

const askQuestion = (
  prettyPrintedLineList: string[],
  filePath: string,
  resultString: string,
  name: string,
  rest: Test[],
  snapshotsDirPath: string,
  overwrite: boolean,
  ci: boolean,
  continuation: () => Promise<any>
) => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  if (prettyPrintedLineList.length > 16) {
    logs.diff(name)
  }
  readline.question(
    chalk.bold("patch?") + " not if no answer " + chalk.bold("(y/n/q) "),
    (value) => {
      if (value === "y") {
        logs.patched(name)
        writeFileSync(filePath, resultString)
        removeCacheFile()
      } else if (value === "q") {
        writeCacheFile(name)

        logs.quitting()
        process.exit(1)
      } else {
        writeCacheFile(name)
        logs.keptTheSame()
      }

      readline.close()
      recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
    }
  )
}

const processError = (
  e: Error,
  ci: boolean,
  resultString: string,
  filePath: string,
  name: string,
  rest: Test[],
  snapshotsDirPath: string,
  overwrite: boolean,
  continuation: () => Promise<any>
) => {
  if (e.message.startsWith("ENOENT")) {
    if (ci) {
      logs.newFailure(name)
      process.exit(1)
    }

    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    logs.newTestReport(name, resultString)

    readline.question(
      chalk.bold("write?") + " not if no answer " + chalk.bold("(y/n/q) "),
      (value) => {
        if (value === "y") {
          writeFileSync(filePath, resultString)
          logs.written(name)
        } else if (value === "q") {
          writeCacheFile(name)

          logs.quitting()
          process.exit(1)
        } else {
          writeCacheFile(name)
          logs.notWritten()
        }

        readline.close()
        recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
      }
    )
  } else {
    logs.nonTestSpecificFailure(e)
    process.exit(1)
  }
}
