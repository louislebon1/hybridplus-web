'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type InputHTMLAttributes, type ButtonHTMLAttributes } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
type BadgeColor = 'default' | 'accent' | 'success' | 'error' | 'warning'

// ── Button ─────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg hover:opacity-90 active:opacity-80 disabled:opacity-40',
  secondary:
    'bg-bg-element text-text border border-border hover:bg-bg-hover active:bg-bg-selected disabled:opacity-40',
  ghost:
    'bg-transparent text-text hover:bg-bg-element active:bg-bg-hover disabled:opacity-40',
  danger:
    'bg-error text-white hover:opacity-90 active:opacity-80 disabled:opacity-40',
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2.5 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-normal transition-all cursor-pointer select-none',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      ].join(' ')}
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

export function Input({ label, error, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-normal text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full h-10 px-3 rounded-xl bg-bg-element border text-text text-sm',
          'placeholder:text-text-secondary',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
          'transition-colors',
          error
            ? 'border-error focus:ring-error/40 focus:border-error'
            : 'border-border',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: BadgeColor
}

const badgeColorClasses: Record<BadgeColor, string> = {
  default: 'bg-bg-element text-text-secondary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  error: 'bg-error/15 text-error',
  warning: 'bg-warning/15 text-warning',
}

export function Badge({ label, color = 'default' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal',
        badgeColorClasses[color],
      ].join(' ')}
    >
      {label}
    </span>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const interactive = onClick !== undefined

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
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
      className={[
        'bg-bg-element border border-border rounded-2xl p-4',
        interactive
          ? 'cursor-pointer hover:bg-bg-hover active:bg-bg-selected transition-colors'
          : '',
        className,
      ].join(' ')}
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

  // Lock body scroll while open
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
          {/* Overlay */}
          <motion.div
            key="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="no-radius fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-bg max-h-[92dvh]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-border">
                <h2 className="text-base font-normal text-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-element hover:bg-bg-hover transition-colors text-text-secondary"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto flex-1 safe-bottom">{children}</div>
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

const spinnerSizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={[
        'rounded-full border-border border-t-accent animate-spin',
        spinnerSizeClasses[size],
      ].join(' ')}
    />
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-4">
      <span className="text-5xl select-none" role="img" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-normal text-text">{title}</h3>
        <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      </div>
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
