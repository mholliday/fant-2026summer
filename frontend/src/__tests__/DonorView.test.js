import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DonorView from "../components/DonorView";

const makeDonorPayload = (overrides = {}) => ({
  donorID: "2026-1",
  data: {
    identification: { ancestry: "white", sex: "male", age: "45", condition: "good" },
    skeleton: {},
    dentition: {
      teeth: Array(32).fill("N"),
      wearScores: Array(32).fill(""),
    },
    osteometry: {},
    notes: {},
    ...overrides,
  },
});

const mockApi = {
  donor: {
    getByDid: vi.fn(() => Promise.resolve({ data: { donor: makeDonorPayload() } })),
    getVersions: vi.fn(() => Promise.resolve({ data: { versionsList: [] } })),
    getImages: vi.fn(() => Promise.resolve({ data: { images: [] } })),
    getImageBlob: vi.fn(() => Promise.resolve({ data: new Blob() })),
    updateImageCaption: vi.fn(() => Promise.resolve({ data: {} })),
  },
};

vi.mock("../contexts/AppContext", () => ({
  useAuth: () => ({ canWrite: true, isAdmin: false }),
  useAPI: () => ({ api: mockApi }),
}));

const renderDonorView = () =>
  render(
    <MemoryRouter>
      <DonorView />
    </MemoryRouter>
  );

describe("DonorView tabs", () => {
  beforeEach(() => {
    mockApi.donor.getByDid.mockClear();
    mockApi.donor.getByDid.mockImplementation(() =>
      Promise.resolve({ data: { donor: makeDonorPayload() } })
    );
  });

  it("renders the Skeletal Inventory tab before the Skeletal Analysis tab", async () => {
    renderDonorView();
    const tabs = await screen.findAllByRole("tab");
    const tabNames = tabs.map((t) => t.textContent);
    expect(tabNames).toEqual(["Skeletal Inventory", "Skeletal Analysis"]);
  });

  it("does not render a tab named Williams Analysis", async () => {
    renderDonorView();
    await screen.findAllByRole("tab");
    expect(screen.queryByText("Williams Analysis")).not.toBeInTheDocument();
  });

  it("labels the reference document button using Skeletal Analysis wording", async () => {
    renderDonorView();
    await screen.findAllByRole("tab");
    expect(
      screen.getByRole("button", { name: "Skeletal Analysis Collection Forms (.docx)" })
    ).toBeInTheDocument();
  });
});

describe("DonorView Dentition section", () => {
  it("shows each tooth's wear score, defaulting to — when unset", async () => {
    const donor = makeDonorPayload();
    donor.data.dentition.wearScores[0] = "3"; // tooth 1
    donor.data.dentition.wearScores[31] = "2"; // tooth 32
    mockApi.donor.getByDid.mockImplementation(() =>
      Promise.resolve({ data: { donor } })
    );

    renderDonorView();
    await screen.findAllByRole("tab");
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Skeletal Inventory" }));
    await user.click(screen.getByText("Dentition"));

    const upperJawCard = screen.getByText("Upper jaw (teeth 1–16)").closest(".card");
    const tooth1Cell = within(upperJawCard).getByText("1").parentElement;
    expect(within(tooth1Cell).getByText("3")).toBeInTheDocument();

    const lowerJawCard = screen.getByText("Lower jaw (teeth 32–17)").closest(".card");
    const tooth32Cell = within(lowerJawCard).getByText("32").parentElement;
    expect(within(tooth32Cell).getByText("2")).toBeInTheDocument();

    // Tooth 2 has no wear score recorded, so it should fall back to the em dash.
    const tooth2Cell = within(upperJawCard).getByText("2").parentElement;
    expect(within(tooth2Cell).getByText("—")).toBeInTheDocument();
  });
});
