import path from "path"
import { Result, Test } from "./types"
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import chalk from "chalk"
import { resultToString } from "./utils/resultToString"
import { diffLines } from "diff"
import { prettyPrintDiffChanges } from "./utils/prettyPrintDiffChanges"
import { createInterface } from "readline"
import { writeDeepFile } from "./utils/writeDeepFile"

const noop = () => {}
export const run = (
  tests: Test[],
  basePath = "",
  prefix = "__snapshots__",
  overwrite = false,
  ci = false,
  match?: string,
  continuation: () => void = noop
) => {
  const snapshotsDirPath = path.resolve(basePath, "..", prefix)
  try {
    mkdirSync(snapshotsDirPath)
  } catch (e) {}

  const matchedTests = tests.filter(([name]) =>
    match !== undefined ? new RegExp(match).test(name) : true
  )

  recurseOverTests(matchedTests, snapshotsDirPath, overwrite, ci, continuation)
}

const recurseOverTests = (
  tests: Test[],
  snapshotsDirPath: string,
  overwrite: boolean,
  ci: boolean,
  continuation: () => void
) => {
  if (tests.length === 0) {
    continuation()
    return
  }

  const [[name, test], ...rest] = tests

  const filePath = path.resolve(snapshotsDirPath, name)
  let result: Result

  try {
    result = test()
  } catch (e) {
    console.error(chalk.red(chalk.bold("//failed")))
    console.error(chalk.red(name))
    console.error()
    console.error(e)
    process.exit(1)
  }

  if (!overwrite) {
    let currentValue: string | null = null
    try {
      currentValue = readFileSync(filePath, "utf-8")

      const resultString = resultToString(result)

      if (currentValue !== resultString) {
        const theDiff = diffLines(currentValue, resultString)

        console.error(chalk.yellow(chalk.bold("//diff")))
        console.error(chalk.yellow(name))
        console.log()

        const prettyPrintedLineList = prettyPrintDiffChanges(theDiff, [])

        prettyPrintedLineList.forEach((line) => console.log(line))

        console.log()

        if (!ci) {
          const readline = createInterface({
            input: process.stdin,
            output: process.stdout,
          })

          if (prettyPrintedLineList.length > 16) {
            console.error(chalk.yellow(chalk.bold("//diff")))
            console.error(chalk.yellow(name))
            console.log()
          }
          readline.question(
            chalk.bold("patch?") +
              " not if no answer " +
              chalk.bold("(y/n/q) "),
            (value) => {
              if (value === "y") {
                console.log(chalk.blue(name))
                console.log(chalk.blue(chalk.bold("//patched")))
                console.log()
                writeFileSync(filePath, resultToString(result))
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
              } else if (value === "q") {
                writeDeepFile(
                  path.resolve(process.cwd(), "node_modules"),
                  [".cache", "@xaviervia", "micro-snapshots", "last-test.txt"],
                  name
                )

                console.log("quitting")
                console.log()
                process.exit(1)
              } else {
                writeDeepFile(
                  path.resolve(process.cwd(), "node_modules"),
                  [".cache", "@xaviervia", "micro-snapshots", "last-test.txt"],
                  name
                )
                console.log("kept as it was")
                console.log()
              }

              readline.close()
              recurseOverTests(
                rest,
                snapshotsDirPath,
                overwrite,
                ci,
                continuation
              )
            }
          )
        } else {
          process.exit(1)
        }
      } else {
        writeFileSync(filePath, resultToString(result))
        recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
      }
    } catch (e: any) {
      if ((e.message as string).startsWith("ENOENT")) {
        writeFileSync(filePath, resultToString(result))
        console.log(chalk.blue(name))
        console.log(chalk.blue(chalk.bold("//written")))
        console.log()
        recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
      } else {
        console.error()
        console.error(chalk.red(chalk.bold("//error")))
        console.error(e)
        process.exit(1)
      }
    }
  } else {
    writeFileSync(filePath, resultToString(result))
    recurseOverTests(rest, snapshotsDirPath, overwrite, ci, continuation)
  }
}
