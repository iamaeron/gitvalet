import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cx(...classes: string[]) {
  return clsx(twMerge(...classes));
}
