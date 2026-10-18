import { describe, expect, it } from "vitest";
import { isOwnMediaPath } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import { formatRegion } from "@/lib/domain/region";
import { listingSchema, profileSchema, signUpSchema } from "@/lib/validation/schemas";

const base = { kind: "sell", cardName: "Jinx", condition: "nm", quantity: "1" };

describe("preço do anúncio", () => {
  it.each([
    ["120", 12000],
    ["120,50", 12050],
    ["R$ 1.200,00", 120000],
    ["12.5", 1250],
    ["", null],
  ])("%s vira %s centavos", (price, cents) => {
    expect(listingSchema.parse({ ...base, price }).price).toBe(cents);
  });

  it("recusa preço inválido", () => {
    expect(listingSchema.safeParse({ ...base, price: "abc" }).success).toBe(false);
  });

  it("formata em reais", () => {
    expect(formatPrice(12000)).toMatch(/R\$\s?120/);
  });
});

describe("perfil", () => {
  it("limpa Instagram e WhatsApp", () => {
    const v = profileSchema.parse({ displayName: "Kauê", instagram: "https://instagram.com/kaue.rift/", whatsapp: "(11) 98765-4321" });
    expect(v.instagram).toBe("kaue.rift");
    expect(v.whatsapp).toBe("11987654321");
    expect(v.shareWhatsapp).toBe(false);
    expect(v.city).toBeNull();
    expect(v.state).toBeNull();
  });

  it("região: cidade + UF, e cidade sozinha não vale", () => {
    const base = { displayName: "Kauê", instagram: "", whatsapp: "" };
    const v = profileSchema.parse({ ...base, city: "  Campinas ", state: "SP" });
    expect([v.city, v.state]).toEqual(["Campinas", "SP"]);
    expect(profileSchema.parse({ ...base, city: "", state: "RJ" }).state).toBe("RJ");
    expect(profileSchema.safeParse({ ...base, city: "Campinas", state: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, state: "XX" }).success).toBe(false);
  });
});

describe("formatRegion", () => {
  it("monta Cidade/UF", () => {
    expect(formatRegion("Campinas", "SP")).toBe("Campinas/SP");
    expect(formatRegion(null, "RJ")).toBe("RJ");
    expect(formatRegion("Campinas", null)).toBeNull();
  });
});

describe("cadastro", () => {
  it("apelido sem espaço nem acento", () => {
    expect(signUpSchema.safeParse({ username: "kauê silva", email: "a@b.com", password: "12345678" }).success).toBe(false);
    expect(signUpSchema.parse({ username: "Kaue_01", email: "A@B.com", password: "12345678" }).username).toBe("kaue_01");
  });
});

describe("fotos enviadas", () => {
  const me = "00000000-0000-4000-8000-100000000001";
  const other = "00000000-0000-4000-8000-100000000002";
  const file = "11111111-1111-4111-8111-111111111111.jpg";

  it("só aceita a pasta do próprio usuário", () => {
    expect(isOwnMediaPath(`${me}/posts/${file}`, me)).toBe(true);
    expect(isOwnMediaPath(`${other}/posts/${file}`, me)).toBe(false);
    expect(isOwnMediaPath(`${me}/../${other}/posts/${file}`, me)).toBe(false);
    expect(isOwnMediaPath(`${me}/segredos/${file}`, me)).toBe(false);
  });
});
