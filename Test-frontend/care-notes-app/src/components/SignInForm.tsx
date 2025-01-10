"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { careNotesApi } from "../api/careNotesAPI"
import { Button } from "../ui/Button"
import { Card, CardBody, CardHeader } from "../ui/Card"
import { Field } from "../ui/Field"
import { ErrorState } from "../ui/states"

export interface SignInFormProps {
  /** Demo accounts to offer as a hint. Empty outside the demo data source. */
  demoAccounts?: Array<{ email: string; tenantName: string }>
  demoPassword?: string
}

/**
 * Sign-in.
 *
 * The tenant is *not* chosen here - it is attached to the account on the
 * server. That is the whole point: before this existed, a dropdown in the
 * browser decided whose notes you saw.
 */
export function SignInForm({ demoAccounts = [], demoPassword }: SignInFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await careNotesApi.signIn(email, password)
      const next = searchParams.get("next")
      router.replace(next && next.startsWith("/") ? next : "/")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.")
      setIsSubmitting(false)
    }
  }

  const applyDemoAccount = (accountEmail: string) => {
    setEmail(accountEmail)
    if (demoPassword) setPassword(demoPassword)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Sign in"
        description="Your organisation and the facilities you can see are attached to your account."
      />
      <CardBody>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error ? <ErrorState title="Could not sign in" message={error} /> : null}

          <Field label="Email">
            {(props) => (
              <input
                {...props}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>

          <Field label="Password">
            {(props) => (
              <input
                {...props}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {demoAccounts.length > 0 ? (
          <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Demo accounts
            </p>
            <p className="mt-1 text-sm text-ink-500">
              This build runs on seeded, synthetic data. Password:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-ink-700">
                {demoPassword}
              </code>
            </p>
            <ul className="mt-3 space-y-2">
              {demoAccounts.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => applyDemoAccount(account.email)}
                    className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-brand-500"
                  >
                    <span className="block font-medium text-ink-800">{account.email}</span>
                    <span className="block text-xs text-ink-500">{account.tenantName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}
