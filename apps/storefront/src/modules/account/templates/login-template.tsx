"use client"

import { useState } from "react"

import Login from "@modules/account/components/login"
import Register from "@modules/account/components/register"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-sm">
        {currentView === LOGIN_VIEW.SIGN_IN ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>
    </div>
  )
}

export default LoginTemplate
