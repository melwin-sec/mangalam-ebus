import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

type LoginFormProps = {
  audience: 'student' | 'staff'
  identifierLabel: string
}

function LoginForm({ audience, identifierLabel }: LoginFormProps) {
  const formId = useId()
  const identifierRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ identifier: false, password: false })
  const [notice, setNotice] = useState('')

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    setNotice('')
    if (!(event.target instanceof HTMLInputElement)) return

    const { name, value } = event.target
    if (name === 'identifier' && value.trim()) {
      setErrors((current) => ({ ...current, identifier: false }))
    }
    if (name === 'password' && value) {
      setErrors((current) => ({ ...current, password: false }))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const identifier = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const nextErrors = {
      identifier: identifier.length === 0,
      password: password.length === 0,
    }

    setErrors(nextErrors)
    if (nextErrors.identifier || nextErrors.password) {
      setNotice('Complete the required fields to continue.')
      if (nextErrors.identifier) {
        identifierRef.current?.focus()
      } else {
        passwordRef.current?.focus()
      }
      return
    }

    setNotice(
      'Authentication is not connected in this prototype. Your details were not sent or saved.',
    )
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
    >
      <div>
        <label
          className="mb-2 block text-sm font-medium text-foreground"
          htmlFor={`${formId}-identifier`}
        >
          {identifierLabel}
        </label>
        <input
          ref={identifierRef}
          id={`${formId}-identifier`}
          name="identifier"
          type="text"
          autoComplete="username"
          required
          aria-invalid={errors.identifier}
          aria-describedby={errors.identifier ? `${formId}-identifier-error` : undefined}
          className={errors.identifier ? 'border-danger focus:border-danger focus:ring-danger' : ''}
        />
        {errors.identifier && (
          <p
            className="mt-2 text-sm text-danger"
            id={`${formId}-identifier-error`}
          >
            Enter your {identifierLabel.toLowerCase()}.
          </p>
        )}
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-foreground"
          htmlFor={`${formId}-password`}
        >
          Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id={`${formId}-password`}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-invalid={errors.password}
            aria-describedby={errors.password ? `${formId}-password-error` : undefined}
            className={`pr-12 ${errors.password ? 'border-danger focus:border-danger focus:ring-danger' : ''}`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-md text-muted transition-colors hover:text-foreground focus-visible:z-10"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-2 text-sm text-danger" id={`${formId}-password-error`}>
            Enter your password.
          </p>
        )}
      </div>

      {notice && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm leading-6 ${
            errors.identifier || errors.password
              ? 'border-danger/40 bg-danger/10 text-danger'
              : 'border-primary/30 bg-primary/10 text-muted-strong'
          }`}
          role={errors.identifier || errors.password ? 'alert' : 'status'}
        >
          {notice}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-primary-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        Continue as {audience}
      </button>
    </form>
  )
}

export default LoginForm
