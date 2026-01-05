import { X } from "lucide-react";
import { useState } from "react";

export const NoticeBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-accent text-accent-foreground py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-sm font-medium text-center">
          🔴 LIVE NOW: Community Game Jam - 48 hours remaining to submit
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
