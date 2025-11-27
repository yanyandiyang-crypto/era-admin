import { useNavigate } from "react-router-dom";
import { Search, X, Clock, FileText, Users, MapPin, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useRef, useEffect } from "react";

interface SearchResult {
  id: string;
  type: "incident" | "personnel" | "barangay";
  title: string;
  subtitle?: string;
  description?: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      performSearch(debouncedSearch);
    } else {
      setResults([]);
    }
  }, [debouncedSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setIsExpanded(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      // TODO: Replace with actual API calls
      // Mock search results
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "incident",
          title: `Fire incident - ${query}`,
          subtitle: "INC-2024-001",
          description: "Active fire reported at Building A",
        },
        {
          id: "2",
          type: "personnel",
          title: `John ${query}`,
          subtitle: "Firefighter",
          description: "On duty - Station 1",
        },
        {
          id: "3",
          type: "barangay",
          title: `Barangay ${query}`,
          subtitle: "12 active incidents",
          description: "Population: 5,000",
        },
      ];

      setResults(mockResults);
    } catch {
      // console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    // Navigate
    const routes = {
      incident: `/incidents/${result.id}`,
      personnel: `/personnel/${result.id}`,
      barangay: `/barangays/${result.id}`,
    };
    navigate(routes[result.type]);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    setIsOpen(true);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const getIcon = (type: SearchResult["type"]) => {
    const icons = {
      incident: <FileText className="h-4 w-4" />,
      personnel: <Users className="h-4 w-4" />,
      barangay: <MapPin className="h-4 w-4" />,
    };
    return icons[type];
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    const colors = {
      incident: "bg-blue-100 text-blue-700",
      personnel: "bg-green-100 text-green-700",
      barangay: "bg-purple-100 text-purple-700",
    };
    return colors[type];
  };

  const openSearch = () => {
    setIsExpanded(true);
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Trigger / Input */}
      {!isExpanded ? (
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Search className="h-4 w-4 text-gray-500" />
          <span className="hidden lg:inline">Search (Ctrl+K)</span>
        </button>
      ) : (
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search incidents, personnel, barangays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                  setResults([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSearch();
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label="Collapse search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-auto z-50">
          {/* Loading State */}
          {isSearching && (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                >
                  <div className={`p-2 rounded ${getTypeColor(result.type)}`}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-gray-500">• {result.subtitle}</span>
                      )}
                    </div>
                    {result.description && (
                      <p className="text-sm text-gray-600 truncate">{result.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            </div>
          )}

          {/* Recent Searches */}
          {!isSearching && !searchTerm && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(term)}
                  className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isSearching && !searchTerm && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Start typing to search...</p>
              <p className="text-xs text-gray-400 mt-1">
                Search across incidents, personnel, and barangays
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
