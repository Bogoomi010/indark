// Item definitions (server-authoritative)

export const items = {
  food_bread: {
    itemId: 'food_bread',
    name: '빵',
    kind: 'consumable',
    stackable: true,
    useEffect: { type: 'healHp', amount: 20 },
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
