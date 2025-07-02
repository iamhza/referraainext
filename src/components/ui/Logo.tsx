import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn(
      "inline-flex items-center transition-all duration-300 ease-in-out",
      "hover:scale-110 hover:brightness-110",
      "active:scale-95",
      "opacity-0 animate-[fadeIn_1.5s_ease-in-out_forwards]",
      className
    )}>
      <Image
        src="/referra Main Logo.png"
        alt="Referra"
        width={140}
        height={40}
        priority
        quality={100}
        className="h-8 w-auto object-contain transition-all duration-300 ease-in-out"
      />
    </div>
  )
}
