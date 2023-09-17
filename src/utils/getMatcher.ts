export const getMatcher = (match?: string) => {
  return (name: string) => {
    if (match === undefined) {
      return true
    }

    return name.indexOf(match) !== -1
  }
}
