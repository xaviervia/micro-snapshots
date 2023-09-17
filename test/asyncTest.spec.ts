export const tests = [
  [
    "test async",
    async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve("changed!"), 50)
      })

      return promise
    },
  ],
]
