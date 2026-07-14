const {
  levenshtein,
  maxDistFor,
  collectStrings,
  wordMatches,
  tokenize,
  textMatches,
  donorMatchesQuery,
  searchDonors,
} = require("../utilities/donorSearch");

describe("levenshtein", () => {
  it("is 0 for identical strings", () => {
    expect(levenshtein("knife", "knife")).toBe(0);
  });
  it("counts single edits", () => {
    expect(levenshtein("knife", "knives")).toBe(2); // f->v, +s
    expect(levenshtein("exemplar", "exampler")).toBe(2);
    expect(levenshtein("cat", "cot")).toBe(1);
  });
  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "")).toBe(0);
  });
});

describe("maxDistFor", () => {
  it("scales tolerance with length", () => {
    expect(maxDistFor(2)).toBe(0);
    expect(maxDistFor(3)).toBe(0);
    expect(maxDistFor(5)).toBe(1);
    expect(maxDistFor(8)).toBe(2);
    expect(maxDistFor(12)).toBe(3);
  });
});

describe("collectStrings", () => {
  it("gathers non-empty strings recursively, skipping non-strings", () => {
    const out = collectStrings({
      a: "hello",
      b: 42,
      c: true,
      d: null,
      e: "   ",
      nested: { f: "world", g: ["x", 3, "y"] },
    });
    expect(out.sort()).toEqual(["hello", "world", "x", "y"].sort());
  });
  it("returns [] for nullish / primitive input", () => {
    expect(collectStrings(null)).toEqual([]);
    expect(collectStrings(undefined)).toEqual([]);
    expect(collectStrings(5)).toEqual([]);
    expect(collectStrings("only")).toEqual(["only"]);
  });
});

describe("tokenize", () => {
  it("splits on non-alphanumeric characters", () => {
    expect(tokenize("a knife-wound, deep")).toEqual(["a", "knife", "wound", "deep"]);
  });
});

describe("wordMatches", () => {
  it("matches substrings and small typos", () => {
    expect(wordMatches("exemplars", "exemplar")).toBe(true); // substring
    expect(wordMatches("exampler", "exemplar")).toBe(true);  // dist 2, len 8
    expect(wordMatches("zzzzz", "exemplar")).toBe(false);
  });
});

describe("textMatches", () => {
  it("matches a case-insensitive substring", () => {
    expect(textMatches("A deep Knife wound", "knife")).toBe(true);
  });
  it("matches a small spelling variation", () => {
    expect(textMatches("Exemplars used here", "exemplers")).toBe(true); // 1 edit
  });
  it("matches the exemplar/exemplers spelling family both directions", () => {
    expect(textMatches("Exemplers used", "exemplar")).toBe(true);
    expect(textMatches("An exemplar here", "exemplers")).toBe(true);
  });
  it("matches multi-word queries when all words appear (any order/position)", () => {
    expect(textMatches("used a sharp knife wound edge", "sharp knife")).toBe(true);
    expect(textMatches("a knife, and later something sharp", "sharp knife")).toBe(true);
    expect(textMatches("just a knife", "sharp knife")).toBe(false); // "sharp" absent
  });
  it("does not match unrelated text", () => {
    expect(textMatches("cranium intact", "mandible")).toBe(false);
  });
  it("is false for an empty query", () => {
    expect(textMatches("anything", "   ")).toBe(false);
  });
  it("does not over-match very short terms", () => {
    // len 2 => tolerance 0, so only exact word / substring hits
    expect(textMatches("cat", "at")).toBe(true);   // substring
    expect(textMatches("dog", "ca")).toBe(false);
  });
});

describe("donorMatchesQuery", () => {
  const donor = {
    donorID: "2026-9",
    data: {
      identification: { ancestry: "European" },
      notes: { trauma_exemplars: "Compared against a bladed instrument" },
    },
  };
  it("matches text inside any data field", () => {
    expect(donorMatchesQuery(donor, "bladed")).toBe(true);
    expect(donorMatchesQuery(donor, "europian")).toBe(true); // typo of European
  });
  it("does not match text outside data (e.g. donorID)", () => {
    expect(donorMatchesQuery(donor, "2026")).toBe(false);
  });
  it("matches when all query words appear across different fields", () => {
    const d = {
      data: {
        notes: { trauma_exemplars: "titanium bone plate" },
        identification: { ancestry: "European" },
      },
    };
    expect(donorMatchesQuery(d, "titanium european")).toBe(true); // spread across fields
    expect(donorMatchesQuery(d, "titanium plate")).toBe(true);    // non-adjacent, same field
    expect(donorMatchesQuery(d, "titanium mandible")).toBe(false); // "mandible" absent
  });
  it("is false when donor or data is missing", () => {
    expect(donorMatchesQuery(null, "x")).toBe(false);
    expect(donorMatchesQuery({}, "x")).toBe(false);
  });
});

describe("searchDonors", () => {
  const mk = (id, text) => ({ donorID: id, data: { notes: { general: text } } });
  const donors = [
    mk("2026-1", "knife wound to the skull"),
    mk("2026-2", "blunt force trauma"),
    mk("2026-3", "sharp knife incision"),
  ];

  it("filters to donors whose text matches", () => {
    const { donorsList, numDonors } = searchDonors(donors, "knife");
    expect(numDonors).toBe(2);
    expect(donorsList.map((d) => d.donorID)).toEqual(["2026-1", "2026-3"]);
  });

  it("returns all donors (paginated) for a blank query", () => {
    const { numDonors } = searchDonors(donors, "   ");
    expect(numDonors).toBe(3);
  });

  it("paginates the matched results", () => {
    const { donorsList, numDonors } = searchDonors(donors, "", 1, 2);
    expect(numDonors).toBe(3);
    expect(donorsList.map((d) => d.donorID)).toEqual(["2026-3"]);
  });

  it("handles a non-array input safely", () => {
    expect(searchDonors(undefined, "knife")).toEqual({ donorsList: [], numDonors: 0 });
  });
});
