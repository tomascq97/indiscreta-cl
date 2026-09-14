import { esCl } from "@lib/translations/es-cl"
import { Disclosure } from "@headlessui/react"
import { clx } from "@modules/common/components/ui"
import { useEffect } from "react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  editable?: boolean
  helperText?: string
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "Ocurrió un error. Inténtalo nuevamente.",
  children,
  editable = true,
  helperText,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()
  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <section
      className="border border-neutral-200 bg-white"
      data-testid={dataTestid}
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {label}
          </p>

          <div className="mt-3 break-words text-sm font-semibold leading-6 text-black sm:text-base">
            {typeof currentInfo === "string" ? (
              <span data-testid="current-info">
                {currentInfo || "Sin información"}
              </span>
            ) : (
              currentInfo
            )}
          </div>

          {helperText ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              {helperText}
            </p>
          ) : null}
        </div>

        {editable ? (
          <button
            className="inline-flex min-h-10 shrink-0 items-center justify-center border border-black px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? "Cancelar" : "Editar"}
          </button>
        ) : null}
      </div>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "overflow-hidden border-t border-neutral-200 px-5 transition-[max-height,opacity,padding] duration-300 ease-in-out sm:px-6",
            {
              "max-h-40 py-4 opacity-100": isSuccess,
              "max-h-0 py-0 opacity-0": !isSuccess,
            },
          )}
          data-testid="success-message"
        >
          <div className="border-l-4 border-green-600 bg-green-50 px-4 py-3 text-sm text-green-800">
            {label} se actualizó correctamente.
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "overflow-hidden border-t border-neutral-200 px-5 transition-[max-height,opacity,padding] duration-300 ease-in-out sm:px-6",
            {
              "max-h-40 py-4 opacity-100": isError,
              "max-h-0 py-0 opacity-0": !isError,
            },
          )}
          data-testid="error-message"
        >
          <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        </Disclosure.Panel>
      </Disclosure>

      {editable ? (
        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "overflow-visible border-t border-neutral-200 transition-[max-height,opacity] duration-300 ease-in-out",
              {
                "max-h-[1400px] opacity-100": state,
                "max-h-0 overflow-hidden opacity-0": !state,
              },
            )}
          >
            <div className="p-5 sm:p-6">
              <div>{children}</div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={pending}
                  className="inline-flex min-h-12 w-full items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  type="submit"
                  data-testid="save-button"
                >
                  {pending ? "Guardando..." : esCl.account.saveChanges}
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </Disclosure>
      ) : null}
    </section>
  )
}

export default AccountInfo
