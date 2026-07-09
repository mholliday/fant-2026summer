import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ModifyDonor from "../components/ModifyDonor";

const mockApi = {
  donor: {
    getNextID: vi.fn(() => Promise.resolve({ data: { nextID: "2026-1" } })),
  },
};

vi.mock("../contexts/AppContext", () => ({
  useAPI: () => ({ api: mockApi }),
}));

const renderModifyDonor = () =>
  render(
    <MemoryRouter>
      <ModifyDonor create />
    </MemoryRouter>
  );

describe("ModifyDonor tabs", () => {
  beforeEach(() => {
    mockApi.donor.getNextID.mockClear();
  });

  it("renders the Skeletal Inventory tab before the Skeletal Analysis tab", async () => {
    renderModifyDonor();
    const tabs = await screen.findAllByRole("tab");
    const tabNames = tabs.map((t) => t.textContent);
    expect(tabNames).toEqual(["Skeletal Inventory", "Skeletal Analysis"]);
  });

  it("does not render a tab named Williams Analysis", async () => {
    renderModifyDonor();
    await screen.findAllByRole("tab");
    expect(screen.queryByText("Williams Analysis")).not.toBeInTheDocument();
  });
});

describe("ModifyDonor Ancestry dropdown", () => {
  it("offers the expected ancestry options, excluding Oceanian and European", async () => {
    renderModifyDonor();
    await screen.findAllByRole("tab");
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Skeletal Inventory" }));

    const label = await screen.findByText("Ancestry");
    const select = label.parentElement.querySelector("select");
    const options = within(select).getAllByRole("option").map((o) => o.textContent);

    expect(options).toEqual(["white", "african", "asian", "hispanic", "native american"]);
    expect(options).not.toContain("oceanian");
    expect(options).not.toContain("european");
  });
});

describe("ModifyDonor Dentition section", () => {
  it("renders both an NAPD dropdown and a 1-5 Wear Score dropdown for every tooth", async () => {
    renderModifyDonor();
    await screen.findAllByRole("tab");
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Skeletal Inventory" }));
    await user.click(screen.getByText("Dentition"));

    const wearScoreSelects = await screen.findAllByTitle("Wear Score");
    expect(wearScoreSelects).toHaveLength(32);

    wearScoreSelects.forEach((select) => {
      const values = within(select).getAllByRole("option").map((o) => o.textContent);
      expect(values).toEqual(["—", "1", "2", "3", "4", "5"]);
    });
  });
});
