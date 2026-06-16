(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("campaign") || "class-1-schema";
  const storageKey = "hunt-jeopardy:" + campaignId;

  let functions = null;
  let campaign = null;
  let state = null;
  let activeCell = null; // { categoryId, tier, functionId, subPoints }

  function loadState() {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through */ }
    }
    return { teams: [], answered: {} };
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function cellKey(categoryId, tier) {
    return categoryId + ":" + tier;
  }

  function findCategory(categoryId) {
    return campaign.categories.find(c => c.id === categoryId);
  }

  function findCell(categoryId, tier) {
    return campaign.cells.find(c => c.category === categoryId && c.tier === tier);
  }

  function cellPoints(category, tierIdx) {
    return campaign.points[tierIdx] * category.multiplier;
  }

  function cellProgress(categoryId, tier) {
    const entry = state.answered[cellKey(categoryId, tier)];
    const tasks = entry ? entry.tasks : {};
    return { tasks, answeredCount: Object.keys(tasks).length };
  }

  function nextUnansweredFunction(categoryId, tier) {
    const { tasks } = cellProgress(categoryId, tier);
    return campaign.functions.find(fid => !(fid in tasks)) || null;
  }

  function renderHead() {
    const head = document.getElementById("board-head");
    head.innerHTML = "";
    const row = document.createElement("tr");
    campaign.categories.forEach(cat => {
      const th = document.createElement("th");
      th.innerHTML = cat.icon + " " + cat.label +
        '<span class="model-name">' + cat.hunt_type + " (" + cat.mitre + ")</span>";
      row.appendChild(th);
    });
    head.appendChild(row);
  }

  function renderBody() {
    const body = document.getElementById("board-body");
    body.innerHTML = "";
    for (let tierIdx = 0; tierIdx < campaign.points.length; tierIdx++) {
      const tier = tierIdx + 1;
      const row = document.createElement("tr");
      campaign.categories.forEach(cat => {
        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.className = "cell-btn";
        const points = cellPoints(cat, tierIdx);
        const { tasks, answeredCount } = cellProgress(cat.id, tier);
        const total = campaign.functions.length;

        if (answeredCount === total) {
          const subPoints = Math.round(points / total);
          const earned = campaign.functions.reduce(
            (sum, fid) => sum + (tasks[fid].correct ? subPoints : 0), 0
          );
          btn.classList.add("used");
          btn.textContent = "✓ $" + earned;
          btn.disabled = true;
        } else {
          btn.textContent = "$" + points + (answeredCount > 0 ? " (" + answeredCount + "/" + total + ")" : "");
          btn.addEventListener("click", () => openModal(cat.id, tier));
        }
        td.appendChild(btn);
        row.appendChild(td);
      });
      body.appendChild(row);
    }
  }

  function renderTeams() {
    const out = document.getElementById("teams-scores");
    out.innerHTML = "";
    state.teams.forEach(team => {
      const chip = document.createElement("div");
      chip.className = "team-chip";
      chip.textContent = team.name + ": " + team.score;
      out.appendChild(chip);
    });
  }

  function addTeam(name) {
    if (!name.trim()) return;
    state.teams.push({ name: name.trim(), score: 0 });
    saveState();
    renderTeams();
  }

  function openModal(categoryId, tier) {
    const functionId = nextUnansweredFunction(categoryId, tier);
    if (!functionId) return;

    const category = findCategory(categoryId);
    const cell = findCell(categoryId, tier);
    const task = cell.tasks[functionId];
    const fn = functions[functionId];
    const tierIdx = tier - 1;
    const total = campaign.functions.length;
    const subPoints = Math.round(cellPoints(category, tierIdx) / total);
    const stepIdx = campaign.functions.indexOf(functionId);

    activeCell = { categoryId, tier, functionId, subPoints };

    document.getElementById("modal-category").textContent =
      category.icon + " " + category.label + " — " + category.hunt_type + " (" + category.mitre + ")";
    document.getElementById("modal-points").textContent = "$" + subPoints;
    document.getElementById("modal-progress").textContent =
      "Task " + (stepIdx + 1) + " of " + total + " — " + fn.label + " (" + fn.model + ")";
    document.getElementById("modal-clue").textContent = task.clue;

    const answerEl = document.getElementById("modal-answer");
    const levelEl = document.getElementById("modal-level");
    const gradingEl = document.getElementById("modal-grading");
    answerEl.hidden = true;
    levelEl.hidden = true;
    gradingEl.hidden = true;
    answerEl.textContent = task.answer;
    levelEl.textContent = "Maturity level: " + fn.tier_to_level[tierIdx];

    const teamSelect = document.getElementById("grading-team");
    teamSelect.innerHTML = "";
    state.teams.forEach((team, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = team.name;
      teamSelect.appendChild(opt);
    });

    document.getElementById("modal-backdrop").classList.add("open");
  }

  function closeModal() {
    document.getElementById("modal-backdrop").classList.remove("open");
    activeCell = null;
  }

  function reveal() {
    document.getElementById("modal-answer").hidden = false;
    document.getElementById("modal-level").hidden = false;
    document.getElementById("modal-grading").hidden = state.teams.length === 0;
  }

  function grade(correct) {
    if (!activeCell) return;
    const { categoryId, tier, functionId, subPoints } = activeCell;
    const key = cellKey(categoryId, tier);
    if (!state.answered[key]) state.answered[key] = { tasks: {} };
    state.answered[key].tasks[functionId] = { correct: correct };

    if (correct) {
      const teamSelect = document.getElementById("grading-team");
      const teamIdx = teamSelect.value;
      if (teamIdx !== "" && state.teams[teamIdx]) {
        state.teams[teamIdx].score += subPoints;
      }
    }

    saveState();
    renderTeams();
    renderBody();

    const next = nextUnansweredFunction(categoryId, tier);
    if (next) {
      openModal(categoryId, tier);
    } else {
      closeModal();
    }
  }

  function showSummary() {
    const out = document.getElementById("summary-output");
    out.innerHTML = "";
    campaign.functions.forEach(functionId => {
      const fn = functions[functionId];
      let highestCorrectTier = 0;
      campaign.categories.forEach(cat => {
        for (let tier = 1; tier <= campaign.points.length; tier++) {
          const entry = state.answered[cellKey(cat.id, tier)];
          const task = entry && entry.tasks[functionId];
          if (task && task.correct && tier > highestCorrectTier) highestCorrectTier = tier;
        }
      });
      const levelLabel = highestCorrectTier > 0
        ? fn.tier_to_level[highestCorrectTier - 1]
        : "Not yet assessed";
      const row = document.createElement("div");
      row.className = "summary-row";
      row.innerHTML = "<strong>" + fn.label + "</strong><span>" + levelLabel + "</span>";
      out.appendChild(row);
    });
  }

  async function init() {
    const [fnRes, campRes] = await Promise.all([
      fetch("data/functions.json"),
      fetch("data/campaigns/" + campaignId + ".json")
    ]);
    functions = await fnRes.json();
    campaign = await campRes.json();
    state = loadState();

    document.getElementById("campaign-title").textContent =
      campaign.title + " — " + campaign.subtitle;

    renderHead();
    renderBody();
    renderTeams();

    document.getElementById("add-team-btn").addEventListener("click", () => {
      const input = document.getElementById("new-team-name");
      addTeam(input.value);
      input.value = "";
    });

    document.getElementById("reveal-btn").addEventListener("click", reveal);
    document.getElementById("mark-correct-btn").addEventListener("click", () => grade(true));
    document.getElementById("mark-incorrect-btn").addEventListener("click", () => grade(false));
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("show-summary-btn").addEventListener("click", showSummary);
  }

  init();
})();
