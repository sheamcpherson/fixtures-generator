import { useState } from 'react';

function TeamList({ teams, setTeams }) {
  // Track which team's blackout calendar drawer is open
  const [activeManagerId, setActiveManagerId] = useState(null);
  const [dateInput, setDateInput] = useState('');

  const handleDeleteTeam = (idToDelete) => {
    setTeams(teams.filter(team => team.id !== idToDelete));
    if (activeManagerId === idToDelete) setActiveManagerId(null);
  };

  const addBlackoutDate = (teamId) => {
    if (!dateInput) return;

    setTeams(teams.map(team => {
      if (team.id !== teamId) return team;
      const currentBlackouts = team.blackouts || [];
      // Avoid duplicate entries
      if (currentBlackouts.includes(dateInput)) return team;
      
      return {
        ...team,
        blackouts: [...currentBlackouts, dateInput].sort()
      };
    }));

    setDateInput('');
  };

  const removeBlackoutDate = (teamId, dateToRemove) => {
    setTeams(teams.map(team => {
      if (team.id !== teamId) return team;
      return {
        ...team,
        blackouts: (team.blackouts || []).filter(d => d !== dateToRemove)
      };
    }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 pb-1 border-b border-slate-200">
        <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>📋</span> Club Directory & Blackouts
        </h2>
        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {teams.length} Clubs
        </span>
      </div>

      {teams.length === 0 ? (
        <div className="text-center text-xs text-slate-400 italic py-6 my-auto">
          Roster index empty.
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
          {teams.map((team) => {
            const numBlackouts = team.blackouts?.length || 0;
            const isManaging = activeManagerId === team.id;

            return (
              <div key={team.id} className="py-2.5 space-y-2">
                
                {/* Team Info Header Bar */}
                <div className="flex justify-between items-start text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900 block truncate">{team.name}</span>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                      <span>🏠 {team.homeDay}s</span>
                      <span>•</span>
                      <button 
                        type="button" 
                        onClick={() => setActiveManagerId(isManaging ? null : team.id)}
                        className={`font-semibold hover:underline ${numBlackouts > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}
                      >
                        ⚠️ {numBlackouts} Blackout{numBlackouts !== 1 && 's'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-slate-300 hover:text-rose-600 font-bold px-1 transition text-sm"
                    title="Remove Team"
                  >
                    ✕
                  </button>
                </div>

                {/* Collapsible Dropdown Calendar Management Interface */}
                {/* Inside src/components/TeamList.jsx */}
                    {isManaging && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2 text-[11px] animate-fadeIn">
                        <div className="font-bold text-slate-600 uppercase text-[9px] tracking-wide">
                        Add Specific Date to Avoid: {/* Changed from Unplayable Week */}
                        </div>
                        
                        <div className="flex gap-1.5">
                        <input
                            type="date"
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                            className="flex-grow bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => addBlackoutDate(team.id)}
                            className="bg-slate-800 text-white font-bold px-2.5 py-1 rounded hover:bg-slate-700 transition"
                        >
                            Block
                        </button>
                        </div>

                    {/* Active Blackout Badges List */}
                    {numBlackouts > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                        {team.blackouts.map(dateStr => {
                          // Format date slightly cleaner for the micro badge display (e.g. "Oct 12")
                          const badgeLabel = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                          return (
                            <span 
                              key={dateStr}
                              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-1.5 py-0.5 rounded text-[10px]"
                            >
                              {badgeLabel}
                              <button 
                                type="button" 
                                onClick={() => removeBlackoutDate(team.id, dateStr)} 
                                className="text-amber-500 hover:text-amber-900 font-black pl-0.5"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamList;