import { useState, useEffect } from "react";
import "./App.css";

function getColor(n) {
  if (!n) return "#4b5675";
  if (n > 100000) return "#f87171";
  if (n > 50000)  return "#fb923c";
  if (n > 10000)  return "#fbbf24";
  return "#34d399";
}

function getLabel(n) {
  if (!n) return "Unknown";
  if (n > 100000) return "Critical";
  if (n > 50000)  return "High";
  if (n > 10000)  return "Moderate";
  return "Low";
}

function pretty(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

// calculate bar width as % relative to max cases
function barWidth(val, max) {
  if (!val || !max) return "4%";
  return Math.max(4, (val / max) * 100) + "%";
}

function Card({ country, maxCases }) {
  const color = getColor(country.casesPerOneMillion);
  const label = getLabel(country.casesPerOneMillion);

  return (
    <div className="card">
      <div className="card-accent-line" style={{ background: color }} />

      <div className="card-top">
        <div className="flag-name">
          <img src={country.countryInfo?.flag} alt={country.country} />
          <span className="cname">{country.country}</span>
        </div>
        <span className="badge" style={{ color, background: color + "20" }}>
          {label}
        </span>
      </div>

      {/* bar chart style instead of boxes */}
      <div className="stat-bars">
        <div className="stat-bar-row">
          <span className="bar-label">Cases</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: barWidth(country.cases, maxCases), background: "#f87171" }} />
          </div>
          <span className="bar-val" style={{ color: "#f87171" }}>{pretty(country.cases)}</span>
        </div>
        <div className="stat-bar-row">
          <span className="bar-label">Recovered</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: barWidth(country.recovered, maxCases), background: "#34d399" }} />
          </div>
          <span className="bar-val" style={{ color: "#34d399" }}>{pretty(country.recovered)}</span>
        </div>
        <div className="stat-bar-row">
          <span className="bar-label">Deaths</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: barWidth(country.deaths, maxCases), background: "#9ca3af" }} />
          </div>
          <span className="bar-val" style={{ color: "#9ca3af" }}>{pretty(country.deaths)}</span>
        </div>
      </div>

      <span className="per-mil">{pretty(country.casesPerOneMillion)} per million</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="card-accent-line" style={{ background: "#1c2333" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skel" style={{ height: 14, width: "40%" }} />
        <div className="skel" style={{ height: 14, width: "16%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skel" style={{ height: 10 }} />
        <div className="skel" style={{ height: 10 }} />
        <div className="skel" style={{ height: 10 }} />
      </div>
      <div className="skel" style={{ height: 10, width: "35%" }} />
    </div>
  );
}

export default function CovidDashboard() {
  const [countries, setCountries]         = useState([]);
  const [globalStats, setGlobalStats]     = useState(null);
  const [search, setSearch]               = useState("");
  const [chosenCountry, setChosenCountry] = useState("");
  const [view, setView]                   = useState("card");
  const [severity, setSeverity]           = useState("all");
  const [loading, setLoading]             = useState(true);
  const [err, setErr]                     = useState(null);

  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/countries")
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then(d  => { setCountries(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });

    fetch("https://disease.sh/v3/covid-19/all")
      .then(r => r.json())
      .then(setGlobalStats)
      .catch(() => {});
  }, []);

  let visible = [...countries];

  if (chosenCountry) {
    visible = visible.filter(c => c.country === chosenCountry);
  } else if (search.trim()) {
    visible = visible.filter(c =>
      c.country.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (severity !== "all") {
    visible = visible.filter(c =>
      getLabel(c.casesPerOneMillion).toLowerCase() === severity
    );
  }

  visible.sort((a, b) => (b.cases || 0) - (a.cases || 0));

  // max cases in visible list — used to scale bar widths
  const maxCases = visible.length > 0 ? (visible[0].cases || 1) : 1;

  const allNames = countries.map(c => c.country).sort();

  return (
    <div>

      {/* topbar */}
      <div className="topbar">
        <div className="logo">Covi<span>Dash</span></div>
        <div className="live-badge">
          <div className="dot" />
          disease.sh
        </div>
      </div>

      {/* hero */}
      <div className="hero">
        <div className="hero-text">
          <h1>COVID-19 Statistics</h1>
          <p>Cases, recoveries, and deaths across every country in the world.</p>
        </div>
      </div>

      {/* asymmetric stat strip */}
      {globalStats && (
        <div className="stat-strip">

          {/* big feature tile — total cases */}
          <div className="stat-tile big">
            <div className="tile-label">Total Cases Worldwide</div>
            <div className="tile-value xl" style={{ color: "#f87171" }}>
              {pretty(globalStats.cases)}
            </div>
            <div className="tile-sub">all time recorded cases</div>
          </div>

          {/* three smaller tiles */}
          <div className="stat-tile">
            <div className="tile-label">Recovered</div>
            <div className="tile-value md" style={{ color: "#34d399" }}>
              {pretty(globalStats.recovered)}
            </div>
            <div className="tile-sub">
              {globalStats.cases
                ? ((globalStats.recovered / globalStats.cases) * 100).toFixed(1) + "% recovery rate"
                : ""}
            </div>
          </div>

          <div className="stat-tile">
            <div className="tile-label">Deaths</div>
            <div className="tile-value md" style={{ color: "#9ca3af" }}>
              {pretty(globalStats.deaths)}
            </div>
            <div className="tile-sub">
              {globalStats.cases
                ? ((globalStats.deaths / globalStats.cases) * 100).toFixed(2) + "% fatality rate"
                : ""}
            </div>
          </div>

          <div className="stat-tile">
            <div className="tile-label">Active</div>
            <div className="tile-value md" style={{ color: "#38bdf8" }}>
              {pretty(globalStats.active)}
            </div>
            <div className="tile-sub">currently active cases</div>
          </div>

        </div>
      )}

      {/* toolbar */}
      <div className="toolbar">
        <div className="pills">
          {["all", "critical", "high", "moderate", "low"].map(s => (
            <button
              key={s}
              className={`pill ${severity === s ? "on" : ""}`}
              onClick={() => setSeverity(s)}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search country..."
          value={search}
          onChange={e => { setSearch(e.target.value); setChosenCountry(""); }}
        />

        <select
          value={chosenCountry}
          onChange={e => { setChosenCountry(e.target.value); setSearch(""); }}
        >
          <option value="">All countries</option>
          {allNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="view-btns">
          <button className={`vbtn ${view === "card" ? "on" : ""}`} onClick={() => setView("card")}>Card</button>
          <button className={`vbtn ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {/* meta row */}
      {!loading && (
        <div className="meta">
          <span>{visible.length} {visible.length === 1 ? "country" : "countries"}</span>
          <span>sorted by total cases ↓</span>
        </div>
      )}

      {err && <div className="empty" style={{ color: "#f87171" }}>Error: {err}</div>}

      {/* card view */}
      {view === "card" && (
        <div className="card-grid">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
            : visible.length === 0
            ? <div className="empty">no countries matched</div>
            : visible.map(c => (
                <Card
                  key={c.countryInfo?._id || c.country}
                  country={c}
                  maxCases={maxCases}
                />
              ))
          }
        </div>
      )}

      {/* table view */}
      {view === "table" && !loading && (
        <div className="table-wrap">
          {visible.length === 0 ? (
            <div className="empty">no countries matched</div>
          ) : (
            <div className="table-inner">
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Cases</th>
                    <th>Recovered</th>
                    <th>Deaths</th>
                    <th>Per Million</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => {
                    const color = getColor(c.casesPerOneMillion);
                    const label = getLabel(c.casesPerOneMillion);
                    return (
                      <tr key={c.countryInfo?._id || c.country}>
                        <td>
                          <img
                            src={c.countryInfo?.flag}
                            alt={c.country}
                            style={{ width: 20, height: 13, objectFit: "cover", borderRadius: 2, marginRight: 8, verticalAlign: "middle", border: "1px solid #222b3d" }}
                          />
                          {c.country}
                        </td>
                        <td style={{ color: "#f87171", fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>{pretty(c.cases)}</td>
                        <td style={{ color: "#34d399", fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>{pretty(c.recovered)}</td>
                        <td style={{ color: "#9ca3af", fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>{pretty(c.deaths)}</td>
                        <td style={{ fontFamily: "IBM Plex Mono, monospace", color: "#4b5675" }}>{pretty(c.casesPerOneMillion)}</td>
                        <td>
                          <span className="badge" style={{ color, background: color + "20" }}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="footer">© 2025 Aadya Singh — CoviDash</div>
    </div>
  );
}