import { describe, it, expect } from "vitest";
import { toDBSchema, toAccordionSchema } from "../services/donorDataService";

describe("toDBSchema", () => {
  it("wraps donor data under donor.data and copies donorID", () => {
    const donorData = { identification: { ancestry: "white" }, notes: {} };
    const result = toDBSchema("2026-1", donorData);
    expect(result).toEqual({
      donor: { donorID: "2026-1", data: { identification: { ancestry: "white" }, notes: {} } },
    });
  });

  it("shallow-copies donorData so the original object reference isn't reused", () => {
    const donorData = { identification: {} };
    const result = toDBSchema("2026-1", donorData);
    expect(result.donor.data).not.toBe(donorData);
    expect(result.donor.data).toEqual(donorData);
  });
});

describe("toAccordionSchema", () => {
  it("spreads skeleton fields to the top level and nests scalar fields under identification", () => {
    const donorData = {
      donorID: "2026-1",
      archived: false,
      timestamp: "2026-01-01",
      modifiedBy: "Alice",
      sex: "male",
      skeleton: { cranial: { calvarium: 1 } },
    };
    const result = toAccordionSchema(donorData);
    expect(result.cranial).toEqual({ calvarium: 1 });
    expect(result.identification.sex).toBe("male");
  });

  it("excludes donorID, archived, timestamp, and modifiedBy from identification", () => {
    const donorData = {
      donorID: "2026-1",
      archived: false,
      timestamp: "2026-01-01",
      modifiedBy: "Alice",
      skeleton: {},
    };
    const result = toAccordionSchema(donorData);
    expect(result.identification).not.toHaveProperty("donorID");
    expect(result.identification).not.toHaveProperty("archived");
    expect(result.identification).not.toHaveProperty("timestamp");
    expect(result.identification).not.toHaveProperty("modifiedBy");
  });

  it("omits nested object fields (other than skeleton) from identification", () => {
    const donorData = {
      skeleton: {},
      notes: { general_observations: "hello" },
    };
    const result = toAccordionSchema(donorData);
    expect(result.identification).not.toHaveProperty("notes");
  });
});
