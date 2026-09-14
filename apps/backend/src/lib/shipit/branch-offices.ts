export type ShipitBranchOffice = {
  id: number
  address: string
  commune_id: number
  courier_bo_id: string
  courier_id: number
  name: string
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function areDuplicateBranchOffices(
  left: ShipitBranchOffice,
  right: ShipitBranchOffice
): boolean {
  if (
    left.courier_id !== right.courier_id ||
    left.commune_id !== right.commune_id
  ) {
    return false
  }

  const leftCourierBranchId = normalizeText(left.courier_bo_id)
  const rightCourierBranchId = normalizeText(right.courier_bo_id)

  const sameCourierBranchId =
    leftCourierBranchId.length > 0 &&
    rightCourierBranchId.length > 0 &&
    leftCourierBranchId === rightCourierBranchId

  const leftAddress = normalizeText(left.address)
  const rightAddress = normalizeText(right.address)

  const sameAddress =
    leftAddress.length > 0 &&
    rightAddress.length > 0 &&
    leftAddress === rightAddress

  return sameCourierBranchId || sameAddress
}

export function deduplicateBranchOffices(
  branches: ShipitBranchOffice[]
): ShipitBranchOffice[] {
  const groups: ShipitBranchOffice[][] = []

  for (const branch of branches) {
    const matchingGroups = groups.filter((group) =>
      group.some((candidate) =>
        areDuplicateBranchOffices(candidate, branch)
      )
    )

    if (matchingGroups.length === 0) {
      groups.push([branch])
      continue
    }

    const merged = [branch, ...matchingGroups.flat()]

    for (const group of matchingGroups) {
      const index = groups.indexOf(group)

      if (index >= 0) {
        groups.splice(index, 1)
      }
    }

    groups.push(merged)
  }

  return groups.map((group) =>
    group.reduce((selected, branch) =>
      branch.id < selected.id ? branch : selected
    )
  )
}

export function findCanonicalBranchOffice(input: {
  branches: ShipitBranchOffice[]
  courierId: number
  communeId: number
  branchOfficeId: number
}): ShipitBranchOffice | null {
  const eligible = deduplicateBranchOffices(
    input.branches.filter(
      (branch) =>
        branch.courier_id === input.courierId &&
        branch.commune_id === input.communeId
    )
  )

  return (
    eligible.find(
      (branch) => branch.id === input.branchOfficeId
    ) ?? null
  )
}
