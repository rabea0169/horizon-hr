import { describe, it, expect } from "vitest";

// Pure calculation logic extracted from the payroll router for validation
function calculateNetPay(basicSalary: string | number, bonus: string | number = 0, deductions: string | number = 0): string {
  const basic = Number(basicSalary || 0);
  const bon = Number(bonus || 0);
  const ded = Number(deductions || 0);
  const net = basic + bon - ded;
  return String(Number(net.toFixed(2))); // matching decimal scaling in db
}

describe("Payroll Calculation Logic", () => {
  it("should correctly compute net pay with integers", () => {
    const net = calculateNetPay("1000", "200", "50");
    expect(net).toBe("1150");
  });

  it("should correctly compute net pay with default zero values", () => {
    const net = calculateNetPay("1500");
    expect(net).toBe("1500");
  });

  it("should correctly compute net pay with decimal values", () => {
    const net = calculateNetPay("1250.50", "100.25", "50.10");
    expect(net).toBe("1300.65");
  });

  it("should handle empty or undefined values gracefully", () => {
    const net = calculateNetPay("", "", "");
    expect(net).toBe("0");
  });

  it("should support numeric values directly", () => {
    const net = calculateNetPay(2000, 150, 75);
    expect(net).toBe("2075");
  });

  it("should handle cases where deductions exceed basic and bonus salary", () => {
    const net = calculateNetPay("500", "50", "600");
    expect(net).toBe("-50"); // negative balance is possible in system bounds
  });
});
