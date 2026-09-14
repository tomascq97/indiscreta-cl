"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import {
  listShipitBranchOffices,
  listShipitCommunes,
  listShipitCouriers,
  type ShipitBranchOfficeOption,
  type ShipitCourierOption,
} from "@lib/data/shipit"
import { esCl } from "@lib/translations/es-cl"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

const SHIPIT_HOME = "home_delivery"
const SHIPIT_BRANCH = "courier_branch_office"

function isFiniteAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

type CalculatedShippingOption = HttpTypes.StoreCartShippingOption & {
  data?: {
    selection_policy?: string
    destination_kind?: string
  } | null
}

type BranchSelection = {
  courier: ShipitCourierOption
  branch: ShipitBranchOfficeOption
}

type DeliveryMode = "home" | "branch" | null

function isShipitHomeOption(option: HttpTypes.StoreCartShippingOption) {
  const data = (option as CalculatedShippingOption).data

  return (
    option.price_type === "calculated" &&
    data?.selection_policy === "cheapest-v1" &&
    data?.destination_kind === SHIPIT_HOME
  )
}

function isShipitBranchOption(option: HttpTypes.StoreCartShippingOption) {
  const data = (option as CalculatedShippingOption).data

  return (
    option.price_type === "calculated" &&
    data?.selection_policy === "selected-branch-v1" &&
    data?.destination_kind === SHIPIT_BRANCH
  )
}

function buildBranchData(selection: BranchSelection) {
  return {
    courier_id: selection.courier.id,
    courier: selection.courier.name.toLowerCase(),
    branch_office_id: selection.branch.id,
    branch_office_name: selection.branch.name,
    branch_office_address: selection.branch.address,
    destination_commune_id: selection.branch.commune_id,
  }
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)

  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})

  const [error, setError] = useState<string | null>(null)

  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const [couriers, setCouriers] = useState<ShipitCourierOption[]>([])
  const [branches, setBranches] = useState<BranchSelection[]>([])
  const [selectedBranchKey, setSelectedBranchKey] = useState<string | null>(null)
  const [selectedBranchSnapshot, setSelectedBranchSnapshot] =
    useState<BranchSelection | null>(null)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(null)
  const [branchSearch, setBranchSearch] = useState("")
  const [branchVisibleCount, setBranchVisibleCount] = useState(6)
  const [isChangingBranch, setIsChangingBranch] = useState(false)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  const [branchPrices, setBranchPrices] = useState<Record<string, number>>({})
  const [branchQuoteStatus, setBranchQuoteStatus] = useState<
    Record<string, "loading" | "done" | "error">
  >({})

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = useMemo(
    () =>
      availableShippingMethods?.filter(
        (sm) =>
          (
            sm as unknown as {
              service_zone?: {
                fulfillment_set?: {
                  type?: string
                }
              }
            }
          ).service_zone?.fulfillment_set?.type !== "pickup"
      ),
    [availableShippingMethods]
  )

  const _pickupMethods = useMemo(
    () =>
      availableShippingMethods?.filter(
        (sm) =>
          (
            sm as unknown as {
              service_zone?: {
                fulfillment_set?: {
                  type?: string
                }
              }
            }
          ).service_zone?.fulfillment_set?.type === "pickup"
      ),
    [availableShippingMethods]
  )

  const shipitBranchOption = useMemo(
    () => (_shippingMethods ?? []).find(isShipitBranchOption),
    [_shippingMethods]
  )

  const hasPickupOptions = !!_pickupMethods?.length


  const normalizeSearch = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()

  const searchedBranches = useMemo(() => {
    const query = normalizeSearch(branchSearch)

    if (!query) {
      return branches
    }

    return branches.filter(({ courier, branch }) =>
      normalizeSearch(
        `${branch.name} ${branch.address} ${courier.name}`
      ).includes(query)
    )
  }, [branches, branchSearch])

  const availableBranches = useMemo(() => {
    return searchedBranches
      .filter(({ courier }) => {
        return branchQuoteStatus[`courier:${courier.id}`] !== "error"
      })
      .sort((left, right) => {
        const leftKey = `${left.courier.id}:${left.branch.id}`
        const rightKey = `${right.courier.id}:${right.branch.id}`

        const leftPrice = branchPrices[leftKey]
        const rightPrice = branchPrices[rightKey]

        const leftReady = isFiniteAmount(leftPrice)
        const rightReady = isFiniteAmount(rightPrice)

        if (leftReady && rightReady && leftPrice !== rightPrice) {
          return leftPrice - rightPrice
        }

        if (leftReady !== rightReady) {
          return leftReady ? -1 : 1
        }

        return left.branch.name.localeCompare(
          right.branch.name,
          "es-CL",
          { sensitivity: "base" }
        )
      })
  }, [
    searchedBranches,
    branchQuoteStatus,
    branchPrices,
  ])

  const visibleBranches = useMemo(
    () => availableBranches.slice(0, branchVisibleCount),
    [availableBranches, branchVisibleCount]
  )

  const selectedBranch = useMemo(() => {
    const branchFromCurrentList = selectedBranchKey
      ? branches.find(
          ({ courier, branch }) =>
            `${courier.id}:${branch.id}` === selectedBranchKey
        ) ?? null
      : null

    return branchFromCurrentList ?? selectedBranchSnapshot
  }, [branches, selectedBranchKey, selectedBranchSnapshot])

  const isBranchConfirmed =
    !!selectedBranch &&
    shippingMethodId === shipitBranchOption?.id &&
    isFiniteAmount(calculatedPricesMap[shipitBranchOption?.id ?? ""])

  const isResolvingBranchQuotes = useMemo(() => {
    if (!searchedBranches.length) {
      return false
    }

    const courierIds = Array.from(
      new Set(
        searchedBranches.map(({ courier }) => courier.id)
      )
    )

    return courierIds.some((courierId) => {
      const status =
        branchQuoteStatus[`courier:${courierId}`]

      return !status || status === "loading"
    })
  }, [searchedBranches, branchQuoteStatus])

  useEffect(() => {
    let cancelled = false

    setIsLoadingPrices(true)

    const calculatedMethods = (_shippingMethods ?? []).filter(
      (sm) =>
        sm.price_type === "calculated" &&
        !isShipitBranchOption(sm)
    )

    const promises = calculatedMethods.map(async (sm) => ({
      option: sm,
      result: await calculatePriceForShippingOption(sm.id, cart.id),
    }))

    if (promises.length) {
      Promise.allSettled(promises).then((results) => {
        if (cancelled) {
          return
        }

        const pricesMap: Record<string, number> = {}

        results.forEach((result) => {
          if (
            result.status === "fulfilled" &&
            result.value.result?.id &&
            isFiniteAmount(result.value.result.amount)
          ) {
            pricesMap[result.value.result.id] = result.value.result.amount
          }
        })

        setCalculatedPricesMap((previous) => ({
          ...previous,
          ...pricesMap,
        }))

        const shipitHomeFailed = calculatedMethods.some(
          (option) =>
            isShipitHomeOption(option) &&
            !isFiniteAmount(pricesMap[option.id])
        )

        setError(
          shipitHomeFailed
            ? "No pudimos calcular el despacho para esta comuna. Revisa la dirección o inténtalo nuevamente."
            : null
        )

        setIsLoadingPrices(false)
      })
    } else {
      setCalculatedPricesMap({})
      setIsLoadingPrices(false)
    }

    return () => {
      cancelled = true
    }
  }, [_shippingMethods, cart.id])

  useEffect(() => {
    const selectedShippingOption = (_shippingMethods ?? []).find(
      (option) => option.id === shippingMethodId
    )

    const selectedPickupOption = (_pickupMethods ?? []).some(
      (option) => option.id === shippingMethodId
    )

    if (selectedShippingOption && isShipitBranchOption(selectedShippingOption)) {
      setDeliveryMode("branch")

      const currentMethod = cart.shipping_methods?.at(-1) as
        | (HttpTypes.StoreCartShippingMethod & {
            data?: Record<string, unknown> | null
          })
        | undefined

      const courierId = Number(currentMethod?.data?.courier_id)
      const branchOfficeId = Number(currentMethod?.data?.branch_office_id)

      if (
        Number.isSafeInteger(courierId) &&
        courierId > 0 &&
        Number.isSafeInteger(branchOfficeId) &&
        branchOfficeId > 0
      ) {
        setSelectedBranchKey(`${courierId}:${branchOfficeId}`)
      }

      return
    }

    if (selectedPickupOption) {
      setDeliveryMode("branch")
      return
    }

    if (selectedShippingOption) {
      setDeliveryMode("home")
    }
  }, [
    _shippingMethods,
    _pickupMethods,
    shippingMethodId,
    cart.shipping_methods,
  ])

  useEffect(() => {
    if (!shipitBranchOption || deliveryMode !== "branch") {
      setCouriers([])
      setBranches([])
      return
    }

    let cancelled = false

    listShipitCouriers()
      .then((result) => {
        if (!cancelled) {
          setCouriers(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCouriers([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [shipitBranchOption, deliveryMode])

  useEffect(() => {
    if (
      !shipitBranchOption ||
      deliveryMode !== "branch" ||
      !couriers.length
    ) {
      setBranches([])
      setIsLoadingBranches(false)
      return
    }

    const city = cart.shipping_address?.city?.trim()

    if (!city) {
      setBranches([])
      setIsLoadingBranches(false)
      return
    }

    let cancelled = false

    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()

    setIsLoadingBranches(true)
    setBranches([])
    setBranchPrices({})
    setBranchQuoteStatus({})

    listShipitCommunes()
      .then(async (communes) => {
        const commune = communes.find(
          (candidate) => normalize(candidate.name) === normalize(city)
        )

        if (!commune) {
          throw new Error("Shipit commune not found")
        }

        const groups = await Promise.all(
          couriers.map(async (courier) => {
            try {
              const courierBranches = await listShipitBranchOffices(
                courier.id,
                commune.id
              )

              return {
                courier,
                branches: courierBranches,
              }
            } catch {
              return {
                courier,
                branches: [] as ShipitBranchOfficeOption[],
              }
            }
          })
        )

        if (!cancelled) {
          setBranches(
            groups.flatMap(({ courier, branches }) =>
              branches.map((branch) => ({
                courier,
                branch,
              }))
            )
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBranches([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingBranches(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    shipitBranchOption,
    deliveryMode,
    couriers,
    cart.shipping_address?.city,
  ])
  useEffect(() => {
    if (
      deliveryMode !== "branch" ||
      !shipitBranchOption ||
      searchedBranches.length === 0
    ) {
      return
    }

    // Una selección representativa por courier.
    // La tarifa de retiro se valida por courier + destino.
    const courierSelections = Array.from(
      new Map(
        searchedBranches.map((selection) => [
          selection.courier.id,
          selection,
        ])
      ).values()
    )

    const pendingCouriers = courierSelections.filter((selection) => {
      const courierKey = `courier:${selection.courier.id}`

      return !branchQuoteStatus[courierKey]
    })

    if (!pendingCouriers.length) {
      return
    }

    setBranchQuoteStatus((previous) => {
      const next = { ...previous }

      pendingCouriers.forEach(({ courier }) => {
        next[`courier:${courier.id}`] = "loading"
      })

      return next
    })

    let cancelled = false

    Promise.allSettled(
      pendingCouriers.map(async (selection) => {
        const result = await calculatePriceForShippingOption(
          shipitBranchOption.id,
          cart.id,
          buildBranchData(selection)
        )

        if (!result || !isFiniteAmount(result.amount)) {
          throw new Error(
            `Invalid Shipit quote for courier ${selection.courier.id}`
          )
        }

        return {
          courierId: selection.courier.id,
          amount: result.amount,
        }
      })
    ).then((results) => {
      if (cancelled) {
        return
      }

      setBranchPrices((previous) => {
        const next = { ...previous }

        results.forEach((result) => {
          if (result.status !== "fulfilled") {
            return
          }

          branches.forEach(({ courier, branch }) => {
            if (courier.id === result.value.courierId) {
              next[`${courier.id}:${branch.id}`] =
                result.value.amount
            }
          })
        })

        return next
      })

      setBranchQuoteStatus((previous) => {
        const next = { ...previous }

        results.forEach((result, index) => {
          const courierId = pendingCouriers[index].courier.id

          next[`courier:${courierId}`] =
            result.status === "fulfilled" ? "done" : "error"
        })

        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [
    deliveryMode,
    shipitBranchOption,
    searchedBranches,
    branches,
    cart.id,
  ])
  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleDeliveryModeChange = (mode: Exclude<DeliveryMode, null>) => {
    setError(null)
    setDeliveryMode(mode)
    setBranchSearch("")
    setBranchVisibleCount(6)

    // Obliga al usuario a confirmar un método compatible con el nuevo modo.
    setShippingMethodId(null)

    if (mode === "home") {
      setSelectedBranchKey(null)
      setBranches([])
      setBranchPrices({})
      setBranchQuoteStatus({})
    } else {
      setSelectedBranchKey(null)
      setBranchSearch("")
      setBranchVisibleCount(6)
    }
  }

  const handleSubmit = () => {
    if (!deliveryMode) {
      setError("Selecciona cómo quieres recibir tu pedido.")
      return
    }

    const selectedShippingOption = (_shippingMethods ?? []).find(
      (option) => option.id === shippingMethodId
    )

    const selectedPickupOption = (_pickupMethods ?? []).find(
      (option) => option.id === shippingMethodId
    )

    if (deliveryMode === "home") {
      if (
        !selectedShippingOption ||
        isShipitBranchOption(selectedShippingOption)
      ) {
        setError("Selecciona un método de envío a domicilio.")
        return
      }

      if (
        selectedShippingOption.price_type === "flat" &&
        !isFiniteAmount(selectedShippingOption.amount)
      ) {
        setError("Este método de despacho no tiene una tarifa válida.")
        return
      }

      if (
        selectedShippingOption.price_type === "calculated" &&
        !isFiniteAmount(calculatedPricesMap[selectedShippingOption.id])
      ) {
        setError(
          "Debes obtener una tarifa de despacho válida antes de continuar."
        )
        return
      }
    }

    if (deliveryMode === "branch") {
      const isShipitBranch =
        selectedShippingOption &&
        isShipitBranchOption(selectedShippingOption)

      if (!isShipitBranch && !selectedPickupOption) {
        setError("Selecciona un punto de retiro antes de continuar.")
        return
      }

      if (isShipitBranch && !selectedBranchKey) {
        setError("Debes seleccionar una sucursal antes de continuar.")
        return
      }

      if (
        isShipitBranch &&
        !isFiniteAmount(calculatedPricesMap[selectedShippingOption.id])
      ) {
        setError("La sucursal seleccionada no tiene una tarifa válida.")
        return
      }
    }

    sessionStorage.removeItem("indiscreta-checkout-terms")

    router.push(pathname + "?step=payment", {
      scroll: false,
    })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup",
    data?: Record<string, unknown>
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null

    setIsLoading(true)

    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: id,
      data,
    })
      .catch((_err) => {
        setShippingMethodId(currentId)
        setError(esCl.errors.generic)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleSelectBranch = async (selection: BranchSelection) => {
    if (!shipitBranchOption) {
      return
    }

    const key = `${selection.courier.id}:${selection.branch.id}`
    const previousKey = selectedBranchKey
    const data = buildBranchData(selection)

    setError(null)
    setIsLoading(true)
    setSelectedBranchKey(key)
    setSelectedBranchSnapshot(selection)

    try {
      const calculated = await calculatePriceForShippingOption(
        shipitBranchOption.id,
        cart.id,
        data
      )

      if (!calculated || !isFiniteAmount(calculated.amount)) {
        throw new Error("Shipit branch quote unavailable")
      }

      setCalculatedPricesMap((previous) => ({
        ...previous,
        [shipitBranchOption.id]: calculated.amount,
      }))

      await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: shipitBranchOption.id,
        data,
      })

      setShippingMethodId(shipitBranchOption.id)
      setShowPickupOptions(PICKUP_OPTION_OFF)
      setIsChangingBranch(false)
    } catch {
      setSelectedBranchKey(previousKey)

      if (!previousKey) {
        setSelectedBranchSnapshot(null)
      }

      setError(
        "Esta sucursal no tiene una tarifa disponible para este pedido. Elige otra sucursal."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const confirmedShippingMethod = cart.shipping_methods?.at(-1)

  const confirmedShippingData = confirmedShippingMethod?.data as
    | Record<string, unknown>
    | null
    | undefined

  const confirmedBranchId = Number(
    confirmedShippingData?.branch_office_id
  )

  const confirmedBranchName =
    typeof confirmedShippingData?.branch_office_name === "string"
      ? confirmedShippingData.branch_office_name
      : null

  const confirmedBranchAddress =
    typeof confirmedShippingData?.branch_office_address === "string"
      ? confirmedShippingData.branch_office_address
      : null

  const confirmedCourier =
    typeof confirmedShippingData?.courier === "string"
      ? confirmedShippingData.courier
      : null

  const isConfirmedBranchPickup =
    (Number.isSafeInteger(confirmedBranchId) && confirmedBranchId > 0) ||
    Boolean(confirmedBranchName || confirmedBranchAddress)

  if (searchParams.get("step") === "address") {
    return null
  }

  return (
    <div className="bg-white p-5 sm:p-7 lg:p-8">
      <header className="border-b border-neutral-200 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
              Paso 02
            </p>

            <Heading
              level="h2"
              className={clx(
                "mt-2 flex items-center gap-2 text-2xl font-bold tracking-[-0.03em] text-black sm:text-3xl",
                {
                  "opacity-50 pointer-events-none select-none":
                    !isOpen && cart.shipping_methods?.length === 0,
                }
              )}
            >
              {esCl.orders.shipping}

              {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
                <CheckCircleSolid className="h-5 w-5 text-[var(--color-rose)]" />
              )}
            </Heading>
          </div>

          {!isOpen &&
            cart?.shipping_address &&
            cart?.billing_address &&
            cart?.email && (
              <button
                type="button"
                onClick={handleEdit}
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-[var(--color-rose)]"
                data-testid="edit-delivery-button"
              >
                {esCl.common.edit}
              </button>
            )}
        </div>
      </header>

      {isOpen ? (
        <div className="mt-7">
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Método de entrega
              </span>

              <span className="mb-5 text-ui-fg-muted txt-medium">
                ¿Cómo quieres recibir tu compra?
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleDeliveryModeChange("home")}
                className={clx(
                  "w-full text-left border rounded-lg px-5 py-5 transition-all",
                  "hover:border-ui-border-interactive hover:shadow-sm",
                  deliveryMode === "home"
                    ? "border-ui-border-interactive ring-1 ring-ui-border-interactive"
                    : "border-ui-border-base"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 text-base-regular font-medium">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={clx(
      "h-5 w-5 shrink-0 transition-colors",
      deliveryMode === "home"
        ? "text-ui-fg-interactive"
        : "text-ui-fg-muted"
    )}
    aria-hidden="true"
  >
    <path
      d="M3 10.75 12 3l9 7.75"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 9.25V21h13V9.25"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.25 21v-6.5h5.5V21"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <span>Envío a domicilio</span>
</div>

                    <div className="mt-1 text-small-regular text-ui-fg-muted">
                      Recibe tu compra en la dirección ingresada.
                    </div>
                  </div>

                  <div
                    className={clx(
                      "mt-1 h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                      deliveryMode === "home"
                        ? "border-ui-border-interactive"
                        : "border-ui-border-base"
                    )}
                  >
                    {deliveryMode === "home" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-ui-fg-interactive" />
                    )}
                  </div>
                </div>
              </button>

              {shipitBranchOption && (
                <button
                  type="button"
                  onClick={() => handleDeliveryModeChange("branch")}
                  className={clx(
                    "w-full text-left border rounded-lg px-5 py-5 transition-all",
                    "hover:border-ui-border-interactive hover:shadow-sm",
                    deliveryMode === "branch"
                      ? "border-ui-border-interactive ring-1 ring-ui-border-interactive"
                      : "border-ui-border-base"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 text-base-regular font-medium">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={clx(
      "h-5 w-5 shrink-0 transition-colors",
      deliveryMode === "branch"
        ? "text-ui-fg-interactive"
        : "text-ui-fg-muted"
    )}
    aria-hidden="true"
  >
    <path
      d="M4 9h16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M5 9 6.25 4h11.5L19 9"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 9v11h13V9"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 20v-6h6v6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 9.25c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>

  <span>Retiro en sucursal</span>
</div>

                      <div className="mt-1 text-small-regular text-ui-fg-muted">
                        Elige un punto de retiro disponible en tu comuna.
                      </div>
                    </div>

                    <div
                      className={clx(
                        "mt-1 h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                        deliveryMode === "branch"
                          ? "border-ui-border-interactive"
                          : "border-ui-border-base"
                      )}
                    >
                      {deliveryMode === "branch" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-ui-fg-interactive" />
                      )}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {deliveryMode === "home" && (
              <div className="mb-7">
                <div className="mb-3">
                  <span className="text-base-regular font-medium">
                    Opciones de despacho
                  </span>

                  <p className="mt-1 text-small-regular text-ui-fg-muted">
                    Selecciona la alternativa que prefieras.
                  </p>
                </div>

                <RadioGroup
                  value={shippingMethodId}
                  onChange={(value) => {
                    if (!value) {
                      return
                    }

                    const option = (_shippingMethods ?? []).find(
                      (candidate) => candidate.id === value
                    )

                    if (option && !isShipitBranchOption(option)) {
                      handleSetShippingMethod(value, "shipping")
                    }
                  }}
                >
                  {(_shippingMethods ?? [])
                    .filter((option) => !isShipitBranchOption(option))
                    .filter((option) => {
                      if (option.price_type === "flat") {
                        return isFiniteAmount(option.amount)
                      }

                      if (option.price_type === "calculated") {
                        return (
                          isLoadingPrices ||
                          isFiniteAmount(calculatedPricesMap[option.id])
                        )
                      }

                      return false
                    })
                    .map((option) => {
                      const amount =
                        option.price_type === "flat"
                          ? option.amount
                          : calculatedPricesMap[option.id]

                      const isDisabled =
                        option.price_type === "calculated" &&
                        !isLoadingPrices &&
                        !isFiniteAmount(amount)

                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={isDisabled}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-lg px-5 mb-2 hover:shadow-sm transition-all",
                            {
                              "border-ui-border-interactive ring-1 ring-ui-border-interactive":
                                option.id === shippingMethodId,
                              "cursor-not-allowed opacity-50": isDisabled,
                            }
                          )}
                        >
                          <div className="flex items-center gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />

                            <div className="flex flex-col">
                              <span className="text-base-regular">
                                {option.name}
                              </span>

                              {isShipitHomeOption(option) && (
                                <span className="text-small-regular text-ui-fg-muted">
                                  Tarifa económica · IVA incluido
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="justify-self-end text-ui-fg-base font-medium">
                            {isFiniteAmount(amount) ? (
                              convertToLocale({
                                amount,
                                currency_code: cart.currency_code,
                              })
                            ) : isLoadingPrices ? (
                              <Loader />
                            ) : (
                              "No disponible"
                            )}
                          </span>
                        </Radio>
                      )
                    })}
                </RadioGroup>
              </div>
            )}

            {deliveryMode === "branch" && shipitBranchOption && (
              <div className="mb-7">
                {selectedBranch && !isChangingBranch ? (
                  <div>
                    <div className="mb-3">
                      <span className="text-base-regular font-medium">
                        Punto de retiro
                      </span>
                      <p className="mt-1 text-small-regular text-ui-fg-muted">
                        {isLoading
                          ? "Estamos confirmando tu punto de retiro."
                          : "Tu punto de retiro está seleccionado."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#ec5b8c] bg-[#fff8fb] px-5 py-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex min-w-0 gap-x-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ec5b8c] text-xs font-semibold text-white">
                            ✓
                          </div>

                          <div className="min-w-0">
                            <span className="block text-small-regular font-medium text-[#d94779]">
                              {isLoading
                                ? "CONFIRMANDO PUNTO DE RETIRO"
                                : "PUNTO DE RETIRO SELECCIONADO"}
                            </span>

                            <span className="mt-2 block text-base-regular font-medium text-ui-fg-base">
                              {selectedBranch?.branch.name}
                            </span>

                            <span className="mt-1 block text-small-regular text-ui-fg-muted">
                              {selectedBranch?.branch.address}
                            </span>

                            <span className="mt-1 block text-small-regular text-ui-fg-muted">
                              {selectedBranch?.courier.name}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="block text-base-regular font-semibold text-ui-fg-base">
                            {selectedBranchKey &&
                            isFiniteAmount(branchPrices[selectedBranchKey]) ? (
                              convertToLocale({
                                amount: branchPrices[selectedBranchKey],
                                currency_code: cart.currency_code,
                              })
                            ) : isFiniteAmount(
                                calculatedPricesMap[shipitBranchOption.id]
                              ) ? (
                              convertToLocale({
                                amount:
                                  calculatedPricesMap[shipitBranchOption.id],
                                currency_code: cart.currency_code,
                              })
                            ) : (
                              <Loader />
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-[#f3c4d4] pt-4">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-small-regular font-medium text-[#d94779]">
                            <Loader />
                            <span>Confirmando punto de retiro...</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingBranch(true)
                              setBranchSearch("")
                              setBranchVisibleCount(6)
                            }}
                            className="text-small-regular font-medium text-[#d94779] hover:underline"
                          >
                            Cambiar punto de retiro
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-5">
                      <span className="text-base-regular font-medium">
                        Buscar punto de retiro
                      </span>

                      <p className="mt-1 text-small-regular text-ui-fg-muted">
                        Elige la sucursal que más te acomode.
                      </p>
                    </div>

                    <div className="mb-3">
                      <input
                        id="shipit-branch-search"
                        type="search"
                        value={branchSearch}
                        onChange={(event) => {
                          setBranchSearch(event.target.value)
                          setBranchVisibleCount(6)
                        }}
                        placeholder="Nombre, calle o sector..."
                        className="w-full h-12 rounded-md border border-ui-border-base bg-white px-4 text-base-regular outline-none focus:border-[#ec5b8c] focus:ring-1 focus:ring-[#ec5b8c]"
                      />
                    </div>

                    {!isLoadingBranches &&
                      !isResolvingBranchQuotes &&
                      availableBranches.length > 0 && (
                        <div className="mb-4 text-small-regular text-ui-fg-muted">
                          Mostrando {visibleBranches.length} de{" "}
                          {availableBranches.length} puntos disponibles en{" "}
                          {cart.shipping_address?.city || "tu comuna"}
                        </div>
                      )}

                    {isLoadingBranches ? (
                      <div className="flex items-center gap-x-2 rounded-lg border border-ui-border-base px-5 py-5 text-ui-fg-muted">
                        <Loader />
                        <span>Buscando puntos de retiro...</span>
                      </div>
                    ) : availableBranches.length === 0 ? (
                      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-5 py-5">
                        <span className="text-small-regular text-ui-fg-muted">
                          {branchSearch
                            ? "No encontramos puntos que coincidan con tu búsqueda."
                            : "No hay puntos de retiro disponibles para esta comuna."}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isResolvingBranchQuotes && (
                          <div className="mb-3 flex items-center gap-2 text-small-regular text-ui-fg-muted">
                            <Loader />
                            <span>Calculando tarifas disponibles...</span>
                          </div>
                        )}

                        <RadioGroup
                          value={selectedBranchKey}
                          onChange={(value) => {
                            const selection = branches.find(
                              ({ courier, branch }) =>
                                `${courier.id}:${branch.id}` === value
                            )

                            if (selection) {
                              handleSelectBranch(selection)
                            }
                          }}
                        >
                          {visibleBranches.map((selection) => {
                            const key = `${selection.courier.id}:${selection.branch.id}`
                            const price = branchPrices[key]
                            const quoteStatus = branchQuoteStatus[key]
                            const isSelected = selectedBranchKey === key

                            return (
                              <Radio
                                key={key}
                                value={key}
                                disabled={
                                  isLoading ||
                                  quoteStatus === "loading" ||
                                  !isFiniteAmount(price)
                                }
                                className={clx(
                                  "flex items-start justify-between text-small-regular cursor-pointer py-4 border rounded-lg px-5 mb-2 hover:shadow-sm transition-all",
                                  {
                                    "border-[#ec5b8c] ring-1 ring-[#ec5b8c] bg-[#fff8fb]":
                                      isSelected,
                                    "cursor-not-allowed opacity-60":
                                      isLoading || quoteStatus === "loading",
                                  }
                                )}
                              >
                                <div className="flex items-start gap-x-4 min-w-0">
                                  <MedusaRadio checked={isSelected} />

                                  <div className="flex flex-col min-w-0">
                                    <span className="text-base-regular font-medium">
                                      {selection.branch.name}
                                    </span>

                                    <span className="mt-1 text-small-regular text-ui-fg-muted">
                                      {selection.branch.address}
                                    </span>

                                    <span className="mt-1 text-small-regular text-ui-fg-muted">
                                      {selection.courier.name}
                                    </span>

                                    {isSelected && isLoading && (
                                      <span className="mt-2 text-small-regular font-medium text-[#d94779]">
                                        Confirmando punto de retiro...
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-6 shrink-0 text-right">
                                  {isFiniteAmount(price) ? (
                                    <span className="text-base-regular font-semibold text-ui-fg-base">
                                      {convertToLocale({
                                        amount: price,
                                        currency_code: cart.currency_code,
                                      })}
                                    </span>
                                  ) : (
                                    <Loader />
                                  )}
                                </div>
                              </Radio>
                            )
                          })}
                        </RadioGroup>

                        {availableBranches.length > branchVisibleCount && (
                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="secondary"
                              size="medium"
                              className="w-full"
                              onClick={() =>
                                setBranchVisibleCount((current) => current + 6)
                              }
                            >
                              Ver más puntos (
                              {Math.max(
                                availableBranches.length -
                                  branchVisibleCount,
                                0
                              )}
                              )
                            </Button>
                          </div>
                        )}

                        <div className="mt-5 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-5 py-4">
                          <span className="text-small-regular text-ui-fg-muted">
                            El precio puede variar según el punto de retiro seleccionado.
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            {deliveryMode === "branch" &&
              hasPickupOptions &&
              (_pickupMethods?.length ?? 0) > 0 && (
                <div className="mb-7">
                  <div className="mb-3">
                    <span className="text-base-regular font-medium">
                      Retiro en tienda
                    </span>

                    <p className="mt-1 text-small-regular text-ui-fg-muted">
                      También puedes retirar directamente en una tienda disponible.
                    </p>
                  </div>

                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(value) => {
                      if (value) {
                        handleSetShippingMethod(value, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      if (!isFiniteAmount(option.amount)) {
                        return null
                      }

                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-lg px-5 mb-2 hover:shadow-sm",
                            {
                              "border-ui-border-interactive ring-1 ring-ui-border-interactive":
                                option.id === shippingMethodId,
                              "cursor-not-allowed opacity-50":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />

                            <div className="flex flex-col">
                              <span className="text-base-regular">
                                {option.name}
                              </span>

                              <span className="text-small-regular text-ui-fg-muted">
                                {formatAddress(
                                  (
                                    option as unknown as {
                                      service_zone?: {
                                        fulfillment_set?: {
                                          location?: {
                                            address: HttpTypes.StoreCartAddress
                                          }
                                        }
                                      }
                                    }
                                  ).service_zone?.fulfillment_set?.location
                                    ?.address as HttpTypes.StoreCartAddress
                                )}
                              </span>
                            </div>
                          </div>

                          <span>
                            {convertToLocale({
                              amount: option.amount,
                              currency_code: cart.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              )}
          </div>

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />

            <Button
              size="large"
              className="mt-4"
              onClick={handleSubmit}
              disabled={
        isLoading ||
        !deliveryMode ||
        !shippingMethodId ||
        (deliveryMode === "branch" && !isBranchConfirmed)
      }
              data-testid="submit-delivery-option-button"
            >
              Continuar al pago →
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          {confirmedShippingMethod && (
            <article className="border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
                Método de despacho
              </p>

              <div className="mt-3 flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-black">
                    {isConfirmedBranchPickup
                      ? "Retiro en sucursal"
                      : confirmedShippingMethod.name}
                  </p>

                  {!isConfirmedBranchPickup && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Método seleccionado para esta compra.
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-base font-semibold text-black">
                  {convertToLocale({
                    amount: confirmedShippingMethod.amount!,
                    currency_code: cart.currency_code,
                  })}
                </p>
              </div>

              {isConfirmedBranchPickup && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Punto de retiro
                  </p>

                  {confirmedBranchName && (
                    <p className="mt-2 text-sm font-semibold text-black">
                      {confirmedBranchName}
                    </p>
                  )}

                  {confirmedBranchAddress && (
                    <p className="mt-1 text-sm leading-5 text-neutral-600">
                      {confirmedBranchAddress}
                    </p>
                  )}

                  {confirmedCourier && (
                    <p className="mt-1 text-xs font-medium capitalize text-neutral-500">
                      {confirmedCourier}
                    </p>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      )}


    </div>
  )
}

export default Shipping
