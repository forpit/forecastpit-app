import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface Season {
  id: string;
  season_number: number;
  status: string;
}

interface SeasonSelectorProps {
  value: string | null;
  onChange: (seasonId: string | null) => void;
  showAllTime?: boolean;
}

export const SeasonSelector = ({
  value,
  onChange,
  showAllTime = false,
}: SeasonSelectorProps) => {
  const { data: seasons } = useQuery({
    queryKey: ["seasons-selector"],
    queryFn: async (): Promise<Season[]> => {
      const { data } = await supabase
        .from("seasons")
        .select("id, season_number, status")
        .order("season_number", { ascending: false });
      return data || [];
    },
  });

  const activeSeason = seasons?.find((s) => s.status === "active");
  const currentValue = value || activeSeason?.id || "";

  const getLabel = (seasonId: string) => {
    if (seasonId === "all") return "All Time";
    const season = seasons?.find((s) => s.id === seasonId);
    if (!season) return "Select Season";
    return `Season ${season.season_number}${season.status === "active" ? " (Current)" : ""}`;
  };

  return (
    <Select value={currentValue} onValueChange={(v) => onChange(v === "all" ? null : v)}>
      <SelectTrigger className="w-[180px] border-2 border-foreground">
        <Calendar className="w-4 h-4 mr-2" />
        <SelectValue>{getLabel(currentValue)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllTime && (
          <SelectItem value="all">All Time</SelectItem>
        )}
        {seasons?.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            Season {season.season_number}
            {season.status === "active" && " (Current)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
