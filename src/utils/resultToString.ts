import { Result } from "../types"

export const resultToString = (result: Result): string => {
  if (result === undefined) return ""
  if (typeof result === "string") return result
  return JSON.stringify(result, null, 2)
}
