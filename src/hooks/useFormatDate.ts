import { useMemo } from "react";

export function useFormatDate() {
  return (date: Date | string) => {
    const d = useMemo(() => new Date(date), [date]);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
}