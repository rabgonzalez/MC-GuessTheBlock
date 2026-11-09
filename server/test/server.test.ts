import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { WebSocket } from "ws";
import { createApp } from "../src/app.ts";
import { BlockPool } from "../src/blocks.ts";
import { config } from "../src/config.ts";
import type {
  ChallengeView,
  DuelServerMessage,
  DuelView,
} from "../../guessTheBlock/src/modules/interfaces/compete.interface.ts";
import type { Block } from "../../guessTheBlock/src/modules/interfaces/block.interface.ts";

const block = (name: string, extra: Partial<Block> = {}): Block => ({
  name,
  displayName: name,
  color: "gray",
  stackSize: 64,
  solid: true,
  emitLight: false,
  category: "natural",
  dimensions: ["overworld"],
  tool: "wooden_pickaxe",
  craftable: false,
  ...extra,
});

/** Tiny pool: whatever the server picks, we can find it by trying all three. */
const pool = new BlockPool({
  version: "test",
  tools: {},
  blocks: [
    block("stone"),
    block("dirt", { tool: "wooden_shovel", color: "brown" }),
    block("torch", { solid: false, emitLight: true, tool: "none" }),
  ],
});

const app = createApp(
  { ...config, databasePath: ":memory:", countdownMs: 50 },
  pool
);
let base = "";

before(async () => {
  await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  base = `127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
after(() => app.close());

const ALICE = "alice-0000000000000001";
const BOB = "bob-00000000000000000002";

async function api(path: string, player?: string, body?: object) {
  const res = await fetch(`http://${base}/api${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(player ? { "X-Player-Id": player } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: (await res.json()) as any };
}

describe("link challenges", () => {
  it("ranks players and only reveals the block to those who finished", async () => {
    const created = await api("/challenges", ALICE, { nickname: "Alice" });
    assert.equal(created.status, 201);
    const code = (created.body as ChallengeView).code;
    assert.equal(created.body.me.answer, null);

    // Alice tries every block until she finds it.
    let view: ChallengeView = created.body;
    for (const b of pool.blocks) {
      view = (await api(`/challenges/${code}/guess`, ALICE, { block: b.name })).body;
      if (view.me?.result) break;
    }
    assert.equal(view.me?.result, "won");
    assert.ok(view.me?.answer);
    const answer = view.me!.answer!;

    // Bob opens the link: sees the leaderboard but not the answer.
    const anonymous = (await api(`/challenges/${code}`)).body as ChallengeView;
    assert.equal(anonymous.me, null);
    assert.equal(anonymous.leaderboard.length, 1);
    assert.equal(anonymous.leaderboard[0].nickname, "Alice");
    assert.equal(anonymous.leaderboard[0].me, false);
    assert.ok(!JSON.stringify(anonymous).includes(`"${answer}"`));

    // He can't guess before joining.
    const early = await api(`/challenges/${code}/guess`, BOB, { block: answer });
    assert.equal(early.status, 409);

    await api(`/challenges/${code}/join`, BOB, { nickname: "  Bob  " });
    const won = (await api(`/challenges/${code}/guess`, BOB, { block: answer }))
      .body as ChallengeView;
    assert.equal(won.me?.result, "won");
    assert.equal(won.me?.guesses.length, 1);
    assert.equal(won.me?.guesses[0].feedback.name, true);
    assert.equal(won.leaderboard.length, 2);
    const bob = won.leaderboard.find((e) => e.me);
    assert.equal(bob?.nickname, "Bob");
    // One guess beats Alice's, unless she also got it first try.
    if (view.me!.guesses.length > 1) assert.equal(bob?.rank, 1);

    // Finished: no more guesses.
    const again = await api(`/challenges/${code}/guess`, BOB, { block: "stone" });
    assert.equal(again.status, 409);

    const lookup = await api(`/lookup/${code.toLowerCase()}`);
    assert.deepEqual(lookup.body, { kind: "challenge" });
  });

  it("puts players who gave up at the bottom without a rank", async () => {
    const { body } = await api("/challenges", ALICE, { nickname: "Alice" });
    const gaveUp = (await api(`/challenges/${body.code}/give-up`, ALICE, {}))
      .body as ChallengeView;
    assert.equal(gaveUp.me?.result, "gave-up");
    assert.equal(gaveUp.leaderboard[0].rank, null);
  });

  it("rejects bad input", async () => {
    assert.equal((await api("/challenges", "short", { nickname: "A" })).status, 401);
    assert.equal((await api("/challenges", ALICE, { nickname: "   " })).status, 400);
    assert.equal((await api("/challenges/ZZZZZZ")).status, 404);
    const { body } = await api("/challenges", ALICE, { nickname: "A" });
    const bad = await api(`/challenges/${body.code}/guess`, ALICE, { block: "nope" });
    assert.equal(bad.status, 400);
  });
});

/** A WebSocket client that keeps the latest room state. */
async function duelist(hello: object) {
  const ws = new WebSocket(`ws://${base}/ws`);
  const states: DuelView[] = [];
  const errors: string[] = [];
  const waiters: (() => void)[] = [];
  ws.on("message", (raw) => {
    const message = JSON.parse(String(raw)) as DuelServerMessage;
    if (message.type === "state") states.push(message.room);
    else errors.push(message.code);
    waiters.splice(0).forEach((w) => w());
  });
  await new Promise((resolve) => ws.once("open", resolve));
  ws.send(JSON.stringify({ type: "hello", ...hello }));
  const client = {
    ws,
    errors,
    get state() {
      return states[states.length - 1];
    },
    send: (message: object) => ws.send(JSON.stringify(message)),
    /** Wait until the latest state matches. */
    async until(check: (s: DuelView) => boolean) {
      while (!client.state || !check(client.state)) {
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
      return client.state;
    },
  };
  return client;
}

describe("duels", () => {
  it("race: same block, first to find it scores, rivals only see colours", async () => {
    const a = await duelist({ player: ALICE, nickname: "Alice", create: "race" });
    const { code } = await a.until((s) => s.phase === "waiting");
    const b = await duelist({ player: BOB, nickname: "Bob", join: code });
    await a.until((s) => s.phase === "playing");
    await b.until((s) => s.phase === "playing");
    assert.ok(b.state.hint);

    // Bob guesses a wrong block first, if there is one to spare.
    b.send({ type: "guess", block: "stone" });
    const seen = await a.until((s) => s.players[1].attempts === 1);
    assert.match(seen.players[1].patterns[0], /^[gor]{9}$/);
    assert.equal(seen.guesses.length, 0); // Bob's blocks never reach Alice

    await b.until((s) => s.guesses.length === 1);
    if (b.state.phase !== "finished") {
      for (const name of ["dirt", "torch"]) {
        b.send({ type: "guess", block: name });
        const s = await b.until((v) => v.guesses.some((g) => g.name === name));
        if (s.phase === "finished") break;
      }
    }
    const end = await a.until((s) => s.phase === "finished");
    assert.equal(end.winner, 1);
    assert.equal(end.players[1].score, 1);
    assert.equal(end.answers?.[0], end.answers?.[1]);
    assert.equal(end.history.length, 1);

    // Rematch needs both.
    a.send({ type: "rematch" });
    await b.until((s) => s.players[0].rematch);
    b.send({ type: "rematch" });
    await a.until((s) => s.round === 2 && s.phase !== "finished");

    // Rejoin with the same player id keeps the seat and the score.
    b.ws.close();
    await a.until((s) => !s.players[1].connected);
    const b2 = await duelist({ player: BOB, nickname: "Bob", join: code });
    const back = await b2.until((s) => s.round === 2);
    assert.equal(back.you, 1);
    assert.equal(back.players[1].score, 1);

    // A third player can't get in.
    const c = await duelist({
      player: "carol-000000000000003",
      nickname: "Carol",
      join: code,
    });
    await new Promise((r) => setTimeout(r, 50));
    assert.deepEqual(c.errors, ["room-full"]);
    [a, b2, c].forEach((x) => x.ws.close());
  });

  it("pick: each player hunts the block the rival chose; giving up hands the round over", async () => {
    const a = await duelist({ player: ALICE, nickname: "Alice", create: "pick" });
    const { code } = await a.until((s) => s.phase === "waiting");
    const b = await duelist({ player: BOB, nickname: "Bob", join: code });
    await a.until((s) => s.phase === "picking");

    a.send({ type: "guess", block: "stone" });
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(a.errors, ["not-playing"]);

    a.send({ type: "pick", block: "torch" }); // Bob must find the torch
    const waiting = await b.until((s) => s.players[0].picked);
    assert.equal(waiting.myPick, null);
    assert.ok(!JSON.stringify(waiting).includes("torch"));
    b.send({ type: "pick", block: "dirt" }); // Alice must find dirt

    await a.until((s) => s.phase === "playing");
    b.send({ type: "guess", block: "torch" });
    const won = await a.until((s) => s.phase === "finished");
    assert.equal(won.winner, 1);
    assert.deepEqual(won.answers, ["dirt", "torch"]);

    a.send({ type: "rematch" });
    b.send({ type: "rematch" });
    await a.until((s) => s.round === 2 && s.phase === "picking");
    a.send({ type: "pick", block: "stone" });
    b.send({ type: "pick", block: "stone" });
    await a.until((s) => s.phase === "playing");
    a.send({ type: "giveUp" });
    const lost = await b.until((s) => s.phase === "finished");
    assert.equal(lost.winner, 1);
    assert.equal(lost.players[1].score, 2);
    assert.equal(lost.history[0].timeMs, null);

    const lookup = await api(`/lookup/${code}`);
    assert.deepEqual(lookup.body, { kind: "duel", mode: "pick" });
    [a, b].forEach((x) => x.ws.close());
  });

  it("answers unknown rooms with an error", async () => {
    const x = await duelist({ player: ALICE, nickname: "A", join: "ZZZZZZ" });
    await new Promise((r) => setTimeout(r, 50));
    assert.deepEqual(x.errors, ["not-found"]);
    x.ws.close();
  });
});
