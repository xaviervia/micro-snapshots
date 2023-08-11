import { resultToString } from "./resultToString"

export const tests = [
  [
    "resultToString: stringifies the object",
    () => resultToString({ hello: "world" }),
  ],
]
