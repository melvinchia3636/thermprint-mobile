import { createContext, useContext, useState, type ReactNode } from "react";
import dayjs, { type Dayjs } from "dayjs";

type CalendarConfigContextType = {
  selectedDate: Dayjs;
  year: number;
  month: number;
  setSelectedDate: (date: Dayjs) => void;
  prevMonth: () => void;
  nextMonth: () => void;
};

const CalendarConfigContext = createContext<CalendarConfigContextType | null>(
  null,
);

export function CalendarConfigProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());

  return (
    <CalendarConfigContext.Provider
      value={{
        selectedDate,
        year: selectedDate.year(),
        month: selectedDate.month() + 1,
        setSelectedDate,
        prevMonth: () => setSelectedDate((prev) => prev.subtract(1, "month")),
        nextMonth: () => setSelectedDate((prev) => prev.add(1, "month")),
      }}
    >
      {children}
    </CalendarConfigContext.Provider>
  );
}

export function useCalendarConfig(): CalendarConfigContextType {
  const context = useContext(CalendarConfigContext);
  if (!context) {
    throw new Error(
      "useCalendarConfig must be used within a CalendarConfigProvider",
    );
  }
  return context;
}
