import React from 'react'

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F0FF' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 animate-spin"></div>
          <div className="absolute inset-1 rounded-full border-[2px] border-violet-100 border-b-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="text-gray-400 text-sm font-semibold tracking-wide">Loading...</p>
      </div>
    </div>
  )
}

export default Loader
