import { describe, it, expect } from "vitest";
import {
  ANALYSIS_FIELDS,
  ELEMENT_GROUPS,
  elemKey,
  defaultElementInventory,
  defaultAnalysis,
  absentBoneIds,
} from "../services/williamsForm";

describe("elemKey", () => {
  it("joins group and element keys with a double underscore", () => {
    expect(elemKey("left_arm", "humerus")).toBe("left_arm__humerus");
  });
});

describe("defaultAnalysis", () => {
  it("initializes every ANALYSIS_FIELDS key to an empty string", () => {
    const analysis = defaultAnalysis();
    ANALYSIS_FIELDS.forEach((f) => {
      expect(analysis[f.key]).toBe("");
    });
    expect(Object.keys(analysis)).toHaveLength(ANALYSIS_FIELDS.length);
  });
});

describe("defaultElementInventory", () => {
  it("marks every element across every group as present with no observations", () => {
    const inventory = defaultElementInventory();
    let count = 0;
    ELEMENT_GROUPS.forEach((g) => {
      g.elements.forEach((e) => {
        const cell = inventory[elemKey(g.key, e.key)];
        expect(cell).toEqual({ absent: false, obs: "" });
        count += 1;
      });
    });
    expect(Object.keys(inventory)).toHaveLength(count);
  });
});

describe("absentBoneIds", () => {
  it("returns no absent bones for a fresh (default) inventory", () => {
    expect(absentBoneIds(defaultElementInventory())).toEqual([]);
  });

  it("returns no absent bones when called with no inventory", () => {
    expect(absentBoneIds()).toEqual([]);
    expect(absentBoneIds({})).toEqual([]);
  });

  it("marks a bone absent only when every element mapped to it is absent", () => {
    const inventory = defaultElementInventory();
    // Cranium vault/basicranium/facial all map to "Cranium" in BONE_SVG_MAP.
    inventory[elemKey("cranium", "vault")] = { absent: true, obs: "" };
    // Only one of the three elements mapped to "Cranium" is absent, so it
    // should still read as present.
    expect(absentBoneIds(inventory)).not.toContain("Cranium");

    inventory[elemKey("cranium", "basicranium")] = { absent: true, obs: "" };
    inventory[elemKey("cranium", "facial")] = { absent: true, obs: "" };
    // Now all three are absent, so the shared figure id should be reported absent.
    expect(absentBoneIds(inventory)).toContain("Cranium");
  });

  it("treats a missing cell as present (not absent)", () => {
    // Legacy donors saved before an element existed shouldn't redden the figure.
    expect(absentBoneIds({})).not.toContain("Cranium");
  });
});
