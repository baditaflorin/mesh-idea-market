import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, sanitizeIdea, scoreIdea, spent } from "../../src/Feature";
import { config } from "../../src/config";
describe("idea market maths", () => {
  it("bounds idea text", () => expect(sanitizeIdea("  Make   tea ")).toBe("Make tea"));
  it("totals each peer allocation", () => {
    expect(spent({ a: 4, b: 6 })).toBe(10);
    expect(
      scoreIdea("a", [
        ["one", { a: 3 }],
        ["two", { a: 2 }],
      ]),
    ).toBe(5);
  });
});
describe("Feature", () => {
  it("renders the market", () => {
    render(<Feature room={createMockRoom()} config={config} />);
    expect(
      screen.getByRole("heading", { name: "Fund the ideas that should exist." }),
    ).toBeInTheDocument();
  });
});
