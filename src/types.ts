export type Result = boolean | number | string | [] | {} | undefined | null

export type Test = [string, () => Result]

export type CollectedTestName = {
  snapshotsDirPath: string
  testNames: string[]
}
