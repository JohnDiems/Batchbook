import { cn } from "@/lib/utils";

const controlStyles = "h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 py-1 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

export function Input({ className, type, ...props }) {
  return <input type={type} data-slot="input" className={cn(controlStyles, "invalid:border-destructive", className)} {...props} />;
}

export function NativeSelect({ className, children, ...props }) {
  return (
    <span className="relative block min-w-0">
      <select data-slot="native-select" className={cn(controlStyles, "appearance-none pr-8", className)} {...props}>
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-1.5 -translate-y-3/4 rotate-45 border-r border-b" />
    </span>
  );
}
