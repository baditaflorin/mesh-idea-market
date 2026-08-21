import { useState } from "react";
import {
  MeshNameInput,
  useNamedPeer,
  usePerPeerValue,
  useRoster,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

const BUDGET = 10;
type Idea = { id: string; title: string; authorId: string; createdAt: number };
type Allocation = Record<string, number>;
type Props = { room: YRoom | null; config: MeshConfig };

export function sanitizeIdea(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 100);
}
export function spent(allocation: Allocation): number {
  return Object.values(allocation).reduce(
    (sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0),
    0,
  );
}
export function scoreIdea(id: string, allocations: Array<[string, Allocation]>): number {
  return allocations.reduce((sum, [, allocation]) => sum + (allocation[id] ?? 0), 0);
}
function validIdea(value: Idea): boolean {
  return (
    !!value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.authorId === "string" &&
    Number.isFinite(value.createdAt) &&
    value.title.length > 0 &&
    value.title.length <= 100
  );
}
function person(peerId: string, nameOf: (id: string) => string): string {
  return nameOf(peerId) || `Guest ${peerId.slice(0, 5)}`;
}

export function Feature({ room, config }: Props) {
  const namedPeer = useNamedPeer(config, room);
  const roster = useRoster(room);
  const ideas = useSharedCollection<Idea>(room, "mesh-idea-market:ideas", { validate: validIdea });
  const budgets = usePerPeerValue<Allocation>(room, "mesh-idea-market:budgets", {});
  const [draft, setDraft] = useState("");
  const mine = budgets.my;
  const remaining = Math.max(0, BUDGET - spent(mine));
  const nameOf = (id: string) => namedPeer.nameOf(id) ?? "";
  const ranked = ideas.items
    .filter(validIdea)
    .map((idea) => ({ idea, score: scoreIdea(idea.id, budgets.entries) }))
    .sort((a, b) => b.score - a.score || a.idea.createdAt - b.idea.createdAt);

  const addIdea = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = sanitizeIdea(draft);
    if (!room || !title) return;
    if (
      ideas.add({
        id: `${room.peerId}:${crypto.randomUUID?.() ?? Date.now()}`,
        title,
        authorId: room.peerId,
        createdAt: Date.now(),
      })
    )
      setDraft("");
  };
  const adjust = (id: string, delta: number) => {
    const current = mine[id] ?? 0;
    if (delta > 0 && remaining < delta) return;
    const next = Math.max(0, current + delta);
    const copy = { ...mine };
    if (next) copy[id] = next;
    else delete copy[id];
    budgets.setMy(copy);
  };

  return (
    <main className="market-page">
      <section className="market-hero" aria-labelledby="market-title">
        <div>
          <p className="eyebrow">Mesh Idea Market</p>
          <h1 id="market-title">Fund the ideas that should exist.</h1>
          <p>
            Submit a proposal, then invest your ten credits. Every vote and every score stays
            directly between this room’s browsers.
          </p>
        </div>
        <div className="budget-badge">
          <span>Your budget</span>
          <strong>{remaining}</strong>
          <small>of {BUDGET} credits left</small>
        </div>
      </section>
      <section className="market-grid" aria-label="Idea market">
        <section className="market-card submit-card">
          <p className="eyebrow">Make an offer</p>
          <h2>Put an idea on the floor</h2>
          <MeshNameInput
            label="Your name"
            value={namedPeer.name}
            onChange={namedPeer.setName}
            placeholder="Name on your ideas"
            maxLength={32}
          />
          <form onSubmit={addIdea}>
            <label htmlFor="idea">The idea</label>
            <div className="entry">
              <input
                id="idea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What should this group build, try, or decide?"
                maxLength={100}
              />
              <button className="primary" disabled={!room || !sanitizeIdea(draft)}>
                List it
              </button>
            </div>
          </form>
        </section>
        <section className="market-card leaderboard" aria-labelledby="board-title">
          <div className="board-head">
            <div>
              <p className="eyebrow">Live leaderboard</p>
              <h2 id="board-title">
                {ranked.length ? `${ranked.length} ideas trading` : "Open the market"}
              </h2>
            </div>
            <span>{roster.present.length || (room ? 1 : 0)} people</span>
          </div>
          {ranked.length ? (
            <ol>
              {ranked.map(({ idea, score }, index) => (
                <li key={idea.id}>
                  <span className="rank">{index + 1}</span>
                  <div className="idea-copy">
                    <strong>{idea.title}</strong>
                    <small>from {person(idea.authorId, nameOf)}</small>
                  </div>
                  <div className="score">
                    <b>{score}</b>
                    <small>credits</small>
                  </div>
                  <div className="trade">
                    <button
                      aria-label={`Remove credit from ${idea.title}`}
                      onClick={() => adjust(idea.id, -1)}
                      disabled={!mine[idea.id]}
                    >
                      −
                    </button>
                    <span>{mine[idea.id] ?? 0}</span>
                    <button
                      aria-label={`Add credit to ${idea.title}`}
                      onClick={() => adjust(idea.id, 1)}
                      disabled={!remaining}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">A good market starts with one specific, useful idea.</p>
          )}
        </section>
      </section>
    </main>
  );
}
