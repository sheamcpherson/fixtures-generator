export function generateFixtures(teams, startMondayDate, isDoubleRoundRobin = false) {
  if (teams.length < 2) return [];

  const dayOffsets = {
    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4
  };

  function getExactMatchDate(baseMondayString, homeDayName) {
    const [year, month, day] = baseMondayString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const offset = dayOffsets[homeDayName] || 0;
    targetDate.setDate(targetDate.getDate() + offset);
    return targetDate;
  }

  function toLocalIsoString(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDisplayDate(dateObj) {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function getClubRoot(name) {
    return name
      .replace(/\b(A|B|C|1|2|3|I|II|III|First|Second|v|v1|v2|v3|Team)\b/gi, '')
      .trim()
      .toLowerCase();
  }

  // Build uniform roster base
  let list = [...teams];
  if (list.length % 2 !== 0) {
    list.push({ id: 'BYE', name: 'BYE', homeDay: 'Monday', blackouts: [] });
  }

  const numTeams = list.length;
  const singleRoundsCount = numTeams - 1;
  const totalRounds = isDoubleRoundRobin ? singleRoundsCount * 2 : singleRoundsCount;
  const matchesPerRound = numTeams / 2;

  const homeCounts = {};
  teams.forEach(t => { homeCounts[t.id] = 0; });
  homeCounts['BYE'] = 0;
  
  let roundPairingsPlan = [];
  let rotationList = [...list];

  // 1. Map pure pairings sequence framework
  for (let round = 1; round <= singleRoundsCount; round++) {
    const roundPairs = [];
    for (let i = 0; i < matchesPerRound; i++) {
      roundPairs.push({
        teamA: rotationList[i],
        teamB: rotationList[numTeams - 1 - i]
      });
    }
    roundPairingsPlan.push(roundPairs);
    rotationList.splice(1, 0, rotationList.pop());
  }

  // --- SISTER ROUND SWAPPING ENGINE ---
  // Identify which rounds in the plan contain sister vs sister matches
  const sisterRoundIndices = [];

  roundPairingsPlan.forEach((roundPairs, idx) => {
    const containsSisterMatch = roundPairs.some(pair => {
      if (pair.teamA.id === 'BYE' || pair.teamB.id === 'BYE') return false;
      return getClubRoot(pair.teamA.name) === getClubRoot(pair.teamB.name);
    });
    if (containsSisterMatch) {
      sisterRoundIndices.push(idx);
    }
  });

  // Extract the sister match rounds and move them to the front of Phase 1
  const sisterRounds = [];
  const standardRounds = [];

  roundPairingsPlan.forEach((roundPairs, idx) => {
    if (sisterRoundIndices.includes(idx)) {
      sisterRounds.push(roundPairs);
    } else {
      standardRounds.push(roundPairs);
    }
  });

  // Re-stitch Phase 1: Sister rounds now occupy Round 1, Round 2, etc.
  roundPairingsPlan = [...sisterRounds, ...standardRounds];

  // Duplicate for Phase 2 if running a Double Round-Robin
  if (isDoubleRoundRobin) {
    const returnLegs = roundPairingsPlan.map(roundPairs => 
      roundPairs.map(pair => ({ teamA: pair.teamA, teamB: pair.teamB }))
    );
    roundPairingsPlan = [...roundPairingsPlan, ...returnLegs];
  }

  // 2. Generate final calendar dates and build schedule array
  const schedule = [];
  const globalTeamDateRegistry = {};

  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = [];
    const [sYear, sMonth, sDay] = startMondayDate.split('-').map(Number);
    const roundBaseMonday = new Date(sYear, sMonth - 1, sDay);
    roundBaseMonday.setDate(roundBaseMonday.getDate() + (round - 1) * 7);

    const currentRoundPairs = roundPairingsPlan[round - 1];
    const isReturnLeg = round > singleRoundsCount;

    for (let i = 0; i < currentRoundPairs.length; i++) {
      const { teamA, teamB } = currentRoundPairs[i];
      if (teamA.id === 'BYE' || teamB.id === 'BYE') continue;

      let home, away;

      if (!isReturnLeg) {
        if (homeCounts[teamA.id] < homeCounts[teamB.id]) {
          home = teamA; away = teamB;
        } else if (homeCounts[teamB.id] < homeCounts[teamA.id]) {
          home = teamB; away = teamA;
        } else {
          if (round % 2 === 0) { home = teamA; away = teamB; }
          else { home = teamB; away = teamA; }
        }
      } else {
        const phase1RoundIndex = (round - 1) % singleRoundsCount;
        const phase1Match = schedule[phase1RoundIndex].matches[i];
        
        if (phase1Match.home.id === teamA.id) {
          home = teamB; away = teamA;
        } else {
          home = teamA; away = teamB;
        }
      }

      let currentMatchWeekMonday = new Date(roundBaseMonday);
      let matchResolved = false;
      let exactMatchDateObj = null;
      let safetyCheck = 52;

      while (!matchResolved && safetyCheck > 0) {
        safetyCheck--;
        const currentWeekStr = toLocalIsoString(currentMatchWeekMonday);
        exactMatchDateObj = getExactMatchDate(currentWeekStr, home.homeDay);
        const exactIsoString = toLocalIsoString(exactMatchDateObj);

        const homeBlackouts = home.blackouts || [];
        const awayBlackouts = away.blackouts || [];

        if (homeBlackouts.includes(exactIsoString) || awayBlackouts.includes(exactIsoString)) {
          currentMatchWeekMonday.setDate(currentMatchWeekMonday.getDate() + 7);
        } else {
          matchResolved = true;
        }
      }

      homeCounts[home.id]++;
      const matchIsoDate = toLocalIsoString(exactMatchDateObj);

      globalTeamDateRegistry[`${home.id}_${matchIsoDate}`] = (globalTeamDateRegistry[`${home.id}_${matchIsoDate}`] || 0) + 1;
      globalTeamDateRegistry[`${away.id}_${matchIsoDate}`] = (globalTeamDateRegistry[`${away.id}_${matchIsoDate}`] || 0) + 1;

      roundMatches.push({
        id: `r${round}-m${i}-${crypto.randomUUID().slice(0, 4)}`,
        home: home,
        away: away,
        date: formatDisplayDate(exactMatchDateObj),
        isoDate: matchIsoDate
      });
    }

    if (roundMatches.length > 0) {
      schedule.push({ round: round, matches: roundMatches });
    }
  }

  // 3. Soft error auditing pass
  // --- ADVANCED AUDITING PASS ---
  // 1. Initialize metadata ledger to track match distributions per team
  const totalMatchesPerTeam = {};
  const preNewYearMatchesPerTeam = {};
  
  teams.forEach(t => {
    totalMatchesPerTeam[t.id] = 0;
    preNewYearMatchesPerTeam[t.id] = 0;
  });

  // Parse the season year from your league start date (e.g., "2026-09-14" -> 2026)
  const leagueStartYear = new Date(startMondayDate).getFullYear();

  // First pass: Calculate volume distributions
  schedule.forEach(roundObj => {
    roundObj.matches.forEach(match => {
      if (match.home.id === 'BYE' || match.away.id === 'BYE') return;

      // Increment total match counters
      totalMatchesPerTeam[match.home.id]++;
      totalMatchesPerTeam[match.away.id]++;

      // Extract match calendar year from its resolved isoDate string
      const matchYear = new Date(match.isoDate).getFullYear();
      
      // If the match happens within the opening segment of the season split (before Jan 1st)
      if (matchYear === leagueStartYear) {
        preNewYearMatchesPerTeam[match.home.id]++;
        preNewYearMatchesPerTeam[match.away.id]++;
      }
    });
  });

  // Second pass: Stamp soft errors onto the match profiles
  schedule.forEach(roundObj => {
    roundObj.matches.forEach(match => {
      const homeBlackouts = match.home.blackouts || [];
      const awayBlackouts = match.away.blackouts || [];
      const dateKey = match.isoDate;
      const errors = [];

      // A. Standard overlap validations
      if (homeBlackouts.includes(dateKey)) errors.push(`${match.home.name} Blackout`);
      if (awayBlackouts.includes(dateKey)) errors.push(`${match.away.name} Blackout`);
      if (globalTeamDateRegistry[`${match.home.id}_${dateKey}`] > 1) errors.push(`${match.home.name} Double Booked`);
      if (globalTeamDateRegistry[`${match.away.id}_${dateKey}`] > 1) errors.push(`${match.away.name} Double Booked`);

      // B. 33% Winter Threshold Verification
      // Check Home Team
      if (match.home.id !== 'BYE') {
        const homePct = (preNewYearMatchesPerTeam[match.home.id] / totalMatchesPerTeam[match.home.id]) * 100;
        if (homePct < 33.3) {
          errors.push(`${match.home.name} Winter Pace low (${Math.round(homePct)}%)`);
        }
      }
      // Check Away Team
      if (match.away.id !== 'BYE') {
        const awayPct = (preNewYearMatchesPerTeam[match.away.id] / totalMatchesPerTeam[match.away.id]) * 100;
        if (awayPct < 33.3) {
          errors.push(`${match.away.name} Winter Pace low (${Math.round(awayPct)}%)`);
        }
      }

      match.hasSoftError = errors.length > 0;
      match.softErrorMessage = errors.join(', ');
    });
  });

  return schedule;
}