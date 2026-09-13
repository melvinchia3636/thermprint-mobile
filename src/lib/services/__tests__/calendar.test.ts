import { describe, it, expect } from "bun:test";
import {
  generateCalendar,
  CALENDAR_WIDTH,
  calendarService,
} from "../calendarService";

describe("Calendar Generator", () => {
  it("should generate valid calendar data for October 2026", () => {
    const cal = generateCalendar(2026, 10);
    expect(cal.year).toBe(2026);
    expect(cal.month).toBe(10);
    expect(cal.width).toBe(CALENDAR_WIDTH);
    expect(cal.height).toBeGreaterThan(300);
    expect(cal.svgXml).toContain("October 2026");
    expect(cal.svgXml).toContain("Mon");
    expect(cal.svgXml).toContain("Sun");
  });

  it("should handle February in leap and non-leap years", () => {
    const cal2024 = generateCalendar(2024, 2); // Leap year: 29 days
    const cal2025 = generateCalendar(2025, 2); // Non-leap year: 28 days
    expect(cal2024.svgXml).toContain(">29<");
    expect(cal2025.svgXml).not.toContain(">29<");
  });

  it("should provide calendarService singleton instance with service methods", () => {
    expect(calendarService.printerWidth).toBe(384);
    expect(calendarService.days.length).toBe(7);
    const calData = calendarService.generateCalendar(2026, 10);
    expect(calData.year).toBe(2026);
    const printData = calendarService.generatePrintData(2026, 10);
    expect(printData.width).toBe(384);
    expect(printData.nibbleData).toBeDefined();
    expect(printData.nibbleData!.length).toBeGreaterThan(0);
  });
});
