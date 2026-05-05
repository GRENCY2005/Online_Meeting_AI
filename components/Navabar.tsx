'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from './MobileNav'
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'

const Navabar = () => {
  return (
    <nav className='flex-between fixed z-50 w-full h-16 px-4 lg:px-10
      bg-white/85 backdrop-blur-xl
      border-b border-indigo-100/60
      shadow-[0_1px_20px_rgba(99,102,241,0.08)]'>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden
          bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm
          group-hover:shadow-glow-indigo transition-all duration-300 group-hover:scale-105">
          <Image
            src="/icons/logo.png"
            alt="MeetVerse"
            width={22}
            height={22}
            className='brightness-0 invert'
          />
        </div>
        <p className='text-[21px] font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent max-sm:hidden tracking-tight'>
          MeetVerse
        </p>
      </Link>

      {/* Right actions */}
      <div className='flex items-center gap-3'>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 ring-2 ring-indigo-100 hover:ring-indigo-300 transition-all duration-200 rounded-xl'
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className='rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2
              text-white text-sm font-semibold
              hover:from-indigo-700 hover:to-violet-700
              hover:shadow-glow-indigo
              transition-all duration-200 shadow-sm active:scale-[0.97]'>
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <MobileNav />
      </div>
    </nav>
  )
}

export default Navabar
