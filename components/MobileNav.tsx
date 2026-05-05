'use client'

import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { sliderLinks } from '@/app/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

const MobileNav = () => {
  const pathname = usePathname()
  return (
    <section className='w-full max-w-[264px]'>
      <Sheet>
        <SheetTrigger asChild>
          <button className='sm:hidden p-2 rounded-xl hover:bg-indigo-50 transition-colors duration-200 text-indigo-400'>
            <Menu size={22} />
          </button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="border-none p-0 w-[280px]"
          style={{ background: 'linear-gradient(180deg, #3730A3 0%, #4338CA 45%, #5B21B6 100%)' }}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          {/* Decorative circles */}
          <div className="absolute top-16 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-24 -left-6 w-28 h-28 rounded-full bg-violet-400/10 pointer-events-none" />

          <div className="relative p-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-8">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 shadow-sm">
                <Image src="/icons/logo.png" alt="MeetVerse" width={22} height={22} className='brightness-0 invert' />
              </div>
              <p className='text-[20px] font-bold text-white'>MeetVerse</p>
            </Link>

            {/* Nav Links */}
            <div className='flex flex-col gap-1.5'>
              {sliderLinks.map((link) => {
                const isActive = pathname === link.route || pathname.startsWith(link.route);
                return (
                  <SheetClose asChild key={link.route}>
                    <Link
                      href={link.route}
                      className={cn(
                        'flex gap-3 items-center px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-white/15 text-white border border-white/20 font-semibold'
                          : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg',
                        isActive ? 'bg-white/25' : 'bg-white/10'
                      )}>
                        <Image
                          src={link.imgUrl}
                          alt={link.label}
                          width={17}
                          height={17}
                          className="brightness-0 invert opacity-90"
                        />
                      </div>
                      <p className='font-medium text-sm'>{link.label}</p>
                      {isActive && <span className="ml-auto w-1.5 h-4 rounded-full bg-white/60" />}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>

          {/* Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-indigo-300/70 font-medium">MeetVerse v1.0</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

export default MobileNav
