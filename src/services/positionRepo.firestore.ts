import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import type { CurrentDoc } from '../game/types'
import type { PositionRepo } from './positionRepo'

function currentRef(uid: string) {
  const db = getFirestore()
  return doc(db, 'users', uid, 'game', 'current')
}

export class FirestorePositionRepo implements PositionRepo {
  async loadCurrent(userId: string): Promise<CurrentDoc | null> {
    const snap = await getDoc(currentRef(userId))
    if (!snap.exists()) return null
    return snap.data() as CurrentDoc
  }

  async saveCurrent(userId: string, docData: CurrentDoc): Promise<void> {
    await setDoc(currentRef(userId), docData, { merge: true })
  }
}


