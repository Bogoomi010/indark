export type ItemKind = 'consumable' | 'weapon' | 'armor' | 'misc'

export type ItemDef = {
  itemId: string
  name: string
  kind: ItemKind
  stackable: boolean
  equippable?: boolean
}

export const itemDefs: Record<string, ItemDef> = {
  food_bread: { itemId: 'food_bread', name: '빵', kind: 'consumable', stackable: true },
  food_apple: { itemId: 'food_apple', name: '사과', kind: 'consumable', stackable: true },
  food_meat: { itemId: 'food_meat', name: '말린 고기', kind: 'consumable', stackable: true },
  weapon_rusty_sword: { itemId: 'weapon_rusty_sword', name: '녹슨 검', kind: 'weapon', stackable: false, equippable: true },
  armor_leather_vest: { itemId: 'armor_leather_vest', name: '가죽 조끼', kind: 'armor', stackable: false, equippable: true },
}

export function getItemDef(itemId: string) {
  return itemDefs[itemId] ?? { itemId, name: itemId, kind: 'misc', stackable: false }
}
