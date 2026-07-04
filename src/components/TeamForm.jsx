import { useState } from 'react';

function TeamForm({ teams, setTeams }) {
  const [teamName, setTeamName] = useState('');
  const [homeDay, setHomeDay] = useState('Monday');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const newTeam = {
      id: crypto.randomUUID(),
      name: teamName.trim(),
      homeDay: homeDay
    };

    setTeams([...teams, newTeam]);
    setTeamName('');
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between space-y-3">
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>➕</span> Add New Club
        </h2>
        <div>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., Marshall Attack CC"
            className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none transition"
            required
          />
        </div>

        <div>
          <select
            value={homeDay}
            onChange={(e) => setHomeDay(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:outline-none cursor-pointer font-medium text-slate-600"
          >
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>🏠 {day}s</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 rounded-lg text-xs transition"
      >
        Confirm Club
      </button>
    </form>
  );
}

export default TeamForm;