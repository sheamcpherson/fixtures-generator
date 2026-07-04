import { useState } from 'react';
import TeamForm from './components/TeamForm';
import TeamList from './components/TeamList';
import FixtureGrid from './components/FixtureGrid';
import { generateFixtures } from './utils/scheduler';
import { mockTeams } from './data/mockTeams';

function App() {
  const [teams, setTeams] = useState(mockTeams);
  const [fixtures, setFixtures] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  // New State Toggle Configuration Control
  const [isDoubleRound, setIsDoubleRound] = useState(false);

  const handleGenerate = () => {
    // Pass state switch boolean through to the updated scheduling loop function
    const generatedSchedule = generateFixtures(teams, startDate, isDoubleRound);
    setFixtures(generatedSchedule);
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-white border-b border-slate-200 py-6 px-6 mb-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">♟️</span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Chess League Scheduler
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Dynamic Round-Robin Fixture Engine
              </p>
            </div>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-1 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
            Roster Status: Ready
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Add New Club */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between min-h-[240px]">
            <TeamForm teams={teams} setTeams={setTeams} />
          </div>

          {/* Card 2: Configuration Options & Double Toggle Switch */}
          <div className="bg-slate-100/60 rounded-xl border border-slate-200 p-5 flex flex-col justify-between min-h-[240px]">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📅</span>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Schedule Rules
                  </h3>
                </div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  League Start Date (Monday)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm transition"
                />
              </div>

              {/* Toggle Selector Switch Component */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-500 mb-2">Competition Structure</span>
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsDoubleRound(false)}
                    className={`flex-1 text-center py-1.5 rounded-md font-bold text-[11px] uppercase tracking-wide transition ${
                      !isDoubleRound 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Single R-R
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDoubleRound(true)}
                    className={`flex-1 text-center py-1.5 rounded-md font-bold text-[11px] uppercase tracking-wide transition ${
                      isDoubleRound 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Double R-R
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleGenerate}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transform active:scale-[0.99] transition text-xs uppercase tracking-wider mt-4"
            >
              ⚡ Generate Schedule Tree
            </button>
          </div>

          {/* Card 3: Club Directory Roster Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col min-h-[240px] max-h-[500px]">
            <TeamList teams={teams} setTeams={setTeams} />
          </div>

        </div>

        {/* Bottom Section: Wide Plan Grid */}
        <div className="border-t border-slate-200/60 pt-6">
          {fixtures.length > 0 ? (
            <FixtureGrid fixtures={fixtures} setFixtures={setFixtures} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-xs">
              <span className="text-3xl text-slate-300 mb-2">🗺️</span>
              <h3 className="text-sm font-bold text-slate-700">Roster System Standby</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Confirm your parameters in the panels above and click generate to process the team calendars.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;