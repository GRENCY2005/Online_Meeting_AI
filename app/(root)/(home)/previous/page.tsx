import React from 'react'
import Image from 'next/image'
import { CallList } from '@/components/CallList'

const Previous = () => {
  return (
    <section className="flex size-full flex-col gap-8 animate-fade-in">
      <header className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl
          bg-gradient-to-br from-violet-100 to-purple-100 border border-violet-200/50 shadow-sm">
          <Image src="/icons/previous.svg" alt="Previous" width={22} height={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Previous
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Your recently ended meetings</p>
        </div>
      </header>

      <div className="h-px bg-gradient-to-r from-violet-200 via-purple-200 to-transparent mb-2" />

      <CallList type="ended" />
    </section>
  )
}

export default Previous
