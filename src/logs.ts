import chalk from "chalk"

export const errorFailure = (name: string, e: Error) => {
  console.error(chalk.red(chalk.bold("//failed")))
  console.error(chalk.red(name))
  console.error()
  console.error(e)
}

export const nonTestSpecificFailure = (e: Error) => {
  console.error()
  console.error(chalk.red(chalk.bold("//error")))
  console.error(e)
}

export const diff = (name: string) => {
  console.error(chalk.yellow(chalk.bold("//diff")))
  console.error(chalk.yellow(name))
  console.log()
}

export const patched = (name: string) => {
  console.log(chalk.blue(name))
  console.log(chalk.blue(chalk.bold("//patched")))
  console.log()
}

export const quitting = () => {
  console.log("quitting")
  console.log()
}

export const keptTheSame = () => {
  console.log("kept as it was")
  console.log()
}

export const notWritten = () => {
  console.log("not written")
  console.log()
}

export const newFailure = (name: string) => {
  console.log(chalk.red(chalk.bold("//new")))
  console.log(chalk.red(name))
}

export const newTestReport = (name: string, resultString: string) => {
  console.error(chalk.yellow(chalk.bold("//new")))
  console.error(chalk.yellow(name))
  console.log()

  console.log(resultString)
  console.log()

  if (resultString.split("\n").length > 16) {
    console.log(chalk.yellow(chalk.bold("//new")))
    console.log(chalk.yellow(name))
    console.log()
  }
}

export const written = (name: string) => {
  console.log(chalk.blue(name))
  console.log(chalk.blue(chalk.bold("//written")))
  console.log()
}

export const matching = (toMatch: string) => {
  console.log()
  console.log(chalk.bold("//matching"))
  console.log(toMatch)
  console.log()
}
