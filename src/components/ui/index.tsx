'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState, type InputHTMLAttributes, type ButtonHTMLAttributes } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'
type BadgeColor = 'default' | 'accent' | 'success' | 'error' | 'warning'

// ── Button ─────────────────────────────────────────────────────────────────
// Emphasis is inversion: the primary action is a scrim plane carrying void
// type, exactly as the world's board sets its Follow button.

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const BTN_BASE =
  'inline-flex items-center justify-center rounded-pill border cursor-pointer whitespace-nowrap ' +
  'transition-transform duration-150 ease-out active:scale-[0.97] ' +
  'disabled:opacity-35 disabled:cursor-default disabled:active:scale-100'

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-scrim text-void border-transparent',
  secondary: 'bg-transparent text-scrim border-scrim/35',
  ghost: 'bg-transparent text-stone border-transparent',
  outline: 'bg-transparent text-scrim border-scrim/35',
  danger: 'bg-transparent text-[#F0453A] border-[#F0453A]/40',
}

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 gap-1.5 text-label',
  md: 'h-14 px-7 gap-2.5 text-figure display',
  lg: 'h-16 px-8 gap-3 text-figure display',
}

export function Button({ variant = 'primary', size = 'md', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size]].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, ...rest }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="meta">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'h-14 px-4 rounded-card matt text-scrim text-body w-full',
          'placeholder:text-fog focus:outline-none focus:border-scrim/45',
          error ? 'border-[#F0453A]/60' : '',
        ].join(' ')}
        {...rest}
      />
      {error && <p className="text-label text-[#F0453A] m-0">{error}</p>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: BadgeColor
}

const BADGE: Record<BadgeColor, string> = {
  default: 'matt text-stone',
  accent: 'bg-scrim text-void border-transparent',
  success: 'bg-scrim text-void border-transparent',
  error: 'border border-[#F0453A]/40 text-[#F0453A]',
  warning: 'matt text-scrim',
}

export function Badge({ label, color = 'default' }: BadgeProps) {
  return <span className={`meta px-3 py-1.5 rounded-pill ${BADGE[color]}`}>{label}</span>
}

// ── Card ───────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ children, onClick }: CardProps) {
  const interactive = onClick !== undefined

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      className={[
        'matt rounded-card p-4',
        interactive ? 'cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]' : '',
      ].join(' ')}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

// ── Sheet ──────────────────────────────────────────────────────────────────

interface SheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-void/80"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-[24px] bg-midnight border-t border-scrim/12 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-pill bg-fog" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="display text-title m-0">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="px-5 pt-1">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const SPINNER: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${SPINNER[size]} rounded-pill border-steel border-t-scrim animate-spin`}
    />
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start px-1 py-10 gap-3">
      <Icon size={26} strokeWidth={1.5} className="text-fog" aria-hidden />
      <h3 className="display text-title m-0">{title}</h3>
      <p className="text-label text-stone m-0 max-w-[44ch]">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
