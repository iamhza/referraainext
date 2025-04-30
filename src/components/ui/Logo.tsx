import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("inline-block no-underline", className)} style={{ textDecoration: 'none' }}>
      <Image
        src="/referra Main Logo.png"
        alt="Referra"
        width={120}
        height={40}
        priority
        className="no-underline"
      />
    </div>
  )
}
