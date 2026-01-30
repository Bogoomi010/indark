import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
import { DEFAULT_CONFIG } from "./defaultConfig";
import { chance, hashToSeed, pickOne, pickUnique, randomSeedString, rngFromSeed } from "./rng";

setGlobalOptions({ region: "asia-northeast3" }); // Seoul

admin.initializeApp();
const db = admin.firestore();

type AuthedRequest = {
  uid: string;
};

async function requireAuth(req: any): Promise<AuthedRequest> {
  const header = req.headers.authorization || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) throw Object.assign(new Error("Missing Authorization: Bearer <token>"), { status: 401 });
  const token = m[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return { uid: decoded.uid };
}

function json(res: any, status: number, body: any) {
  res.status(status).set("content-type", "application/json").send(JSON.stringify(body));
}

function badRequest(msg: string) {
  return Object.assign(new Error(msg), { status: 400 });
}

async function ensureConfigExists(): Promise<void> {
  const ref = db.collection("configs").doc("current");
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({ ...DEFAULT_CONFIG, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: false });
}

async function getConfig() {
  await ensureConfigExists();
  const snap = await db.collection("configs").doc("current").get();
  const data = snap.data();
  if (!data) throw new Error("config missing");
  return data as any;
}

function scaleStats(base: any, stageIndex: number, scaling: any) {
  const s = Math.max(1, stageIndex);
  const hpMul = 1 + scaling.hpMulPerStage * (s - 1);
  const atkMul = 1 + scaling.atkMulPerStage * (s - 1);
  const defMul = 1 + scaling.defMulPerStage * (s - 1);
  return {
    hp: Math.round(base.hp * hpMul),
    atk: Math.round(base.atk * atkMul),
    def: Math.round(base.def * defMul),
    spd: base.spd
  };
}

function isShopStage(stageIndex: number, shopRule: any): boolean {
  if (shopRule?.spawnRule?.type !== "EVERY_N_STAGES") return false;
  const n = Number(shopRule.spawnRule.n ?? 0);
  if (n <= 0) return false;
  return stageIndex % n === 0;
}

async function getRun(runId: string) {
  const ref = db.collection("runs").doc(runId);
  const snap = await ref.get();
  if (!snap.exists) throw badRequest("run not found");
  return { ref, data: snap.data() as any };
}

function assertOwnRun(uid: string, run: any) {
  if (!run?.playerUid || run.playerUid !== uid) throw Object.assign(new Error("forbidden"), { status: 403 });
}

export const api = onRequest(async (req, res) => {
  try {
    await ensureConfigExists();

    const path = (req.path || "/").replace(/\/+$/, "");
    const method = req.method.toUpperCase();

    // Public config endpoint
    if (method === "GET" && (path === "" || path === "/" || path === "/config")) {
      const config = await getConfig();
      return json(res, 200, config);
    }

    // Everything else requires auth
    const { uid } = await requireAuth(req);

    if (method === "POST" && path === "/runs/start") {
      const config = await getConfig();
      const runId = db.collection("runs").doc().id;
      const seed = randomSeedString();
      await db
        .collection("runs")
        .doc(runId)
        .set({
          playerUid: uid,
          configVersion: config.configVersion,
          seed,
          stageIndex: 1,
          gold: 0,
          inventory: { consumables: [], equipment: [] },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      return json(res, 200, { runId, configVersion: config.configVersion });
    }

    if (method === "POST" && path === "/stages/generate") {
      const { runId, stageIndex } = req.body || {};
      if (!runId || !stageIndex) throw badRequest("runId, stageIndex required");

      const config = await getConfig();
      const { ref: runRef, data: run } = await getRun(String(runId));
      assertOwnRun(uid, run);

      const sIdx = Number(stageIndex);
      const stageRef = runRef.collection("stages").doc(String(sIdx));
      const existing = await stageRef.get();
      if (existing.exists) return json(res, 200, existing.data());

      // Encounter generation
      const seed = hashToSeed(`${run.seed}:stage:${sIdx}`);
      const rng = rngFromSeed(seed);

      // 1~3 enemies; add difficulty by stage
      const enemyCount = sIdx <= 2 ? 1 : sIdx <= 6 ? 2 : 3;

      // Pool by stage
      const monsters = config.monsters as any[];
      const t1 = monsters.filter((m) => m.tier === 1 && m.role !== "BOSS");
      const t2 = monsters.filter((m) => m.tier === 2 && m.role !== "BOSS");
      const boss = monsters.find((m) => m.role === "BOSS");

      const isBossStage = sIdx % 5 === 0;
      const pool = isBossStage && boss ? [boss] : sIdx <= 3 ? t1 : sIdx <= 6 ? [...t1, ...t2] : [...t2];
      if (pool.length === 0) throw new Error("monster pool empty");

      const picked = isBossStage ? [pickOne(rng, pool)] : pickUnique(rng, pool, enemyCount);

      const encounterId = `ENC_${runId}_${sIdx}`;
      const enemies = picked.map((m: any, i: number) => ({
        entityId: `E${i + 1}`,
        monsterId: m.monsterId,
        stats: scaleStats(m.baseStats, sIdx, config.stageScaling)
      }));

      const stagePayload = {
        stageIndex: sIdx,
        encounterId,
        enemies,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await stageRef.set(stagePayload);
      return json(res, 200, stagePayload);
    }

    if (method === "POST" && path === "/encounters/result") {
      const { runId, encounterId, result, turnCount, playerHpEnd } = req.body || {};
      if (!runId || !encounterId || !result) throw badRequest("runId, encounterId, result required");

      const config = await getConfig();
      const { ref: runRef, data: run } = await getRun(String(runId));
      assertOwnRun(uid, run);

      const rewardsRef = runRef.collection("rewards").doc(String(encounterId));
      const existing = await rewardsRef.get();
      if (existing.exists) return json(res, 200, existing.data());

      if (String(result) !== "WIN") {
        const payload = { encounterId, result, turnCount: turnCount ?? null, playerHpEnd: playerHpEnd ?? null, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        await rewardsRef.set(payload);
        return json(res, 200, payload);
      }

      // Determine drop table by stage's primary enemy
      const stageIndex = Number(String(encounterId).split("_").pop());
      const stageSnap = await runRef.collection("stages").doc(String(stageIndex)).get();
      const stage = stageSnap.data() as any;
      if (!stage) throw badRequest("stage not generated");
      const firstEnemyId = stage.enemies?.[0]?.monsterId;

      const monster = (config.monsters as any[]).find((m) => m.monsterId === firstEnemyId);
      const dropTableId = monster?.rewards?.dropTableId || "DT_NORMAL_T1";
      const dropTable = (config.dropTables as any[]).find((d) => d.dropTableId === dropTableId);
      if (!dropTable) throw new Error(`dropTable not found: ${dropTableId}`);

      const seed = hashToSeed(`${run.seed}:reward:${encounterId}`);
      const rng = rngFromSeed(seed);

      const commonPool: string[] = dropTable.pools.common;
      const rarePool: string[] = dropTable.pools.rare;

      const choices: { choiceId: string; itemId: string }[] = [];
      // 2 commons
      const commonPicked = pickUnique(rng, commonPool, 2);
      commonPicked.forEach((itemId, idx) => choices.push({ choiceId: `C${idx + 1}`, itemId }));

      // 1 rare slot
      const isRare = chance(rng, Number(dropTable.rareSlotChance ?? 0));
      const rareItemId = isRare ? pickOne(rng, rarePool) : pickOne(rng, commonPool);
      choices.push({ choiceId: "C3", itemId: rareItemId });

      const goldReward = Number(monster?.rewards?.gold ?? 20);

      const payload = {
        encounterId,
        result: "WIN",
        goldReward,
        treasureChoices: choices,
        hasShop: isShopStage(stageIndex, config.shop),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.runTransaction(async (tx) => {
        tx.set(rewardsRef, payload);
        tx.update(runRef, { gold: admin.firestore.FieldValue.increment(goldReward) });
      });

      return json(res, 200, payload);
    }

    if (method === "POST" && path === "/treasure/pick") {
      const { runId, encounterId, choiceId } = req.body || {};
      if (!runId || !encounterId || !choiceId) throw badRequest("runId, encounterId, choiceId required");

      const { ref: runRef, data: run } = await getRun(String(runId));
      assertOwnRun(uid, run);

      const rewardsRef = runRef.collection("rewards").doc(String(encounterId));

      let grantedItemId = "";
      await db.runTransaction(async (tx) => {
        const rewardsSnap = await tx.get(rewardsRef);
        const rewards = rewardsSnap.data() as any;
        if (!rewards || rewards.result !== "WIN") throw badRequest("no WIN rewards");
        if (rewards.pickedChoiceId) {
          grantedItemId = rewards.grantedItemId;
          return;
        }
        const picked = (rewards.treasureChoices || []).find((c: any) => c.choiceId === choiceId);
        if (!picked) throw badRequest("invalid choiceId");
        grantedItemId = picked.itemId;

        // Put everything into inventory; client decides whether to equip.
        tx.update(runRef, {
          "inventory.consumables": admin.firestore.FieldValue.arrayUnion(grantedItemId)
        });
        tx.update(rewardsRef, { pickedChoiceId: choiceId, grantedItemId });
      });

      return json(res, 200, { grantedItemId });
    }

    if (method === "GET" && path === "/shop/current") {
      const runId = String(req.query.runId || "");
      const stageIndex = Number(req.query.stageIndex || "0");
      if (!runId || !stageIndex) throw badRequest("runId, stageIndex required");

      const config = await getConfig();
      const { ref: runRef, data: run } = await getRun(runId);
      assertOwnRun(uid, run);

      const shopId = `SHOP_${stageIndex}`;
      const shopRef = runRef.collection("shops").doc(shopId);
      const existing = await shopRef.get();
      if (existing.exists) return json(res, 200, { shopId, ...(existing.data() as any) });

      const seed = hashToSeed(`${run.seed}:shop:${stageIndex}:reroll:0`);
      const rng = rngFromSeed(seed);

      const slotsDef = config.shop.slots as any[];
      const prices = config.shop.pricesGold as Record<string, number>;

      function rollSlot(slot: any) {
        const isRare = chance(rng, Number(slot.rarityRule?.rareChance ?? 0));
        if (slot.category === "CONSUMABLE_RANDOM") {
          const pool = isRare ? config.shop.pools.consumableRare : config.shop.pools.consumableCommon;
          const itemId = String(pickOne(rng, pool));
          return { slotId: slot.slotId, itemId, priceGold: prices[itemId] };
        }
        if (slot.category === "EQUIPMENT_RANDOM") {
          const pool = isRare ? config.shop.pools.equipmentRare : config.shop.pools.equipmentCommon;
          const itemId = String(pickOne(rng, pool));
          return { slotId: slot.slotId, itemId, priceGold: prices[itemId] };
        }
        throw new Error(`unknown slot category: ${slot.category}`);
      }

      const slots = slotsDef.map(rollSlot);
      const payload = {
        stageIndex,
        rerollCount: 0,
        rerollCost: config.shop.reroll.baseCost,
        slots,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await shopRef.set(payload);
      return json(res, 200, { shopId, ...payload });
    }

    if (method === "POST" && path === "/shop/buy") {
      const { runId, shopId, slotId } = req.body || {};
      if (!runId || !shopId || !slotId) throw badRequest("runId, shopId, slotId required");

      const { ref: runRef, data: run } = await getRun(String(runId));
      assertOwnRun(uid, run);

      const shopRef = runRef.collection("shops").doc(String(shopId));

      let grantedItemId = "";
      let goldAfter = 0;

      await db.runTransaction(async (tx) => {
        const runSnap = await tx.get(runRef);
        const runData = runSnap.data() as any;
        const shopSnap = await tx.get(shopRef);
        const shop = shopSnap.data() as any;
        if (!shop) throw badRequest("shop not found");

        const slot = (shop.slots || []).find((s: any) => s.slotId === slotId);
        if (!slot || !slot.itemId) throw badRequest("invalid slot");

        const price = Number(slot.priceGold ?? 0);
        const gold = Number(runData.gold ?? 0);
        if (gold < price) throw badRequest("not enough gold");

        grantedItemId = slot.itemId;
        goldAfter = gold - price;

        // Remove from slots
        const newSlots = (shop.slots || []).map((s: any) => (s.slotId === slotId ? { ...s, itemId: null } : s));

        tx.update(runRef, {
          gold: goldAfter,
          "inventory.consumables": admin.firestore.FieldValue.arrayUnion(grantedItemId)
        });
        tx.update(shopRef, { slots: newSlots });
      });

      return json(res, 200, { ok: true, goldAfter, grantedItemId });
    }

    if (method === "POST" && path === "/shop/reroll") {
      const { runId, shopId } = req.body || {};
      if (!runId || !shopId) throw badRequest("runId, shopId required");

      const config = await getConfig();
      const { ref: runRef, data: run } = await getRun(String(runId));
      assertOwnRun(uid, run);

      const shopRef = runRef.collection("shops").doc(String(shopId));

      let slotsOut: any[] = [];
      let rerollCostOut = 0;

      await db.runTransaction(async (tx) => {
        const runSnap = await tx.get(runRef);
        const runData = runSnap.data() as any;
        const shopSnap = await tx.get(shopRef);
        const shop = shopSnap.data() as any;
        if (!shop) throw badRequest("shop not found");

        const rerollCount = Number(shop.rerollCount ?? 0);
        const rerollCost = Number(shop.rerollCost ?? config.shop.reroll.baseCost);
        const gold = Number(runData.gold ?? 0);
        if (gold < rerollCost) throw badRequest("not enough gold");

        const nextRerollCount = rerollCount + 1;
        const nextRerollCost = config.shop.reroll.baseCost + config.shop.reroll.costIncreasePerUse * nextRerollCount;

        const stageIndex = Number(shop.stageIndex);
        const seed = hashToSeed(`${runData.seed}:shop:${stageIndex}:reroll:${nextRerollCount}`);
        const rng = rngFromSeed(seed);

        const slotsDef = config.shop.slots as any[];
        const prices = config.shop.pricesGold as Record<string, number>;

        function rollSlot(slot: any) {
          const isRare = chance(rng, Number(slot.rarityRule?.rareChance ?? 0));
          if (slot.category === "CONSUMABLE_RANDOM") {
            const pool = isRare ? config.shop.pools.consumableRare : config.shop.pools.consumableCommon;
            const itemId = String(pickOne(rng, pool));
            return { slotId: slot.slotId, itemId, priceGold: prices[itemId] };
          }
          if (slot.category === "EQUIPMENT_RANDOM") {
            const pool = isRare ? config.shop.pools.equipmentRare : config.shop.pools.equipmentCommon;
            const itemId = String(pickOne(rng, pool));
            return { slotId: slot.slotId, itemId, priceGold: prices[itemId] };
          }
          throw new Error(`unknown slot category: ${slot.category}`);
        }

        const newSlots = slotsDef.map(rollSlot);
        slotsOut = newSlots;
        rerollCostOut = nextRerollCost;

        tx.update(runRef, { gold: gold - rerollCost });
        tx.update(shopRef, { slots: newSlots, rerollCount: nextRerollCount, rerollCost: nextRerollCost });
      });

      return json(res, 200, { slots: slotsOut, rerollCost: rerollCostOut });
    }

    return json(res, 404, { error: "not_found", path, method });
  } catch (e: any) {
    const status = e?.status || 500;
    return json(res, status, { error: e?.message || String(e) });
  }
});
