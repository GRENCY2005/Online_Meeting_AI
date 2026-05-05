import React, { ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navabar from '@/components/Navabar'
import Slider from '@/components/Slider'

const HomeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthGuard>
      <main className='relative min-h-screen' style={{ background: '#F5F0FF' }}>
        <Navabar />
        <div className='flex'>
          <Slider />
          <section className='flex min-h-screen flex-1 flex-col px-6 pb-10 pt-20 max-md:pb-16 sm:px-8 lg:px-10'>
            <div className='w-full max-w-7xl mx-auto'>
              {children}
            </div>
          </section>
        </div>
      </main>
    </AuthGuard>
  )
}

export default HomeLayout
