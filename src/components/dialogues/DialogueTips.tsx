import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lightbulb } from "lucide-react";

export function DialogueTips() {
    const { t } = useTranslation();
    const tooltipId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    function clearCloseTimer(): void {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = null;
    }

    function showTips(): void {
        clearCloseTimer();
        if (!open) setPosition(null);
        setOpen(true);
    }

    function scheduleClose(): void {
        if (!open) return;
        clearCloseTimer();
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    }

    useEffect(() => {
        if (!open) return;

        function updatePosition(): void {
            if (!buttonRef.current || !tooltipRef.current) return;
            const anchor = buttonRef.current.getBoundingClientRect();
            const tooltip = tooltipRef.current.getBoundingClientRect();
            const padding = 16;
            const gap = 8;
            const left = Math.max(
                padding,
                Math.min(anchor.right - tooltip.width, innerWidth - tooltip.width - padding),
            );
            const above = anchor.top - tooltip.height - gap;
            const top =
                above >= padding
                    ? above
                    : Math.max(
                          padding,
                          Math.min(anchor.bottom + gap, innerHeight - tooltip.height - padding),
                      );
            setPosition((previous) =>
                previous?.top === top && previous.left === left ? previous : { top, left },
            );
        }

        function closeOutside(event: PointerEvent): void {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent): void {
            if (event.key === "Escape") setOpen(false);
        }

        updatePosition();
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("keydown", closeOnEscape);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
        return () => {
            clearCloseTimer();
            document.removeEventListener("pointerdown", closeOutside);
            document.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open]);

    return (
        <div
            ref={rootRef}
            className="ml-auto inline-flex shrink-0 items-center"
            onPointerEnter={(event) => {
                if (event.pointerType === "mouse") showTips();
            }}
            onPointerLeave={(event) => {
                if (event.pointerType === "mouse") scheduleClose();
            }}
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
                    setOpen(false);
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                data-testid="dialogue-tips"
                aria-label={t("dialogues:tips")}
                aria-describedby={open ? tooltipId : undefined}
                aria-expanded={open}
                className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-background text-primary-ink hover:bg-surface"
                onFocus={showTips}
                onClick={showTips}
            >
                <Lightbulb size={19} aria-hidden="true" />
            </button>
            {open && (
                <div
                    ref={tooltipRef}
                    id={tooltipId}
                    role="tooltip"
                    data-testid="dialogue-tips-content"
                    className="fixed z-50 max-h-[calc(100dvh-2rem)] w-88 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-line bg-background p-4 text-base leading-relaxed text-muted shadow-lg"
                    style={{
                        top: position?.top ?? 0,
                        left: position?.left ?? 0,
                        visibility: position ? "visible" : "hidden",
                    }}
                    onPointerEnter={showTips}
                    onPointerLeave={scheduleClose}
                >
                    <p>{t("dialogues:note")}</p>
                    <p className="mt-3">{t("dialogues:ipaNote")}</p>
                    <p className="mt-3">{t("dialogues:resetNote")}</p>
                </div>
            )}
        </div>
    );
}
