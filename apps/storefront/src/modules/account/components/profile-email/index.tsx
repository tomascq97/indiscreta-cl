"use client"

import { esCl } from "@lib/translations/es-cl"
import React from "react"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div className="w-full">
      <AccountInfo
        label={esCl.account.email}
        currentInfo={customer.email}
        clearState={() => undefined}
        editable={false}
        helperText="Por seguridad, el correo asociado a la cuenta no puede modificarse desde esta sección."
        data-testid="account-email-editor"
      />
    </div>
  )
}

export default ProfileEmail
