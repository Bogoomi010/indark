import { useLocalGame } from '../game/localGame'

export default function HudMini() {
  const { pos, torch, sta, worldSeed } = useLocalGame()

  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2 rounded border border-zinc-700 bg-black/50">
      <div className="text-sm">
        <div>
          좌표: (<span className="font-mono">{pos.x}</span>, <span className="font-mono">{pos.y}</span>)
        </div>
        <div className="text-xs text-zinc-400">world: {worldSeed}</div>
      </div>
      <div className="text-sm flex gap-4">
        <div>횃불 {torch}</div>
        <div>기력 {sta}</div>
      </div>
      <div className="text-xs text-zinc-400">Explore</div>
    </div>
  )
}


