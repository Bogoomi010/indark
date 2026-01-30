// Item definitions (server-authoritative)

export const items = {
  food_bread: {
    itemId: 'food_bread',
    name: '빵',
    kind: 'consumable',
    stackable: true,
    useEffect: { type: 'healHp', amount: 20 },
  },
  food_apple: {
    itemId: 'food_apple',
    name: '사과',
    kind: 'consumable',
    stackable: true,
    useEffect: { type: 'healHp', amount: 10 },
  },
  food_meat: {
    itemId: 'food_meat',
    name: '말린 고기',
    kind: 'consumable',
    stackable: true,
    useEffect: { type: 'healHp', amount: 30 },
  },
  weapon_rusty_sword: {
    itemId: 'weapon_rusty_sword',
    name: '녹슨 검',
    kind: 'weapon',
    stackable: false,
  },
  armor_leather_vest: {
    itemId: 'armor_leather_vest',
    name: '가죽 조끼',
    kind: 'armor',
    stackable: false,
  },
};

export function getItem(itemId) {
  return items[itemId] ?? null;
}
