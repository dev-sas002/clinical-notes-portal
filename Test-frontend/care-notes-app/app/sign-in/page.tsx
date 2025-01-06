import { Suspense } from "react"
import { SignInForm } from "../../src/components/SignInForm"
import { DEMO_PASSWORD, demoCredentials } from "../../src/server/users"

export const dynamic = "force-dynamic"

/**
 * Server component: the demo account hints are decided on the server, so a
 * production build with a real directory configured simply has none.
 */
export default function SignInPage() {
  const accounts = demoCredentials()

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
        >
          CN
        </span>
        <div>
          <p className="text-lg font-semibold text-ink-900">Care Notes</p>
          <p className="text-sm text-ink-500">Multi-facility care recording</p>
        </div>
      </div>
      <Suspense fallback={null}>
        <SignInForm
          demoAccounts={accounts}
          demoPassword={accounts.length ? DEMO_PASSWORD : undefined}
        />
      </Suspense>
    </div>
  )
}
