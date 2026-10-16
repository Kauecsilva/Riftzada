import { describe, expect, it } from "vitest";
import { demoHall, demoRanking } from "@/lib/demo/store";
import { computeRanking, pointsForPlacement } from "@/lib/domain/stats";

// Os mesmos números que tests/sql/assertions.sql confere nas views: TS e SQL têm que concordar.
describe("ranking", () => {
  const byUser = Object.fromEntries(demoRanking().map((r) => [r.username, r]));

  it("soma colocação + presença + ajuste manual", () => {
    expect(byUser.kaue.points).toBe(270);
    expect(byUser.joao.points).toBe(230);
    expect(byUser.rafael.points).toBe(200);
    expect(byUser.thiago.points).toBe(30);
    expect(byUser.thiago.manualPoints).toBe(20);
  });

  it("empate total divide a posição e a próxima pula", () => {
    expect(byUser.kaue.position).toBe(1);
    expect(byUser.bia.position).toBe(byUser.pedro.position);
    expect(byUser.marina.position).toBe(6);
  });

  it("colocação além da regra vale zero", () => {
    expect(pointsForPlacement({ pointsByPlacement: [100, 70], participationPoints: 10 }, 5)).toBe(0);
  });

  it("evento não finalizado não conta", () => {
    const rows = computeRanking(
      {
        players: [{ id: "a", username: "a", displayName: "A", avatarUrl: null }],
        events: [{ id: "e", name: "E", startsAt: "2026-01-01T00:00:00Z", status: "scheduled" }],
        participants: [{ eventId: "e", userId: "a", status: "played" }],
        results: [{ eventId: "e", userId: "a", placement: 1 }],
      },
      { pointsByPlacement: [100], participationPoints: 10 },
    );
    expect(rows).toHaveLength(0);
  });
});

describe("hall da fama", () => {
  it("ordena por títulos e só inclui quem fez top 4", () => {
    const hall = demoHall();
    expect(hall[0].username).toBe("joao");
    expect(hall[0].titles).toBe(2);
    expect(hall.map((h) => h.username)).not.toContain("lucas");
    expect(hall).toHaveLength(6);
  });
});
