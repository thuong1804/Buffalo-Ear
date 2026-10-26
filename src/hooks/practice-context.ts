import { createContext, useContext } from "react";
import type { usePractice } from "./usePractice";
export const PracticeContext = createContext<ReturnType<
  typeof usePractice
> | null>(null);
export function usePracticeContext() {
  const context = useContext(PracticeContext);
  if (!context) throw new Error("PracticeContext missing");
  return context;
}
