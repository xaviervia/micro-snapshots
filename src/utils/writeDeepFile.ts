import { mkdirSync, writeFileSync } from "fs"
import path from "path"

export const writeDeepFile = (
  basePath: string,
  filePathPieces: string[],
  content: string
): void => {
  if (filePathPieces.length === 1) {
    return writeFileSync(path.resolve(basePath, filePathPieces[0]), content)
  }

  const [current, ...rest] = filePathPieces
  const nextBasePath = path.resolve(basePath, current)
  try {
    mkdirSync(nextBasePath)
  } catch (e) {}

  return writeDeepFile(nextBasePath, rest, content)
}
