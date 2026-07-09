"use strict";
// htmlTemplate is NOT mocked here ? we test the real function
const { generateHtml } = require("../utilities/htmlTemplate");

const makeDonor = (overrides = {}) => ({
  donorID: "2026-1",
  createdBy: "Alice Smith",
  modifiedBy: "Bob Jones",
  creationTime: new Date("2026-01-01").toISOString(),
  modificationTime: new Date("2026-06-01").toISOString(),
  data: {
    identification: {
      sex: "male",
      ancestry: "white",
      age: "45",
      condition: "good",
      autopsy: false,
    },
    skeleton: {
      cranial:     { calvarium: 1, mandible: 2 },
      upper_limbs: { humerus_r: 1 },
      lower_limbs: { femur_l: 3 },
      thorax:      { ribs: 0 },
      other:       {},
    },
    dentition: { teeth: Array(32).fill("N") },
    osteometry: { maximum_cranial_length: "185", femur_max_length: "" },
    notes: {
      general_observations: "Some observation",
      trauma_and_pathological_analysis: "Some trauma note",
    },
  },
  ...overrides,
});

describe("generateHtml utility", () => {
  it("returns a string containing the donor ID", () => {
    const html = generateHtml(makeDonor());
    expect(typeof html).toBe("string");
    expect(html).toContain("2026-1");
  });

  it("includes sex and ancestry fields", () => {
    const html = generateHtml(makeDonor());
    expect(html).toContain("male");
    expect(html).toContain("white");
  });

  it("includes notes when present", () => {
    const html = generateHtml(makeDonor());
    expect(html).toContain("Some observation");
    expect(html).toContain("Some trauma note");
  });

  it("still renders labelled empty note boxes when both notes are empty", () => {
    const donor = makeDonor();
    donor.data.notes = { general_observations: "", trauma_and_pathological_analysis: "" };
    const html = generateHtml(donor);
    expect(html).toContain("General Observations");
    expect(html).toContain("Trauma and Pathological Analysis");
  });

  it("renders autopsy=true correctly", () => {
    const donor = makeDonor();
    donor.data.identification.autopsy = true;
    const html = generateHtml(donor);
    expect(html).toContain("yes");
  });

  it("handles missing data fields gracefully", () => {
    const minimal = {
      donorID: "2026-2",
      createdBy: "X",
      modifiedBy: "Y",
      creationTime: null,
      modificationTime: null,
      data: {
        identification: {},
        skeleton: { cranial:{}, upper_limbs:{}, lower_limbs:{}, thorax:{}, other:{} },
        dentition: { teeth: Array(32).fill("N") },
        osteometry: {},
        notes: { general_observations: "", trauma_and_pathological_analysis: "" },
      },
    };
    const html = generateHtml(minimal);
    expect(html).toContain("2026-2");
  });
});
