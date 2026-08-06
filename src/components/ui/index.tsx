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

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button disabled={disabled}
      
      {...rest}>
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
    <div>
      {label && (
        <label htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId}
        
        {...rest} />
      {error && <p>{error}</p>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: BadgeColor
}

export function Badge({ label, color = 'default' }: BadgeProps) {
  return (
    <span>
      {label}
    </span>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ children, onClick }: CardProps) {
  const interactive = onClick !== undefined

  return (
    <div role={interactive ? 'button' : undefined}
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
      }>
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
            
            onClick={onClose}
            aria-hidden="true" />

          <motion.div
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
            <div>
              <div />
            </div>

            {title && (
              <div>
                <h2>{title}</h2>
                <button onClick={onClose}
                  
                  aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            )}

            <div>{children}</div>
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

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div role="status"
      aria-label="Loading" />
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
    <div>
      <Icon size={28} strokeWidth={1.5}  aria-hidden />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
