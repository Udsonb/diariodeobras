import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface ButtonLinkProps extends ButtonVariantProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function ButtonLink({ href, children, variant, size, className }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  )
}
