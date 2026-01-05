import { Link } from "react-router-dom";
import { getTagConfig } from "@/lib/tagColors";

interface GenreCardProps {
  tag: string;
  onClick?: () => void;
  asLink?: boolean; // If true, renders as Link to /games. If false, renders as clickable div
}

export const GenreCard = ({ tag, onClick, asLink = true }: GenreCardProps) => {
  const config = getTagConfig(tag);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      if (!asLink) {
        e.preventDefault();
      }
      onClick();
    }
  };

  const cardContent = (
    <div
      className={`
        ${config.color} ${config.textColor}
        border-2 border-black dark:border-white
        p-3
        transition-all duration-200
        hover:translate-x-1 hover:translate-y-1
        hover:shadow-none
        shadow-[3px_3px_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_rgba(255,255,255,1)]
        cursor-pointer
      `}
    >
      <div className="flex flex-col items-center text-center gap-1">
        <span className="text-2xl">{config.emoji}</span>
        <h3 className="text-sm font-bold">{tag}</h3>
        <p className="text-xs opacity-90">
          {config.count} {config.count === 1 ? 'game' : 'games'}
        </p>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/games"
        state={{ selectedGenre: tag }}
        onClick={handleClick}
        className="block group"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className="block group">
      {cardContent}
    </div>
  );
};
