import dayjs from "dayjs";
import { grayToNibbles } from "../core/imageProcessor";
import {
  sendPrintJob,
  type PrintSettingsOptions,
} from "../core/printerService";

export const DEFAULT_CALENDAR_SETTINGS: PrintSettingsOptions = {
  quality: 49,
  speed: 20,
  energy: 2000,
  chunkRows: 20,
  chunkDelayMs: 0,
  feed: 100,
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const CALENDAR_WIDTH = 384;

const CELL_W = Math.floor(CALENDAR_WIDTH / 7);
const MARGIN_LEFT = Math.floor((CALENDAR_WIDTH - CELL_W * 7) / 2);

const HEADER_H = 48;
const DAY_LABEL_H = 32;
const DAY_GAP = 10;
const CELL_H = 44;
const BOTTOM_PAD = 20;
const LINE_Y_OFFSET = 4;

export interface CalendarData {
  year: number;
  month: number;
  monthName: string;
  width: number;
  height: number;
  svgXml: string;
  weeks: number[][];
  marginLeft: number;
  cellW: number;
  gridRight: number;
  yLine: number;
  labelBottom: number;
  yLabel: number;
  headerH: number;
  dayLabelH: number;
  dayGap: number;
  cellH: number;
}

export interface CalendarPrintData {
  title: string;
  width: number;
  height: number;
  svgXml: string;
  calendarData: CalendarData;
  nibbleData?: Uint8Array;
}

export function generateCalendar(year: number, month: number): CalendarData {
  const startOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const monthName = startOfMonth.format("MMMM");
  const daysInMonth = startOfMonth.daysInMonth();
  const firstDayIso = (startOfMonth.day() + 6) % 7;

  const weeks: number[][] = [];
  let currentWeek = new Array(7).fill(0);
  let dayCol = firstDayIso;
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek[dayCol] = d;
    dayCol++;
    if (dayCol === 7) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(0);
      dayCol = 0;
    }
  }
  if (dayCol > 0) {
    weeks.push(currentWeek);
  }

  const rows = weeks.length;
  const yLine = HEADER_H - LINE_Y_OFFSET;
  const labelBottom = yLine + DAY_LABEL_H;
  const yLabel = yLine + Math.floor(DAY_LABEL_H / 2) + 4;
  const height = labelBottom + DAY_GAP + CELL_H * rows + BOTTOM_PAD;
  const gridRight = MARGIN_LEFT + CELL_W * 7;

  const svgXml = `<svg width="384" height="${height}" viewBox="0 0 384 ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="384" height="${height}" fill="#FFFFFF"/>
  <text x="192" y="34" font-size="24" font-weight="bold" font-family="DMSans_700Bold, DM Sans, sans-serif" text-anchor="middle" fill="#000000">${monthName} ${year}</text>
  <line x1="${MARGIN_LEFT}" y1="${yLine}" x2="${gridRight}" y2="${yLine}" stroke="#000000" stroke-width="2"/>
  ${DAYS.map((d, i) => {
    const x = MARGIN_LEFT + i * CELL_W + CELL_W / 2;
    return `<text x="${x}" y="${yLabel}" font-size="13" font-weight="${d === "Sun" ? "bold" : "500"}" font-family="DMSans_500Medium, DM Sans, sans-serif" text-anchor="middle" fill="#000000">${d}</text>`;
  }).join("")}
  <line x1="${MARGIN_LEFT}" y1="${labelBottom}" x2="${gridRight}" y2="${labelBottom}" stroke="#000000" stroke-width="2"/>
  ${weeks
    .flatMap((w, rIdx) => {
      const cellTop = labelBottom + DAY_GAP + rIdx * CELL_H;
      return w.map((dayNum, cIdx) => {
        if (dayNum === 0) return "";
        const x = MARGIN_LEFT + cIdx * CELL_W + CELL_W / 2;
        const y = cellTop + CELL_H / 2 + 6;
        return `<text x="${x}" y="${y}" font-size="18" font-weight="bold" font-family="DMSans_700Bold, DM Sans, sans-serif" text-anchor="middle" fill="#000000">${dayNum}</text>`;
      });
    })
    .filter(Boolean)
    .join("")}
</svg>`;

  return {
    year,
    month,
    monthName,
    width: CALENDAR_WIDTH,
    height,
    svgXml,
    weeks,
    marginLeft: MARGIN_LEFT,
    cellW: CELL_W,
    gridRight,
    yLine,
    labelBottom,
    yLabel,
    headerH: HEADER_H,
    dayLabelH: DAY_LABEL_H,
    dayGap: DAY_GAP,
    cellH: CELL_H,
  };
}

export class CalendarService {
  readonly printerWidth: number = CALENDAR_WIDTH;
  readonly days: string[] = DAYS;
  readonly defaultSettings: PrintSettingsOptions = DEFAULT_CALENDAR_SETTINGS;

  generateCalendar(year: number, month: number): CalendarData {
    return generateCalendar(year, month);
  }

  generatePrintData(year: number, month: number): CalendarPrintData {
    const data = this.generateCalendar(year, month);
    const buffer = new Uint8Array(data.width * data.height);
    buffer.fill(255);
    const nibbleData = grayToNibbles(buffer, data.width, data.height);

    return {
      title: `Calendar - ${data.monthName} ${data.year}`,
      width: data.width,
      height: data.height,
      svgXml: data.svgXml,
      calendarData: data,
      nibbleData,
    };
  }

  async print(
    year: number,
    month: number,
    viewRef?: import("../core/viewRasterizer").ViewCaptureTarget,
    settings: Partial<PrintSettingsOptions> = {},
  ): Promise<CalendarPrintData> {
    const printData = this.generatePrintData(year, month);
    let nibbles = printData.nibbleData;
    let printWidth = printData.width;

    if (viewRef) {
      const { rasterizeViewToNibbles } = await import("../core/viewRasterizer");
      const rasterized = await rasterizeViewToNibbles(viewRef, CALENDAR_WIDTH);
      nibbles = rasterized.nibbleData;
      printWidth = rasterized.width;
    }

    if (!nibbles) {
      throw new Error("No print data available for Calendar.");
    }

    const mergedSettings = { ...this.defaultSettings, ...settings };
    await sendPrintJob(nibbles, printWidth, mergedSettings);
    return printData;
  }
}

export const calendarService = new CalendarService();
