import { useState } from 'react';

function FixtureGrid({ fixtures, setFixtures, requireWinterPace }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');

  if (fixtures.length === 0) return null;

  // 1. Gather all unique teams to build the navigation tabs
  const allTeamsMap = new Map();
  fixtures.forEach(roundObj => {
    roundObj.matches.forEach(match => {
      allTeamsMap.set(match.home.id, match.home);
      allTeamsMap.set(match.away.id, match.away);
    });
  });
  const uniqueTeams = Array.from(allTeamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const activeTeamId = selectedTeamId || uniqueTeams[0]?.id;

  // 2. Extract matches for the active team
  const teamMatches = [];
  fixtures.forEach(roundObj => {
    roundObj.matches.forEach(match => {
      if (match.home.id === activeTeamId || match.away.id === activeTeamId) {
        teamMatches.push({
          roundId: roundObj.round,
          ...match
        });
      }
    });
  });

  // --- DYNAMIC CHRONOLOGICAL SORT PASS ---
  // Sort fixtures purely by calendar timeline order instead of rigid Round IDs
  teamMatches.sort((a, b) => {
    const dateA = new Date(a.isoDate);
    const dateB = new Date(b.isoDate);
    return dateA - dateB;
  });

  // Handle inline calendar adjustments and run real-time audits
  const handleInlineDateChange = (roundId, matchId, newDateString) => {
    if (!newDateString) return;

    const [year, month, day] = newDateString.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    
    const formattedDisplayDate = parsedDate.toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    });

    let updatedFixtures = fixtures.map(roundObj => {
      if (roundObj.round !== roundId) return roundObj;

      return {
        ...roundObj,
        matches: roundObj.matches.map(m => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            date: formattedDisplayDate,
            isoDate: newDateString
          };
        })
      };
    });

    // --- REALTIME RE-AUDIT PROCESS ---
    const globalTeamDateRegistry = {};
    const totalMatchesPerTeam = {};
    const preNewYearMatchesPerTeam = {};

    const sampleIso = updatedFixtures[0]?.matches[0]?.isoDate || '2026-09-01';
    const leagueStartYear = new Date(sampleIso).getFullYear();

    uniqueTeams.forEach(t => {
      totalMatchesPerTeam[t.id] = 0;
      preNewYearMatchesPerTeam[t.id] = 0;
    });

    updatedFixtures.forEach(r => {
      r.matches.forEach(m => {
        globalTeamDateRegistry[`${m.home.id}_${m.isoDate}`] = (globalTeamDateRegistry[`${m.home.id}_${m.isoDate}`] || 0) + 1;
        globalTeamDateRegistry[`${m.away.id}_${m.isoDate}`] = (globalTeamDateRegistry[`${m.away.id}_${m.isoDate}`] || 0) + 1;

        totalMatchesPerTeam[m.home.id] = (totalMatchesPerTeam[m.home.id] || 0) + 1;
        totalMatchesPerTeam[m.away.id] = (totalMatchesPerTeam[m.away.id] || 0) + 1;

        const matchYear = new Date(m.isoDate).getFullYear();
        if (matchYear === leagueStartYear) {
          preNewYearMatchesPerTeam[m.home.id] = (preNewYearMatchesPerTeam[m.home.id] || 0) + 1;
          preNewYearMatchesPerTeam[m.away.id] = (preNewYearMatchesPerTeam[m.away.id] || 0) + 1;
        }
      });
    });

    updatedFixtures = updatedFixtures.map(r => ({
      ...r,
      matches: r.matches.map(m => {
        const homeBlackouts = m.home.blackouts || [];
        const awayBlackouts = m.away.blackouts || [];
        const errors = [];

        if (homeBlackouts.includes(m.isoDate)) errors.push(`${m.home.name} Blocked`);
        if (awayBlackouts.includes(m.isoDate)) errors.push(`${m.away.name} Blocked`);
        
        if (globalTeamDateRegistry[`${m.home.id}_${m.isoDate}`] > 1) errors.push(`${m.home.name} Double Booked`);
        if (globalTeamDateRegistry[`${m.away.id}_${m.isoDate}`] > 1) errors.push(`${m.away.name} Double Booked`);

        if (requireWinterPace) {
          const homePct = (preNewYearMatchesPerTeam[m.home.id] / totalMatchesPerTeam[m.home.id]) * 100;
          if (homePct < 33.3) errors.push(`${m.home.name} Winter Pace low (${Math.round(homePct)}%)`);

          const awayPct = (preNewYearMatchesPerTeam[m.away.id] / totalMatchesPerTeam[m.away.id]) * 100;
          if (awayPct < 33.3) errors.push(`${m.away.name} Winter Pace low (${Math.round(awayPct)}%)`);
        }

        return {
          ...m,
          hasSoftError: errors.length > 0,
          softErrorMessage: errors.join(', ')
        };
      })
    }));

    setFixtures(updatedFixtures);
  };

  const convertToInputDateFormat = (dateString) => {
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return '';
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xs font-black text-slate-700 tracking-wide uppercase">
            🎯 Team Fixtures
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Select a club below to view their fixtures</span>
        </div>
        
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap gap-2">
            {uniqueTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition duration-150 border ${
                  activeTeamId === team.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {teamMatches.map((match) => {
            const isHome = match.home.id === activeTeamId;
            const opponent = isHome ? match.away : match.home;
            const dayName = match.date.split(',')[0];

            return (
              <div 
                key={match.id} 
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  match.hasSoftError ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/30'
                }`}
              >
                
                <div className="flex items-center gap-3 min-w-[280px]">
                  <div className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg border shadow-xs ${
                    match.hasSoftError 
                      ? 'bg-amber-500 border-amber-600 text-white' 
                      : 'bg-slate-100 border-slate-200/60 text-slate-700'
                  }`}>
                    <span className={`text-[10px] uppercase font-black tracking-wider leading-none ${match.hasSoftError ? 'text-amber-100' : 'text-slate-400'}`}>
                      {dayName || "TBD"}
                    </span>
                    <span className="text-xs font-bold mt-0.5">
                      Rnd {match.roundId}
                    </span>
                  </div>
                  
                  <div>
                    <input
                      type="date"
                      value={convertToInputDateFormat(match.date)}
                      onChange={(e) => handleInlineDateChange(match.roundId, match.id, e.target.value)}
                      className="font-bold text-slate-900 text-xs border border-slate-200 px-2 py-1 rounded-md bg-white shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-none transition cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5 px-1">Reschedule game date</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-grow sm:justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">vs</span>
                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                      {opponent.name}
                    </span>
                  </div>
                  
                  {match.hasSoftError && (
                    <span className="sm:ml-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                      ⚠️ {match.softErrorMessage}
                    </span>
                  )}
                </div>

                <div className="flex items-center md:justify-end min-w-[120px]">
                  {isHome ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Home
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 font-medium px-3 py-1 rounded-full text-xs">
                      Away
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FixtureGrid;