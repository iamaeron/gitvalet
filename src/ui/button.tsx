import { ComponentPropsWithoutRef } from "react";
import { cx } from "@/lib/cx";
import Lineicons from "@lineiconshq/react-lineicons";
import { Spinner3Solid } from "@lineiconshq/free-icons";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  children: React.ReactNode;
  variant?: "default" | "filled" | "transparent";
  loading?: boolean;
}

const Button = ({
  children,
  variant = "default",
  loading,
  className = "",
  ...props
}: ButtonProps) => {
  const variants = {
    default:
      "dark:border-stone-700/50 dark:text-stone-400 dark:bg-stone-800/30 dark:hover:border-stone-600/70",
    filled:
      "border-transparent shadow-[inset_0_1px_0_0_var(--color-orange-400)] dark:text-stone-100 dark:bg-orange-500 dark:hover:bg-orange-400",
    transparent:
      "border-transparent bg-transparent dark:text-stone-400 dark:hover:bg-stone-800/30",
  };

  return (
    <button
      data-loading={loading}
      disabled={props.disabled || loading}
      className={cx(
        "group/button will-change-transform transition-all select-none relative rounded-lg text-sm border font-medium active:translate-y-px px-3 py-1.5 w-max",
        variants[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[loading=true]:opacity-50 data-[loading=true]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <span
        className={cx(
          "flex justify-center items-center gap-2",
          loading
            ? "opacity-0 pointer-events-none invisible"
            : "opacity-100 pointer-events-auto visible",
        )}
      >
        {children}
      </span>
      <Lineicons
        icon={Spinner3Solid}
        size={18}
        className={cx(
          "animate-spin transition-all absolute top-1/2 left-1/2 -translate-1/2",
          !loading
            ? "opacity-0 pointer-events-none invisible"
            : "opacity-100 pointer-events-auto visible",
        )}
      />
    </button>
  );
};

export default Button;
