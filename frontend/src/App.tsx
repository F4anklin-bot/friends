import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HomeScreen } from './screens/Home/HomeScreen'
import { ImpostorScreen } from './screens/ImpostorGame/ImpostorScreen'
import { MimesScreen } from './screens/MimesGame/MimesScreen'
import { TodScreen } from './screens/TruthOrDareGame/TodScreen'
import { SplashScreen } from './components/layout/SplashScreen'
import { useAppStore } from './store/appStore'
import { useThemeStore } from './store/themeStore'
import { useTodStore } from './store/todStore'

const shells: Record<string, string> = {
  home: 'bg-[radial-gradient(circle_at_top,#FF69B422,transparent_42%),linear-gradient(180deg,#fff7fb,#ffe4f0)] dark:bg-[radial-gradient(circle_at_top,#8B5CF633,transparent_40%),linear-gradient(180deg,#1A1A1A,#2D2D2D)]',
  soft: 'bg-[radial-gradient(circle_at_top,#38BDF855,transparent_46%),linear-gradient(180deg,#f0f9ff,#dbeafe)] dark:bg-[radial-gradient(circle_at_top,#38BDF833,transparent_44%),linear-gradient(180deg,#1A1A1A,#10202a)]',
  fun: 'bg-[radial-gradient(circle_at_top,#FFD70055,transparent_46%),linear-gradient(180deg,#fffaf0,#ffe9a8)] dark:bg-[radial-gradient(circle_at_top,#FFD70033,transparent_44%),linear-gradient(180deg,#1A1A1A,#2a2410)]',
  hot: 'bg-[radial-gradient(circle_at_top,#FF69B466,transparent_46%),linear-gradient(180deg,#fff5f8,#ffd0e4)] dark:bg-[radial-gradient(circle_at_top,#FF69B444,transparent_44%),linear-gradient(180deg,#1A1A1A,#2a1020)]',
  hard: 'bg-[radial-gradient(circle_at_top,#8B5CF666,transparent_46%),linear-gradient(180deg,#f6f2ff,#ddd0ff)] dark:bg-[radial-gradient(circle_at_top,#8B5CF655,transparent_44%),linear-gradient(180deg,#12081c,#1A1A1A)]',
  extreme: 'bg-[radial-gradient(circle_at_top,#11111133,transparent_46%),linear-gradient(180deg,#f4f4f5,#d4d4d8)] dark:bg-[radial-gradient(circle_at_top,#00000066,transparent_44%),linear-gradient(180deg,#0a0a0a,#1A1A1A)]',
  spice: 'bg-[radial-gradient(circle_at_top,#BE123C66,transparent_46%),linear-gradient(180deg,#fff1f2,#fecdd3)] dark:bg-[radial-gradient(circle_at_top,#9f123966,transparent_44%),linear-gradient(180deg,#1c050a,#1A1A1A)]',
  custom: 'bg-[radial-gradient(circle_at_top,#FFFFFF55,transparent_46%),linear-gradient(180deg,#fff7fb,#ffe4f0)] dark:bg-[radial-gradient(circle_at_top,#FFFFFF22,transparent_44%),linear-gradient(180deg,#1A1A1A,#2D2D2D)]',
}

export default function App() {
  const screen = useAppStore((state) => state.screen)
  const theme = useThemeStore((state) => state.theme)
  const level = useTodStore((state) => state.level)
  const [splash, setSplash] = useState(true)
  const endSplash = useCallback(() => setSplash(false), [])
  const shell = screen === 'tod' ? (shells[level] ?? shells.home) : shells.home

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    const color = theme === 'dark' ? '#1A1A1A' : '#FFF7FB'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [theme])

  return (
    <div className={`min-h-dvh text-ink transition-colors duration-500 dark:text-white ${shell}`}>
      <AnimatePresence mode="wait">
        {splash ? <SplashScreen key="splash" onDone={endSplash} /> : null}
      </AnimatePresence>
      {splash ? null : (
        <AnimatePresence mode="wait">
          {screen === 'home' ? <HomeScreen key="home" /> : null}
          {screen === 'impostor' ? <ImpostorScreen key="impostor" /> : null}
          {screen === 'mimes' ? <MimesScreen key="mimes" /> : null}
          {screen === 'tod' ? <TodScreen key="tod" /> : null}
        </AnimatePresence>
      )}
    </div>
  )
}
