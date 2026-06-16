(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("campaign") || "class-1-schema";
  const storageKey = "hunt-jeopardy:" + campaignId;

  let functions = null;
  let campaign = null;
  let state = null;

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

  function cellKey(category, tier) {
    return category + ":" + tier;
  }

  function findCell(category, tier) {
    return campaign.cells.find(c => c.category === category && c.tier === tier);
  }

  function renderHead() {
    const head = document.getElementById("board-head");
    const row = document.createElement("tr");
    campaign.categories.forEach(catId => {
      const fn = functions[catId];
      const th = document.createElement("th");
      th.innerHTML = fn.label + '<span class="model-name">' + fn.model + "</span>";
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
      campaign.categories.forEach(catId => {
        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.className = "cell-btn";
        const key = cellKey(catId, tier);
        const answered = state.answered[key];
        if (answered) {
          btn.classList.add("used");
          btn.textContent = answered.correct ? "✓" : "—";
          btn.disabled = true;
        } else {
          btn.textContent = "$" + campaign.points[tierIdx];
          btn.addEventListener("click", () => openModal(catId, tier));
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

  let activeCell = null;

  function openModal(catId, tier) {
    const cell = findCell(catId, tier);
    const fn = functions[catId];
    activeCell = { catId, tier, points: campaign.points[tier - 1] };

    document.getElementById("modal-category").textContent = fn.label;
    document.getElementById("modal-points").textContent = "$" + activeCell.points;
    document.getElementById("modal-clue").textContent = cell.clue;

    const answerEl = document.getElementById("modal-answer");
    const levelEl = document.getElementById("modal-level");
    const gradingEl = document.getElementById("modal-grading");
    answerEl.hidden = true;
    levelEl.hidden = true;
    gradingEl.hidden = true;
    answerEl.textContent = cell.answer;
    levelEl.textContent = "Maturity level: " + fn.tier_to_level[tier - 1];

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
    const key = cellKey(activeCell.catId, activeCell.tier);
    state.answered[key] = { correct: correct, tier: activeCell.tier };

    if (correct) {
      const teamSelect = document.getElementById("grading-team");
      const teamIdx = teamSelect.value;
      if (teamIdx !== "" && state.teams[teamIdx]) {
        state.teams[teamIdx].score += activeCell.points;
      }
    }

    saveState();
    renderTeams();
    renderBody();
    closeModal();
  }

  function showSummary() {
    const out = document.getElementById("summary-output");
    out.innerHTML = "";
    campaign.categories.forEach(catId => {
      const fn = functions[catId];
      let highestCorrectTier = 0;
      for (let tier = 1; tier <= campaign.points.length; tier++) {
        const a = state.answered[cellKey(catId, tier)];
        if (a && a.correct) highestCorrectTier = tier;
      }
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
