import { describe, expect, it } from "vitest";
import { fromLocalInput } from "@/lib/format";
import { nextOfEachSeries, weeklyDates, weeklyLabel } from "@/lib/domain/schedule";

describe("weeklyDates", () => {
  it("repete no mesmo horário a cada 7 dias, virando o mês", () => {
    expect(weeklyDates("2026-10-21T19:30", 3)).toEqual(["2026-10-21T19:30", "2026-10-28T19:30", "2026-11-04T19:30"]);
  });

  it("uma semana só devolve a própria data", () => {
    expect(weeklyDates("2026-12-30T10:00", 1)).toEqual(["2026-12-30T10:00"]);
  });
});

describe("weeklyLabel", () => {
  it("usa o dia da semana e o horário de São Paulo", () => {
    expect(weeklyLabel(fromLocalInput("2026-10-21T19:30"))).toBe("Toda quarta · 19:30");
    expect(weeklyLabel(fromLocalInput("2026-10-17T14:00"))).toBe("Todo sábado · 14:00");
  });
});

describe("nextOfEachSeries", () => {
  it("deixa a primeira data de cada série e todos os avulsos", () => {
    const events = [
      { id: "a", seriesId: "s1" }, { id: "b", seriesId: null }, { id: "c", seriesId: "s1" }, { id: "d", seriesId: "s2" }, { id: "e", seriesId: null },
    ];
    expect(nextOfEachSeries(events).map((e) => e.id)).toEqual(["a", "b", "d", "e"]);
  });
});
