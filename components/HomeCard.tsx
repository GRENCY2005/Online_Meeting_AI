import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface HomeCardProps {
  className: string,
  img: string,
  title: string,
  description: string,
  handleClick: () => void;
}

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  return (
    <div
      className={cn(
        'relative px-6 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[220px]',
        'rounded-3xl cursor-pointer overflow-hidden',
        'transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]',
        'active:scale-[0.97] group',
        className
      )}
      onClick={handleClick}
    >
      {/* Decorative shapes — standard Tailwind opacity values */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute -bottom-12 -left-6 w-36 h-36 rounded-full bg-black/10 pointer-events-none" />
      <div className="absolute top-1/2 right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

      {/* Shine on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />

      {/* Top row: icon + arrow */}
      <div className="relative flex items-start justify-between">
        <div className="flex-center bg-white/20 w-12 h-12 rounded-2xl shadow-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-105">
          <Image src={img} alt={title} height={22} width={22} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowRight size={14} className="text-white" />
        </div>
      </div>

      {/* Text — fully opaque white for maximum contrast */}
      <div className='relative flex flex-col gap-1.5'>
        <h1 className='text-[1.15rem] font-bold text-white leading-snug drop-shadow-sm'>{title}</h1>
        <p className='text-sm font-medium text-white leading-relaxed opacity-85'>{description}</p>
      </div>
    </div>
  )
}

export default HomeCard
