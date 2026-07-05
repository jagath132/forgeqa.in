import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TestScripts } from "./TestScripts";

describe("TestScripts page", () => {
  it("renders controls and preview placeholder", () => {
    render(
      <BrowserRouter>
        <TestScripts />
      </BrowserRouter>
    );

    expect(screen.getByText(/Automation Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminal Buffer Empty/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Automation Script/i })).toBeInTheDocument();
  });
});
