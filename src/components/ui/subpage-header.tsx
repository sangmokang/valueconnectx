import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SubpageHeaderProps {
  backHref: string
  backLabel: string
  category?: string
  status?: {
    label: string
    active: boolean
  }
  title: string
  subtitle?: string
  className?: string
}

export function SubpageHeader({
  backHref,
  backLabel,
  category,
  status,
  title,
  subtitle,
  className,
}: SubpageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href={backHref}
          className="vcx-label text-vcx-sub-4 hover:text-vcx-gold transition-colors"
        >
          ← {backLabel}
        </Link>
      </nav>

      {/* Gold accent divider */}
      <div className="w-8 h-[2px] bg-vcx-gold mb-5" />

      {/* Category + status row */}
      {(category || status) && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {category && (
            <span className="vcx-label px-2 py-0.5 bg-vcx-beige text-vcx-sub-3">
              {category}
            </span>
          )}
          {status && (
            <span
              className={`vcx-label px-2 py-0.5 border ${
                status.active
                  ? 'border-vcx-gold text-vcx-gold'
                  : 'border-vcx-sub-5 text-vcx-sub-5'
              }`}
            >
              {status.label}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="font-vcx-serif text-[26px] sm:text-[32px] font-normal text-vcx-dark leading-snug">
        {title}
      </h1>

      {/* Subtitle / meta */}
      {subtitle && (
        <p className="font-vcx-sans text-[13px] text-vcx-sub-3 mt-2">{subtitle}</p>
      )}
    </div>
  )
}
