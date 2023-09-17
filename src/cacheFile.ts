import { unlinkSync } from "fs"
import path from "path"
import { writeDeepFile } from "./utils/writeDeepFile"

export const writeCacheFile = (name: string) => {
  writeDeepFile(
    path.resolve(process.cwd(), "node_modules"),
    [".cache", "@xaviervia", "micro-snapshots", "last-test.txt"],
    name
  )
}

export const removeCacheFile = () => {
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
}
