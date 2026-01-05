import { useNextDecisionCycle, formatDecisionDay } from "@/hooks/useNextDecisionCycle";
import { Clock } from "lucide-react";

interface CountdownProps {
  variant?: "full" | "compact";
}

export const DecisionCycleCountdown = ({ variant = "full" }: CountdownProps) => {
  const { days, hours, minutes, seconds, nextDate, isToday } = useNextDecisionCycle();

  const dayName = formatDecisionDay(nextDate);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-accent" />
        <span className="text-muted-foreground">Next:</span>
        <span className="font-mono font-bold">
          {days > 0 && `${days}d `}
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-accent" />
        <span className="text-sm font-bold uppercase tracking-wide">
          Next Decision Cycle
        </span>
        {isToday && (
          <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold uppercase">
            Today
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {days > 0 && (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">{days}</div>
            <div className="text-xs text-muted-foreground uppercase">Days</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">{String(hours).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground uppercase">Hours</div>
        </div>
        <div className="text-2xl font-bold text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">{String(minutes).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground uppercase">Min</div>
        </div>
        <div className="text-2xl font-bold text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">{String(seconds).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground uppercase">Sec</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {dayName} at 00:00 UTC
      </div>
    </div>
  );
};
