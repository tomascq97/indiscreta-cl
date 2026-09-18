type CourierSelection = {
  courier: {
    id: number
  }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("Concurrency limit must be a positive integer")
  }

  const results = new Array<R>(items.length)
  let nextIndex = 0

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))

  return results
}

export function uniqueCourierSelections<T extends CourierSelection>(
  selections: readonly T[]
): T[] {
  const unique = new Map<number, T>()

  selections.forEach((selection) => {
    if (!unique.has(selection.courier.id)) {
      unique.set(selection.courier.id, selection)
    }
  })

  return Array.from(unique.values())
}
