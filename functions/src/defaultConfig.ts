export const DEFAULT_CONFIG = {
  configVersion: "2026-01-30.1",
  stageScaling: {
    hpMulPerStage: 0.18,
    atkMulPerStage: 0.14,
    defMulPerStage: 0.1
  },
  monsters: [
    {
      monsterId: "MON_SLIME",
      name: "Slime",
      tier: 1,
      role: "DPS",
      baseStats: { hp: 30, atk: 8, def: 1, spd: 4 },
      skills: [
        {
          skillId: "SLIME_BOUNCE",
          name: "Bounce Strike",
          cooldownTurns: 2,
          effect: { type: "DAMAGE_SINGLE", atkMultiplier: 1.2 }
        }
      ],
      ai: {
        type: "COOLDOWN_PRIORITY",
        rules: [
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "SLIME_BOUNCE" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 18, dropTableId: "DT_NORMAL_T1" }
    },
    {
      monsterId: "MON_GOBLIN",
      name: "Goblin",
      tier: 1,
      role: "DPS",
      baseStats: { hp: 26, atk: 7, def: 1, spd: 6 },
      skills: [
        {
          skillId: "GOBLIN_CHEAP_SHOT",
          name: "Cheap Shot",
          cooldownTurns: 2,
          effect: {
            type: "DAMAGE_SINGLE",
            atkMultiplier: 1.0,
            conditionalBonus: {
              condition: { target: "PLAYER", hpPercentLte: 50 },
              damageMultiplier: 1.3
            }
          }
        }
      ],
      ai: {
        type: "CONDITIONAL_PRIORITY",
        rules: [
          {
            when: { target: "PLAYER", hpPercentLte: 50, skillOffCooldown: "GOBLIN_CHEAP_SHOT" },
            useSkillId: "GOBLIN_CHEAP_SHOT"
          },
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "GOBLIN_CHEAP_SHOT" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 20, dropTableId: "DT_NORMAL_T1" }
    },
    {
      monsterId: "MON_TURTLE",
      name: "Turtle",
      tier: 1,
      role: "TANK",
      baseStats: { hp: 40, atk: 5, def: 4, spd: 2 },
      skills: [
        {
          skillId: "TURTLE_SHELL_GUARD",
          name: "Shell Guard",
          cooldownTurns: 3,
          effect: { type: "SELF_BUFF", buff: { damageTakenMultiplier: 0.5, durationTurns: 1 } }
        }
      ],
      ai: {
        type: "CONDITIONAL_PRIORITY",
        rules: [
          { when: { selfHpPercentLte: 60, skillOffCooldown: "TURTLE_SHELL_GUARD" }, useSkillId: "TURTLE_SHELL_GUARD" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 18, dropTableId: "DT_NORMAL_T1" }
    },
    {
      monsterId: "MON_SKELETON",
      name: "Skeleton",
      tier: 2,
      role: "DPS_DEBUFFER",
      baseStats: { hp: 34, atk: 9, def: 2, spd: 4 },
      skills: [
        {
          skillId: "SKELETON_BLEEDING_SLASH",
          name: "Bleeding Slash",
          cooldownTurns: 3,
          effect: {
            type: "DAMAGE_SINGLE_PLUS_DOT",
            atkMultiplier: 1.0,
            dot: { dotId: "BLEED", damagePerTurn: 3, durationTurns: 2 }
          }
        }
      ],
      ai: {
        type: "COOLDOWN_PRIORITY",
        rules: [
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "SKELETON_BLEEDING_SLASH" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 24, dropTableId: "DT_NORMAL_T2" }
    },
    {
      monsterId: "MON_SHAMAN",
      name: "Shaman",
      tier: 2,
      role: "SUPPORT",
      baseStats: { hp: 32, atk: 6, def: 2, spd: 3 },
      skills: [
        {
          skillId: "SHAMAN_CURSE",
          name: "Curse",
          cooldownTurns: 3,
          effect: {
            type: "DEBUFF_PLAYER",
            debuff: { stat: "ATK", flatDelta: -2, durationTurns: 2 }
          }
        }
      ],
      ai: {
        type: "SCRIPTED_OPENING_THEN_COOLDOWN",
        rules: [
          { when: { turnEquals: 2, skillOffCooldown: "SHAMAN_CURSE" }, useSkillId: "SHAMAN_CURSE" },
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "SHAMAN_CURSE" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 26, dropTableId: "DT_NORMAL_T2" }
    },
    {
      monsterId: "MON_MIMIC",
      name: "Mimic",
      tier: 2,
      role: "TRICKSTER",
      baseStats: { hp: 36, atk: 8, def: 3, spd: 3 },
      skills: [
        {
          skillId: "MIMIC_BITE",
          name: "Bite",
          cooldownTurns: 3,
          effect: { type: "DAMAGE_SINGLE", atkMultiplier: 1.1 }
        }
      ],
      ai: {
        type: "COOLDOWN_PRIORITY",
        rules: [
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "MIMIC_BITE" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 30, dropTableId: "DT_MIMIC_SPECIAL" }
    },
    {
      monsterId: "BOSS_OGRE_CAPTAIN",
      name: "Ogre Captain",
      tier: 3,
      role: "BOSS",
      baseStats: { hp: 95, atk: 13, def: 4, spd: 3 },
      skills: [
        {
          skillId: "OGRE_CRUSHING_BLOW",
          name: "Crushing Blow",
          cooldownTurns: 2,
          effect: { type: "DAMAGE_SINGLE", atkMultiplier: 1.5 }
        },
        {
          skillId: "OGRE_WAR_CRY",
          name: "War Cry",
          cooldownTurns: 4,
          effect: { type: "SELF_BUFF", buff: { stat: "ATK", flatDelta: 4, durationTurns: 2 } }
        }
      ],
      ai: {
        type: "SCRIPTED_OPENING_THEN_COOLDOWN",
        rules: [
          { when: { turnEquals: 2, skillOffCooldown: "OGRE_WAR_CRY" }, useSkillId: "OGRE_WAR_CRY" },
          { when: "SKILL_OFF_COOLDOWN", useSkillId: "OGRE_CRUSHING_BLOW" },
          { when: "OTHERWISE", useSkillId: "BASIC_ATTACK" }
        ]
      },
      rewards: { gold: 55, dropTableId: "DT_BOSS" }
    }
  ],
  items: [
    { itemId: "EQ_RUSTY_SWORD", name: "Rusty Sword", type: "EQUIPMENT", rarity: "COMMON", effect: { type: "STAT_MOD", stat: "ATK", flatDelta: 2 } },
    { itemId: "EQ_LEATHER_ARMOR", name: "Leather Armor", type: "EQUIPMENT", rarity: "COMMON", effect: { type: "STAT_MOD", stat: "DEF", flatDelta: 2 } },
    { itemId: "EQ_SWIFT_BOOTS", name: "Swift Boots", type: "EQUIPMENT", rarity: "COMMON", effect: { type: "STAT_MOD", stat: "SPD", flatDelta: 1 } },
    { itemId: "EQ_IRON_RING", name: "Iron Ring", type: "EQUIPMENT", rarity: "COMMON", effect: { type: "STAT_MOD", stat: "HP", flatDelta: 10 } },

    { itemId: "EQ_VAMPIRIC_RING", name: "Vampiric Ring", type: "EQUIPMENT", rarity: "RARE", effect: { type: "ON_DEAL_DAMAGE_HEAL", healFlat: 1, perTurnLimit: 1 } },
    { itemId: "EQ_WARRIOR_SIGIL", name: "Warrior Sigil", type: "EQUIPMENT", rarity: "RARE", effect: { type: "BATTLE_START_BUFF", buff: { stat: "ATK", flatDelta: 2, durationTurns: 999 } } },

    { itemId: "CON_POTION", name: "Potion", type: "CONSUMABLE", rarity: "COMMON", useEffect: { type: "HEAL_PLAYER", healFlat: 20 } },
    { itemId: "CON_BOMB", name: "Bomb", type: "CONSUMABLE", rarity: "COMMON", useEffect: { type: "DAMAGE_ENEMY_SINGLE", damageFlat: 10 } },
    { itemId: "CON_SHIELD_SCROLL", name: "Shield Scroll", type: "CONSUMABLE", rarity: "COMMON", useEffect: { type: "BUFF_PLAYER", buff: { damageTakenMultiplier: 0.5, durationTurns: 1 } } },
    { itemId: "CON_BLESSING", name: "Blessing", type: "CONSUMABLE", rarity: "COMMON", useEffect: { type: "NEXT_BATTLE_BUFF", buff: { stat: "ATK", flatDelta: 2, durationTurns: 999 } } },

    { itemId: "CON_BIG_POTION", name: "Big Potion", type: "CONSUMABLE", rarity: "RARE", useEffect: { type: "HEAL_PLAYER", healFlat: 40 } },
    { itemId: "CON_BIG_BOMB", name: "Big Bomb", type: "CONSUMABLE", rarity: "RARE", useEffect: { type: "DAMAGE_ENEMY_SINGLE", damageFlat: 18 } }
  ],
  dropTables: [
    {
      dropTableId: "DT_NORMAL_T1",
      choiceCount: 3,
      rareSlotChance: 0.25,
      pools: {
        common: [
          "EQ_RUSTY_SWORD",
          "EQ_LEATHER_ARMOR",
          "EQ_SWIFT_BOOTS",
          "EQ_IRON_RING",
          "CON_POTION",
          "CON_BOMB",
          "CON_SHIELD_SCROLL",
          "CON_BLESSING"
        ],
        rare: ["EQ_VAMPIRIC_RING", "EQ_WARRIOR_SIGIL", "CON_BIG_POTION", "CON_BIG_BOMB"]
      }
    },
    {
      dropTableId: "DT_NORMAL_T2",
      choiceCount: 3,
      rareSlotChance: 0.35,
      pools: {
        common: [
          "EQ_RUSTY_SWORD",
          "EQ_LEATHER_ARMOR",
          "EQ_SWIFT_BOOTS",
          "EQ_IRON_RING",
          "CON_POTION",
          "CON_BOMB",
          "CON_SHIELD_SCROLL",
          "CON_BLESSING"
        ],
        rare: ["EQ_VAMPIRIC_RING", "EQ_WARRIOR_SIGIL", "CON_BIG_POTION", "CON_BIG_BOMB"]
      }
    },
    {
      dropTableId: "DT_MIMIC_SPECIAL",
      choiceCount: 3,
      rareSlotChance: 0.6,
      pools: {
        common: [
          "EQ_RUSTY_SWORD",
          "EQ_LEATHER_ARMOR",
          "EQ_SWIFT_BOOTS",
          "EQ_IRON_RING",
          "CON_POTION",
          "CON_BOMB",
          "CON_SHIELD_SCROLL",
          "CON_BLESSING"
        ],
        rare: ["EQ_VAMPIRIC_RING", "EQ_WARRIOR_SIGIL", "CON_BIG_POTION", "CON_BIG_BOMB"]
      }
    },
    {
      dropTableId: "DT_BOSS",
      choiceCount: 3,
      rareSlotChance: 1.0,
      pools: {
        common: [
          "EQ_RUSTY_SWORD",
          "EQ_LEATHER_ARMOR",
          "EQ_SWIFT_BOOTS",
          "EQ_IRON_RING",
          "CON_POTION",
          "CON_BOMB",
          "CON_SHIELD_SCROLL",
          "CON_BLESSING"
        ],
        rare: ["EQ_VAMPIRIC_RING", "EQ_WARRIOR_SIGIL", "CON_BIG_POTION", "CON_BIG_BOMB"]
      }
    }
  ],
  shop: {
    spawnRule: { type: "EVERY_N_STAGES", n: 3 },
    slots: [
      { slotId: "S1", category: "CONSUMABLE_RANDOM", rarityRule: { rareChance: 0.1 } },
      { slotId: "S2", category: "CONSUMABLE_RANDOM", rarityRule: { rareChance: 0.1 } },
      { slotId: "S3", category: "EQUIPMENT_RANDOM", rarityRule: { rareChance: 0.15 } },
      { slotId: "S4", category: "EQUIPMENT_RANDOM", rarityRule: { rareChance: 0.15 } }
    ],
    pools: {
      consumableCommon: ["CON_POTION", "CON_BOMB", "CON_SHIELD_SCROLL", "CON_BLESSING"],
      consumableRare: ["CON_BIG_POTION", "CON_BIG_BOMB"],
      equipmentCommon: ["EQ_RUSTY_SWORD", "EQ_LEATHER_ARMOR", "EQ_SWIFT_BOOTS", "EQ_IRON_RING"],
      equipmentRare: ["EQ_VAMPIRIC_RING", "EQ_WARRIOR_SIGIL"]
    },
    pricesGold: {
      CON_POTION: 20,
      CON_BOMB: 30,
      CON_SHIELD_SCROLL: 25,
      CON_BLESSING: 25,
      CON_BIG_POTION: 45,
      CON_BIG_BOMB: 55,

      EQ_RUSTY_SWORD: 60,
      EQ_LEATHER_ARMOR: 60,
      EQ_SWIFT_BOOTS: 60,
      EQ_IRON_RING: 60,

      EQ_VAMPIRIC_RING: 110,
      EQ_WARRIOR_SIGIL: 110
    },
    reroll: { baseCost: 10, costIncreasePerUse: 5, maxRerollsPerVisit: 5 }
  }
} as const;
