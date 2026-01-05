import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const SEARCH_STORAGE_KEY = "forecastpit-search-query";

export const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem(SEARCH_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (searchQuery) {
        localStorage.setItem(SEARCH_STORAGE_KEY, searchQuery);
      } else {
        localStorage.removeItem(SEARCH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save search query:", error);
    }
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { news: [], games: [] };

      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      const { data: newsData, error: newsError } = await supabase
        .from('news_articles')
        .select('*')
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('date', { ascending: false })
        .limit(5);

      if (newsError) throw newsError;

      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('total_plays', { ascending: false, nullsFirst: false })
        .limit(5);

      if (gamesError) throw gamesError;

      return {
        news: newsData || [],
        games: gamesData || []
      };
    },
    enabled: searchQuery.length >= 2
  });

  const totalResults = (searchResults?.news.length || 0) + (searchResults?.games.length || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search news and games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {searchQuery.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Type at least 2 characters to search
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Searching...</p>
          ) : (
            <ScrollArea className="h-[400px]">
              {totalResults === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
              ) : (
                <div className="space-y-6">
                  {searchResults && searchResults.news.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">News Articles</h3>
                      <div className="space-y-2">
                        {searchResults.news.map((article) => (
                          <Link
                            key={article.id}
                            to={`/news/${article.slug}`}
                            onClick={() => setOpen(false)}
                            className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <div className="flex gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            </div>
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{article.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults && searchResults.games.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Games</h3>
                      <div className="space-y-2">
                        {searchResults.games.map((game) => (
                          <Link
                            key={game.id}
                            to={`/games/${game.slug}`}
                            onClick={() => setOpen(false)}
                            className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <div className="flex gap-2 mb-1">
                              {game.categories && game.categories.length > 0 && (
                                <Badge variant="outline" className="text-xs">{game.categories[0]}</Badge>
                              )}
                              {game.total_plays && (
                                <Badge variant="outline" className="text-xs">{(game.total_plays / 1000).toFixed(0)}K plays</Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{game.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
