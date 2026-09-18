import { describe, expect, it } from "vitest"

import {
  mapWithConcurrency,
  uniqueCourierSelections,
} from "../pickup-orchestration"

describe("pickup orchestration", () => {
  it("limits concurrent work and preserves input order", async () => {
    let active = 0
    let maximumActive = 0

    const result = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6],
      2,
      async (value) => {
        active += 1
        maximumActive = Math.max(maximumActive, active)

        await new Promise((resolve) => setTimeout(resolve, 5))

        active -= 1
        return value * 10
      }
    )

    expect(maximumActive).toBe(2)
    expect(result).toEqual([10, 20, 30, 40, 50, 60])
  })

  it("rejects invalid concurrency limits", async () => {
    await expect(
      mapWithConcurrency([1], 0, async (value) => value)
    ).rejects.toThrow("Concurrency limit must be a positive integer")
  })

  it("selects only one representative branch per courier", () => {
    const selections = [
      {
        courier: { id: 8, name: "Bluexpress" },
        branch: { id: 7604, commune_id: 146 },
      },
      {
        courier: { id: 8, name: "Bluexpress" },
        branch: { id: 7605, commune_id: 146 },
      },
      {
        courier: { id: 1, name: "Chilexpress" },
        branch: { id: 1231, commune_id: 146 },
      },
    ]

    expect(uniqueCourierSelections(selections)).toEqual([
      selections[0],
      selections[2],
    ])
  })

  it("keeps the first selection when input order changes", () => {
    const first = {
      courier: { id: 2, name: "Starken" },
      branch: { id: 2082, commune_id: 146 },
    }
    const second = {
      courier: { id: 2, name: "Starken" },
      branch: { id: 2083, commune_id: 146 },
    }

    expect(uniqueCourierSelections([first, second])).toEqual([first])
  })
})
