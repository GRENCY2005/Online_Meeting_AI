import Navabar from '@/components/Navabar'
import Slider from '@/components/Slider'
import { Metadata } from 'next';
import React, { ReactNode } from 'react'

export const metadata: Metadata = {
    title: "MeetVerse",
    description: "Modern video conferencing for everyone",
    icons: { icon: '/icons/logo.svg' }
};

const HomeLayout = ({ children }: { children: ReactNode }) => {
    return (
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
    )
}

export default HomeLayout
