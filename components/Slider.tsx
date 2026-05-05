'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { sliderLinks } from '@/app/constants'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image';

const Slider = () => {
  const pathname = usePathname();

  return (
    <section
      className="sticky left-0 top-0 flex h-screen w-64 flex-col max-sm:hidden lg:w-[264px]"
      style={{ background: 'linear-gradient(180deg, #3730A3 0%, #4338CA 45%, #5B21B6 100%)' }}
    >
      {/* Decorative circles inside sidebar */}
      <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-20 -left-8 w-32 h-32 rounded-full bg-violet-400/10 pointer-events-none" />

      <div className="relative flex flex-1 flex-col p-5 pt-24 gap-1.5">
        {sliderLinks.map((link) => {
          const isActive =
            link.route === '/'
              ? pathname === '/'
              : pathname === link.route || pathname.startsWith(`${link.route}/`);

          return (
            <Link
              href={link.route}
              key={link.label}
              prefetch
              scroll={false}
              className={cn(
                'group flex gap-3 items-center px-4 py-3 rounded-xl transition-all duration-250',
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              )}
            >
              {/* Icon pill */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200',
                isActive
                  ? 'bg-white/25 shadow-sm'
                  : 'bg-white/10 group-hover:bg-white/20'
              )}>
                <Image
                  src={link.imgUrl}
                  alt={link.label}
                  width={17}
                  height={17}
                  priority
                  className="brightness-0 invert opacity-90"
                />
              </div>

              <p className={cn(
                'text-sm max-lg:hidden transition-all duration-200',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {link.label}
              </p>

              {isActive && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-white/60 max-lg:hidden" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom branding */}
      <div className="relative p-5 pt-3 border-t border-white/10 max-lg:hidden">
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-indigo-300/70 font-medium">MeetVerse v1.0</p>
        </div>
      </div>
    </section>
  );
};

export default Slider;
