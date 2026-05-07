import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, ChefHat, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Persistent top-bar with app branding, search input, favorites link,
 * and a light/dark theme toggle.
 * Theme state is persisted to localStorage and applied as a class on <html>.
 */
export default function Header() {
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );
  const navigate = useNavigate();

  // Sync dark class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/?q=${encodeURIComponent(q)}`);
    setQuery('');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-primary text-xl shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="RecipeBox home"
        >
          <ChefHat className="h-6 w-6" aria-hidden="true" />
          <span className="hidden sm:inline">RecipeBox</span>
        </Link>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 items-center gap-2"
          role="search"
        >
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search recipes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search recipes"
            />
          </div>
          <Button type="submit" size="sm" aria-label="Submit search">
            Search
          </Button>
        </form>

        {/* Nav actions */}
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/favorites" aria-label="View saved favorites">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
          >
            {dark ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
