import { useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function LocationSearchInput({ placeholder, value, onChange, dotColor = 'bg-forge-orange' }) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = (q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ng`
        );
        const data = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const select = (item) => {
    const loc = { address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setQuery(item.display_name);
    setResults([]);
    onChange(loc);
  };

  return (
    <div className="relative">
      <div className={`absolute left-4 top-4 w-3 h-3 rounded-full ${dotColor} z-10 mt-0.5`} />
      {loading && <Loader2 className="absolute right-4 top-4 w-4 h-4 animate-spin text-gray-400 z-10" />}
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-4 border border-border bg-card text-foreground rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
        required
      />
      {results.length > 0 && (
        <div className="absolute z-50 w-full bg-card border border-border rounded-2xl shadow-xl mt-1 max-h-52 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => select(r)}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent border-b border-border last:border-0 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-forge-orange mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}