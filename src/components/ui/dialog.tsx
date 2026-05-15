import { useEffect, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type DialogRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  onOpenChange?: () => void;
};

type DialogContentProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

type DialogSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Dialog({ children, className, onMouseDown, onOpenChange, ...props }: DialogRootProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange?.();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onOpenChange]);

  return (
    <div
      className={cn("ui-dialog-overlay", className)}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (!event.defaultPrevented) onOpenChange?.();
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <section className={cn("ui-dialog-content", className)} role="dialog" aria-modal="true" {...props}>
      {children}
    </section>
  );
}

export function DialogFooter({ children, className, ...props }: DialogSectionProps) {
  return (
    <footer className={cn("ui-dialog-footer", className)} {...props}>
      {children}
    </footer>
  );
}

export function DialogHeader({ children, className, ...props }: DialogSectionProps) {
  return (
    <header className={cn("ui-dialog-header", className)} {...props}>
      {children}
    </header>
  );
}
