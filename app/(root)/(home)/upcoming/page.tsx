import { CallList } from '@/components/CallList'
import Image from 'next/image'
import React from 'react'

const Upcoming = () => {
  return (
    <section className="flex size-full flex-col gap-8 animate-fade-in">
      <header className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl
          bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200/50 shadow-sm">
          <Image src="/icons/upcoming.svg" alt="Upcoming" width={22} height={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
            Upcoming
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Your scheduled meetings and events</p>
        </div>
      </header>

      <div className="h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent mb-2" />

      <CallList type="upcoming" />
    </section>
  )
}

export default Upcoming
