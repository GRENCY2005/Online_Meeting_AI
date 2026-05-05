import MeetingTypeList from '@/components/MeetingTypeList';
import React from 'react';

const Home = () => {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now);
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <section className="flex size-full flex-col gap-8 animate-fade-in">
      {/* Hero */}
      <div className="relative w-full rounded-3xl overflow-hidden min-h-[300px]"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6D28D9 100%)' }}>

        <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-violet-400/25 blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

        <div className="relative flex h-full min-h-[300px] items-center justify-between
          max-md:flex-col max-md:items-start max-md:justify-between
          max-md:px-6 max-md:py-8 px-10 lg:px-14 py-10 gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 w-fit border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/85 text-xs font-medium">{greeting} ✦</span>
            </div>
            <div>
              <h1 className="text-[3.8rem] lg:text-[5.5rem] font-extrabold text-white leading-none tracking-tighter">{time}</h1>
              <p className="text-indigo-200 text-base lg:text-lg font-medium mt-2">{date}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-md:flex-row max-md:flex-wrap">
            <div className="bg-white/12 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/20 hover:bg-white/20 transition-all duration-300 min-w-[165px] animate-float">
              <p className="text-indigo-200 text-[11px] font-semibold uppercase tracking-widest mb-1">Today&apos;s Date</p>
              <p className="text-white text-lg font-bold">{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="bg-white/12 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/20 hover:bg-white/20 transition-all duration-300 min-w-[165px] animate-float" style={{ animationDelay: '0.8s' }}>
              <p className="text-indigo-200 text-[11px] font-semibold uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-white text-sm font-bold">Ready to Meet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-gradient-indigo">Quick Actions</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent" />
        </div>
        <MeetingTypeList />
      </div>
    </section>
  );
};

export default Home;
