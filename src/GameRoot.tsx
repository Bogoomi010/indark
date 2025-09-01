import { useEffect } from 'react'
import { useGameStore } from './game/state'
import HudMini from './components/HudMini'

export default function GameRoot({ userId = 'mock-user' }: { userId?: string }) {
  useEffect(() => {
    // init 함수 참조를 구독하지 않고, 스토어에서 직접 가져와 1회성 호출
    useGameStore.getState().init(userId)
  }, [userId])

  return (
    <div className="space-y-3">
      <HudMini />
    </div>
  )
}


