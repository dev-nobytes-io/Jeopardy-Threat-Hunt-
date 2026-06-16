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
          btn.textContent = "✓ " + earned + " pts";
          btn.disabled = true;
        } else {
          btn.textContent = points + " pts" + (answeredCount > 0 ? " (" + answeredCount + "/" + total + ")" : "");
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

  function buildTaskRow(categoryId, tier, functionId, task, fn, tierIdx, subPoints, gradedEntry) {
    const row = document.createElement("div");
    row.className = "task-row";

    const header = document.createElement("div");
    header.className = "task-header";

    const fnLabel = document.createElement("span");
    fnLabel.className = "task-function";
    fnLabel.innerHTML = fn.label + ' <span class="task-model">(' + fn.model + ")</span>";

    const pts = document.createElement("span");
    pts.className = "task-points";
    pts.textContent = subPoints + " pts";

    const status = document.createElement("span");
    status.className = "task-status";

    header.appendChild(fnLabel);
    header.appendChild(pts);
    header.appendChild(status);

    const clue = document.createElement("div");
    clue.className = "task-clue";
    clue.textContent = task.clue;

    const answer = document.createElement("div");
    answer.className = "task-answer";
    answer.textContent = task.answer;
    answer.hidden = true;

    const level = document.createElement("div");
    level.className = "task-level";
    level.textContent = "Maturity level: " + fn.tier_to_level[tierIdx];
    level.hidden = true;

    const revealBtn = document.createElement("button");
    revealBtn.className = "task-reveal-btn";
    revealBtn.textContent = "Reveal Answer";

    const grading = document.createElement("div");
    grading.className = "task-grading";
    grading.hidden = true;

    const label = document.createElement("label");
    label.textContent = "Award to:";

    const select = document.createElement("select");
    select.className = "task-team-select";
    state.teams.forEach((team, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = team.name;
      select.appendChild(opt);
    });

    const correctBtn = document.createElement("button");
    correctBtn.className = "task-correct-btn";
    correctBtn.textContent = "Correct";

    const incorrectBtn = document.createElement("button");
    incorrectBtn.className = "task-incorrect-btn";
    incorrectBtn.textContent = "Incorrect / Skip";

    grading.appendChild(label);
    grading.appendChild(select);
    grading.appendChild(correctBtn);
    grading.appendChild(incorrectBtn);

    row.appendChild(header);
    row.appendChild(clue);
    row.appendChild(revealBtn);
    row.appendChild(answer);
    row.appendChild(level);
    row.appendChild(grading);

    function applyGraded(correct) {
      row.classList.add("graded");
      answer.hidden = false;
      level.hidden = false;
      revealBtn.hidden = true;
      grading.hidden = true;
      status.textContent = correct ? "✓" : "✗";
    }

    if (gradedEntry) {
      applyGraded(gradedEntry.correct);
    } else {
      revealBtn.addEventListener("click", () => {
        answer.hidden = false;
        level.hidden = false;
        revealBtn.hidden = true;
        grading.hidden = state.teams.length === 0;
      });

      const doGrade = (correct) => {
        const key = cellKey(categoryId, tier);
        if (!state.answered[key]) state.answered[key] = { tasks: {} };
        state.answered[key].tasks[functionId] = { correct: correct };

        if (correct) {
          const teamIdx = select.value;
          if (teamIdx !== "" && state.teams[teamIdx]) {
            state.teams[teamIdx].score += subPoints;
          }
        }

        saveState();
        renderTeams();
        renderBody();
        applyGraded(correct);
      };

      correctBtn.addEventListener("click", () => doGrade(true));
      incorrectBtn.addEventListener("click", () => doGrade(false));
    }

    return row;
  }

  function openModal(categoryId, tier) {
    const category = findCategory(categoryId);
    const cell = findCell(categoryId, tier);
    const tierIdx = tier - 1;
    const total = campaign.functions.length;
    const points = cellPoints(category, tierIdx);
    const subPoints = Math.round(points / total);
    const { tasks } = cellProgress(categoryId, tier);

    document.getElementById("modal-category").textContent =
      category.icon + " " + category.label + " — " + category.hunt_type + " (" + category.mitre + ")";
    document.getElementById("modal-points").textContent =
      points + " pts total — " + subPoints + " pts per task";

    const tasksEl = document.getElementById("modal-tasks");
    tasksEl.innerHTML = "";
    campaign.functions.forEach(functionId => {
      const task = cell.tasks[functionId];
      const fn = functions[functionId];
      const gradedEntry = tasks[functionId] || null;
      tasksEl.appendChild(
        buildTaskRow(categoryId, tier, functionId, task, fn, tierIdx, subPoints, gradedEntry)
      );
    });

    document.getElementById("modal-backdrop").classList.add("open");
  }

  function closeModal() {
    document.getElementById("modal-backdrop").classList.remove("open");
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

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("show-summary-btn").addEventListener("click", showSummary);
  }

  init();
})();
