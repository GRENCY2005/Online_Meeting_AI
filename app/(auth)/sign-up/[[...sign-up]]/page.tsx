import { SignUp } from '@clerk/nextjs'
import React from 'react'

const SignUpPage = () => {
  return (
    <main className='relative flex h-screen w-full items-center justify-center overflow-hidden'
      style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F0FF 40%, #E0E7FF 100%)' }}>

      {/* Large background blobs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      {/* Dot grid texture */}
      <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #A5B4FC 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Floating decorative shapes */}
      <div className="absolute top-20 left-1/4 w-14 h-14 rounded-2xl -rotate-12 opacity-20 pointer-events-none bg-gradient-to-br from-violet-400 to-purple-400" />
      <div className="absolute bottom-20 right-1/4 w-10 h-10 rounded-full opacity-15 pointer-events-none bg-gradient-to-br from-indigo-400 to-blue-400" />
      <div className="absolute top-1/3 left-16 w-8 h-8 rounded-xl rotate-45 opacity-20 pointer-events-none bg-gradient-to-br from-purple-300 to-pink-300" />

      <div className="relative z-10">
        <SignUp />
      </div>
    </main>
  )
}

export default SignUpPage
