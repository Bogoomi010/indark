// DB 교체 지점: PositionRepo 인터페이스만 유지, 구현체 교체로 대응
import type { CurrentDoc } from '../game/types'

export interface PositionRepo {
  loadCurrent(userId: string): Promise<CurrentDoc | null>
  saveCurrent(userId: string, doc: CurrentDoc): Promise<void>
}

export class LocalStoragePositionRepo implements PositionRepo {
  private key(userId: string): string {
    return `in-dark/${userId}/current`
  }

  async loadCurrent(userId: string): Promise<CurrentDoc | null> {
    const raw = localStorage.getItem(this.key(userId))
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as CurrentDoc
      return parsed
    } catch {
      return null
    }
  }

  async saveCurrent(userId: string, doc: CurrentDoc): Promise<void> {
    const raw = JSON.stringify(doc)
    localStorage.setItem(this.key(userId), raw)
  }
}


