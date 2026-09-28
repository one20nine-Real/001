// Supabase project settings can be set in this file. The public anon key is safe to use
// in a browser when Row Level Security is enabled for every exposed table.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const seedTeam = [
  { id: "minseo", name: "김민서", regions: ["강남", "경기"], solutions: ["Salesforce", "HubSpot"], color: "#e4eee7", ink: "#47715c", role: "admin", active: 0 },
  { id: "jiho", name: "박지호", regions: ["강북", "인천"], solutions: ["Salesforce", "Microsoft Dynamics 365"], team: "DXI 1팀", color: "#e9eaf4", ink: "#676b9c", role: "sa", active: 0 },
  { id: "seoyeon", name: "이서연", regions: ["강남", "경기", "인천"], solutions: ["HubSpot", "Salesforce"], team: "DXI 2팀", color: "#f4ebe3", ink: "#9b7150", role: "sa", active: 0 },
  { id: "doyun", name: "최도윤", regions: ["부산", "대구", "대전", "광주"], solutions: ["SAP", "Oracle"], team: "BS SA팀", color: "#e7eef3", ink: "#5b7b96", role: "sa", active: 0 },
  { id: "sales1", name: "정가영", regions: [], team: "강남 1팀", color: "#eaf1eb", ink: "#528069", role: "sales", active: 0 },
];
const seedLeads = [
  { id: "l1", company: "브릭앤코", contact: "정하린", phone: "010-2931-1840", region: "강북", source: "웹사이트", created_by: "sales1", assignee: "jiho", status: "contacted", created_at: "2026-09-28", note: "브랜드 사이트 리뉴얼 문의" },
  { id: "l2", company: "모노랩스", contact: "윤태경", phone: "010-8402-3011", region: "경기", source: "소개", created_by: "sales1", assignee: "seoyeon", status: "proposal", created_at: "2026-09-28", note: "신규 서비스 랜딩 페이지" },
  { id: "l3", company: "에버그린 스튜디오", contact: "김예진", phone: "010-5026-9720", region: "강남", source: "검색 광고", created_by: "sales1", assignee: null, status: "new", created_at: "2026-09-27", note: "" },
  { id: "l4", company: "오늘의 정원", contact: "박선우", phone: "010-2239-7710", region: "인천", source: "파트너", created_by: "sales1", assignee: "jiho", status: "new", created_at: "2026-09-27", note: "" },
  { id: "l5", company: "프롬데이", contact: "오지민", phone: "010-8421-0651", region: "부산", source: "웹사이트", created_by: "sales1", assignee: null, status: "new", created_at: "2026-09-26", note: "" },
  { id: "l6", company: "스튜디오 웨이브", contact: "한수빈", phone: "010-7200-6134", region: "대전", source: "검색 광고", created_by: "sales1", assignee: "doyun", status: "contacted", created_at: "2026-09-25", note: "" },
  { id: "l7", company: "데일리픽", contact: "임재원", phone: "010-3378-9022", region: "강북", source: "소개", created_by: "sales1", assignee: null, status: "new", created_at: "2026-09-24", note: "" },
  { id: "l8", company: "오브젝트하우스", contact: "문다은", phone: "010-1910-5406", region: "경기", source: "웹사이트", created_by: "sales1", assignee: "seoyeon", status: "won", created_at: "2026-09-23", note: "계약 완료" },
];
const statusMeta = {
  new: ["미접촉", "status-new"], contacted: ["연락 완료", "status-contact"],
  proposal: ["제안 중", "status-proposal"], won: ["계약 완료", "status-won"], lost: ["종료", "status-lost"],
};
const serviceRegions = ["강북", "강남", "경기", "인천", "부산", "대구", "대전", "광주", "기타"];
const signupTeams = {
  sales: ["강남 1팀", "강남 2팀", "강북 1팀", "강북 2팀", "전략 1팀", "전략 2팀", "전략 3팀"],
  sa: ["DXI 1팀", "DXI 2팀", "BS SA팀"],
};
const palette = ["#eaf1eb|#528069", "#ececf5|#6b6da2", "#f5eee5|#a47a50", "#e8eef4|#60809a", "#f2eaf0|#956b89"];
let team = structuredClone(seedTeam);
let leads = structuredClone(seedLeads);
let demoMode = true;
let currentUser = null;
let activeFilter = "all";
let query = "";
const pageState = { dashboard: 1, leads: 1 };
const pageSize = { dashboard: 5, leads: 6 };
let toastTimer;

const $ = (id) => document.getElementById(id);
const escapeHtml = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const initials = (name = "?") => [...name.replace(/\s/g, "")].slice(-1)[0] || "?";
const person = (id) => team.find((member) => member.id === id);
const activeLeads = () => leads.filter((lead) => !["won", "lost"].includes(lead.status));
const isSa = (member) => ["sa", "member"].includes(member?.role);
const saMembers = () => team.filter(isSa);
const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
};

function syncCounts() {
  team = team.map((member) => ({ ...member, active: activeLeads().filter((lead) => lead.assignee === member.id).length }));
}
function chooseAssignee(region) {
  const eligible = saMembers().filter((member) => member.regions.includes(region));
  const pool = eligible.length ? eligible : saMembers();
  return [...pool].sort((a, b) => a.active - b.active || a.name.localeCompare(b.name, "ko"))[0]?.id || null;
}
function topRecommendations(region) {
  const candidates = saMembers().map((member) => ({ ...member, regionMatch: (member.regions || []).includes(region) }));
  return candidates.sort((a, b) => Number(b.regionMatch) - Number(a.regionMatch) || a.active - b.active || a.name.localeCompare(b.name, "ko")).slice(0, 3);
}
function persistDemo() {
  if (demoMode) localStorage.setItem("damdang-leads-v1", JSON.stringify(leads));
}
function persistDemoTeam() {
  if (demoMode) localStorage.setItem("damdang-team-v1", JSON.stringify(team));
}
function statusOptions(current) {
  return Object.entries(statusMeta).map(([key, [label]]) => `<option value="${key}" ${current === key ? "selected" : ""}>${label}</option>`).join("");
}
function visibleLeads() {
  return leads.filter((lead) => {
    const matchesFilter = activeFilter === "all" || (activeFilter === "waiting" ? !lead.assignee : lead.assignee && !["won", "lost"].includes(lead.status));
    const matchesSearch = !query || `${lead.company} ${lead.contact} ${lead.region}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });
}
function leadRowMarkup(lead, index, detailed = false) {
    const hue = palette[index % palette.length].split("|");
    const assignee = person(lead.assignee);
    const [statusText, statusClass] = statusMeta[lead.status] || statusMeta.new;
    const canAssign = canManage();
    const assignedControl = canAssign
      ? `<select class="assignee-select ${assignee ? "" : "unassigned"}" data-assign="${escapeHtml(lead.id)}" aria-label="${escapeHtml(lead.company)} SA 지정"><option value="">미배정</option>${saMembers().map((member) => `<option value="${escapeHtml(member.id)}" ${member.id === lead.assignee ? "selected" : ""}>${escapeHtml(member.name)} SA</option>`).join("")}</select>`
      : `<span class="source-label">${assignee ? escapeHtml(assignee.name) : "미배정"}</span>`;
    const canChangeStatus = demoMode || lead.assignee === currentUser?.id || currentUser?.role === "admin";
    const state = canChangeStatus
      ? `<select class="assignee-select status-select ${statusClass}" data-status="${escapeHtml(lead.id)}" aria-label="${escapeHtml(lead.company)} 상태 변경">${statusOptions(lead.status)}</select>`
      : `<span class="status-badge ${statusClass}">${statusText}</span>`;
    return `<tr class="clickable-row" data-detail="${escapeHtml(lead.id)}" tabindex="0" aria-label="${escapeHtml(lead.company)} 문의 상세 보기"><td><div class="company-cell"><span class="company-avatar" style="background:${hue[0]};color:${hue[1]}">${initials(lead.company)}</span><span class="company-copy"><strong>${escapeHtml(lead.company)}</strong><small>${escapeHtml(lead.contact)}${lead.phone ? ` · ${escapeHtml(lead.phone)}` : ""}</small></span></div></td><td><span class="region-label">${escapeHtml(lead.region)}</span></td><td><span class="source-label">${escapeHtml(lead.source || "웹사이트")}</span></td><td>${assignedControl}</td><td>${state}</td><td>${dateLabel(lead.created_at)}</td><td><button class="row-menu" aria-label="${escapeHtml(lead.company)} 상세 보기">⋯</button></td></tr>`;
}
function renderLeads() {
  const rows = visibleLeads();
  const pageCounts = { dashboard: Math.max(1, Math.ceil(rows.length / pageSize.dashboard)), leads: Math.max(1, Math.ceil(rows.length / pageSize.leads)) };
  for (const surface of Object.keys(pageState)) pageState[surface] = Math.min(pageCounts[surface], Math.max(1, pageState[surface]));
  const visibleBySurface = Object.fromEntries(Object.keys(pageState).map((surface) => [surface, rows.slice((pageState[surface] - 1) * pageSize[surface], pageState[surface] * pageSize[surface])]));
  for (const [suffix, surface] of [["", "dashboard"], ["All", "leads"]]) {
    const visibleRows = visibleBySurface[surface];
    const tbody = $(`leadRows${suffix}`);
    tbody.innerHTML = visibleRows.map((lead, index) => leadRowMarkup(lead, index, surface === "leads")).join("");
    $(`emptyState${suffix}`).hidden = rows.length > 0;
    tbody.parentElement.style.display = rows.length ? "table" : "none";
    $(`tableSummary${suffix}`).textContent = `${query || activeFilter !== "all" ? "검색 결과" : "전체"} ${rows.length}건 중 ${visibleRows.length}건 표시`;
    $(`leadCount${suffix}`).textContent = `${leads.length}건`;
    $(`filterAllCount${suffix}`).textContent = leads.length;
    $(`filterWaitingCount${suffix}`).textContent = leads.filter((lead) => !lead.assignee).length;
    const search = $(`searchInput${suffix}`);
    if (search && search.value !== query) search.value = query;
  }
  for (const surface of Object.keys(pageState)) {
    $(`${surface}PageIndicator`).textContent = `${pageState[surface]} / ${pageCounts[surface]}`;
    document.querySelectorAll(`[data-page-surface="${surface}"]`).forEach((button) => {
      button.disabled = button.dataset.pageAction === "prev" ? pageState[surface] <= 1 : pageState[surface] >= pageCounts[surface];
    });
  }
  document.querySelectorAll("[data-filter]").forEach((tab) => tab.classList.toggle("selected", tab.dataset.filter === activeFilter));
  $("leadCount").textContent = `${leads.length}건`;
  $("navLeadCount").textContent = String(leads.length).padStart(2, "0");
  $("autoAssignCount").textContent = `${leads.filter((lead) => !lead.assignee).length}건`;
  $("autoAssignCountAll").textContent = `${leads.filter((lead) => !lead.assignee).length}건`;
}
function renderTeam() {
  syncCounts();
  const salesTeam = saMembers();
  const max = Math.max(8, ...salesTeam.map((member) => member.active));
  $("teamList").innerHTML = salesTeam.map((member, index) => {
    const bar = member.active / max * 100;
    const level = bar > 75 ? "high" : bar > 55 ? "medium" : "";
    return `<article class="team-member"><span class="member-avatar" style="background:${member.color || palette[index % palette.length].split("|")[0]};color:${member.ink || palette[index % palette.length].split("|")[1]}">${initials(member.name)}</span><span><span class="member-name">${escapeHtml(member.name)} · SA</span><span class="member-region">${escapeHtml((member.regions || []).join(" · ") || "전 지역")}</span></span><span class="workload"><span class="workload-count"><strong>${member.active}</strong>건 진행 중</span><span class="workload-bar"><i class="${level}" style="width:${bar}%"></i></span></span></article>`;
  }).join("");
  const allActive = activeLeads().length;
  const assigned = salesTeam.reduce((total, member) => total + member.active, 0);
  $("statNew").textContent = String(leads.filter((lead) => lead.status === "new").length).padStart(2, "0");
  $("statWaiting").textContent = String(leads.filter((lead) => !lead.assignee).length).padStart(2, "0");
  $("statActive").textContent = String(allActive).padStart(2, "0");
  $("chartActiveTotal").textContent = `${assigned}건`;
  $("teamChartActiveTotal").textContent = `${assigned}건`;
  $("teamMemberCount").textContent = `${salesTeam.length}명`;
  const chartMax = Math.max(1, ...salesTeam.map((member) => member.active));
  const barMarkup = salesTeam.map((member, index) => {
    const width = member.active ? Math.max(8, member.active / chartMax * 100) : 0;
    const color = palette[index % palette.length].split("|")[1];
    return `<div class="chart-row"><div class="chart-person"><span class="member-avatar" style="background:${member.color || palette[index % palette.length].split("|")[0]};color:${member.ink || color}">${initials(member.name)}</span><span><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml((member.regions || []).join(" · ") || "전 지역")}</small></span></div><div class="chart-track" role="img" aria-label="${escapeHtml(member.name)} ${member.active}건"><i style="width:${width}%;--bar-color:${color}"></i></div><span class="chart-count"><strong>${member.active}</strong><small>건</small></span></div>`;
  }).join("");
  $("dashboardBars").innerHTML = barMarkup;
  $("teamPageBars").innerHTML = barMarkup;
  $("teamDirectory").innerHTML = salesTeam.map((member, index) => {
    const color = palette[index % palette.length].split("|");
    const active = member.active;
    const all = leads.filter((lead) => lead.assignee === member.id).length;
    return `<article class="directory-card" data-edit-sa="${escapeHtml(member.id)}" tabindex="0" role="button" aria-label="${escapeHtml(member.name)} SA 정보 편집"><div class="directory-card-top"><span class="member-avatar" style="background:${member.color || color[0]};color:${member.ink || color[1]}">${initials(member.name)}</span><span><strong>${escapeHtml(member.name)}</strong><small>SA 담당자 · ${escapeHtml(member.team || "팀 미지정")}</small></span><span class="directory-active"><b>${active}</b>건 진행 중</span></div><div class="directory-regions"><small>담당 지역</small>${(member.regions || []).map((region) => `<span>${escapeHtml(region)}</span>`).join("") || "<span>전 지역</span>"}</div><div class="directory-regions"><small>솔루션</small>${(member.solutions || []).map((solution) => `<span class="solution-tag">${escapeHtml(solution)}</span>`).join("") || '<span class="solution-empty">미등록 · 눌러서 추가</span>'}</div><div class="directory-card-foot"><span>전체 배정 <b>${all}</b>건</span><span>진행 중 <b>${active}</b>건</span></div></article>`;
  }).join("");
}
function render() { renderTeam(); renderLeads(); }
function renderRoute() {
  const currentHash = location.hash.slice(1);
  const route = ["leads", "team"].includes(currentHash) ? currentHash : "dashboard";
  const pageLabels = { dashboard: "대시보드", leads: "영업 문의", team: "SA 담당자" };
  for (const key of Object.keys(pageLabels)) $(`${key}Page`).hidden = route !== key;
  document.querySelectorAll(".main-nav .nav-item").forEach((link) => link.classList.toggle("active", link.hash === `#${route}`));
  $("currentPageLabel").textContent = pageLabels[route];
  if (["login", "signup"].includes(currentHash)) {
    setAuthView(currentHash);
    showModal("authBackdrop");
  }
}
window.addEventListener("hashchange", renderRoute);
renderRoute();
function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function showModal(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
function closeModal(id) { $(id).hidden = true; document.body.style.overflow = ""; }
function setConnection(text, connected) {
  const pill = $("connectionStatus"); pill.innerHTML = `<i></i> ${escapeHtml(text)}`; pill.classList.toggle("connected", connected);
}
function setAuthView(view) {
  const signup = view === "signup";
  $("authForm").hidden = signup;
  $("signupForm").hidden = !signup;
  $("authTitle").textContent = signup ? "회원가입" : "팀에 로그인";
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    const active = tab.dataset.authView === view;
    tab.classList.toggle("selected", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $("authFeedback").hidden = true;
  $("authFeedback").textContent = "";
  $("authFeedback").classList.remove("success");
}
function setAuthFeedback(message, success = false) {
  const feedback = $("authFeedback");
  feedback.textContent = message;
  feedback.hidden = false;
  feedback.classList.toggle("success", success);
}
function updateSignupTeams() {
  const role = $("signupRole").value;
  const select = $("signupTeam");
  const choices = signupTeams[role] || [];
  select.innerHTML = `<option value="">${choices.length ? "팀 선택" : "역할을 먼저 선택하세요"}</option>${choices.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  select.disabled = !choices.length;
}
function canManage() { return demoMode || ["admin", "sales"].includes(currentUser?.role); }
function canEditSaProfile(id) { return demoMode || currentUser?.role === "admin" || (isSa(currentUser) && currentUser.id === id); }
function updateFormRecommendations() {
  const region = $("leadRegionSelect").value;
  const list = $("formRecommendations");
  if (!region) {
    $("recommendationTitle").textContent = "추천 SA를 불러옵니다";
    $("recommendationMessage").textContent = "지역을 선택하면 담당 지역과 현재 업무량으로 최대 3명을 추천합니다.";
    list.innerHTML = "";
    return;
  }
  const recommendations = topRecommendations(region);
  $("recommendationTitle").textContent = recommendations.length ? "추천 SA TOP 3" : "추천할 SA가 없어요";
  $("recommendationMessage").textContent = "지역이 맞는 담당자를 먼저 보여주고, 진행 중인 건수가 적은 순으로 정렬합니다.";
  list.innerHTML = recommendations.map((member, index) => `<label class="form-rec-card ${index === 0 ? "recommended-first" : ""}"><input type="radio" name="assignedSa" value="${escapeHtml(member.id)}" ${index === 0 ? "checked" : ""}><span class="rec-rank">${index + 1}</span><span class="member-avatar" style="background:${member.color};color:${member.ink}">${initials(member.name)}</span><span class="form-rec-copy"><strong>${escapeHtml(member.name)}</strong><small>${member.regionMatch ? "지역 담당 SA" : "타 지역 지원"} · ${escapeHtml((member.regions || []).join(" · ") || "전 지역")}</small></span><span class="form-rec-load"><b>${member.active}</b><small>건 진행</small></span></label>`).join("");
}
function openLeadDetail(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;
  const assigned = person(lead.assignee);
  const registeredBy = person(lead.created_by)?.name || (demoMode ? "정가영" : "영업팀");
  const [status, statusClass] = statusMeta[lead.status] || statusMeta.new;
  $("leadDetailTitle").textContent = lead.company;
  const recommendations = topRecommendations(lead.region);
  const mayEditNote = demoMode || currentUser?.role === "admin" || lead.created_by === currentUser?.id || lead.assignee === currentUser?.id;
  const noteContent = mayEditNote
    ? `<textarea id="leadNoteInput" rows="3" aria-label="영업 메모">${escapeHtml(lead.note || "")}</textarea><button class="text-button save-note-button" data-save-note="${escapeHtml(lead.id)}">메모 저장 <span>→</span></button>`
    : `<p>${escapeHtml(lead.note || "등록된 메모가 없습니다.")}</p>`;
  const recommendationsMarkup = recommendations.map((member, index) => `<div class="detail-rec-row"><span class="rec-rank">${index + 1}</span><span class="member-avatar" style="background:${member.color};color:${member.ink}">${initials(member.name)}</span><span class="detail-rec-copy"><strong>${escapeHtml(member.name)}</strong><small>${member.regionMatch ? "담당 지역 일치" : "다른 지역 지원"} · ${escapeHtml((member.regions || []).join(" · ") || "전 지역")} · 솔루션 ${(member.solutions || []).join(", ") || "미등록"}</small></span><span class="detail-rec-load"><b>${member.active}</b><small>건 진행 중</small></span><button class="secondary-button detail-assign-button" data-detail-assign="${escapeHtml(member.id)}" data-detail-lead="${escapeHtml(lead.id)}" ${canManage() ? "" : "disabled"}>${member.id === lead.assignee ? "현재 담당" : "이 SA 배정"}</button></div>`).join("") || "<p class=detail-empty>배정 가능한 SA가 없습니다.</p>";
  $("leadDetailContent").innerHTML = `<div class="detail-summary"><span class="status-badge ${statusClass}">${status}</span><span>${escapeHtml(lead.region)} 지역</span><span>${dateLabel(lead.created_at)} 접수</span></div><div class="detail-facts"><div><small>고객 담당자</small><strong>${escapeHtml(lead.contact)}</strong></div><div><small>고객 연락처</small><strong>${escapeHtml(lead.phone || "미입력")}</strong></div><div><small>등록 영업</small><strong>${escapeHtml(registeredBy)}</strong></div><div><small>유입 경로</small><strong>${escapeHtml(lead.source || "웹사이트")}</strong></div><div class="detail-note"><small>영업 메모</small>${noteContent}</div></div><div class="detail-assignee"><small>현재 배정 SA</small><strong>${escapeHtml(assigned?.name || "미배정")}</strong></div><div class="detail-recommendations"><div class="detail-rec-heading"><strong>추천 SA TOP 3</strong><span>지역 적합도와 진행 건수 기준</span></div>${recommendationsMarkup}</div>`;
  showModal("leadDetailBackdrop");
}
function openSaEditor(id) {
  const member = team.find((item) => item.id === id);
  if (!member) return;
  const form = $("saEditorForm");
  form.elements.memberId.value = member.id;
  form.elements.memberName.value = member.name;
  form.elements.solutions.value = (member.solutions || []).join(", ");
  $("saEditorTitle").textContent = `${member.name} 담당 정보`;
  $("saRegionOptions").innerHTML = serviceRegions.map((region) => `<label class="sa-region-option"><input type="checkbox" name="regions" value="${escapeHtml(region)}" ${(member.regions || []).includes(region) ? "checked" : ""}><span>${escapeHtml(region)}</span></label>`).join("");
  showModal("saEditorBackdrop");
}
async function saveLead(lead) {
  if (demoMode) {
    leads.unshift(lead); persistDemo(); return;
  }
  const { error } = await supabase.from("sales_leads").insert({ ...lead, created_by: currentUser.id });
  if (error) throw error;
}
async function updateLead(id, values) {
  if (demoMode) {
    leads = leads.map((lead) => lead.id === id ? { ...lead, ...values } : lead); persistDemo(); render(); return;
  }
  const { error } = await supabase.from("sales_leads").update(values).eq("id", id);
  if (error) throw error;
  await loadWorkspace();
}
async function loadWorkspace() {
  if (!supabase || !currentUser) return;
  const [{ data: profile, error: profileError }, { data: leadData, error: leadError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, team, regions, solutions").eq("id", currentUser.id).single(),
    supabase.from("sales_leads").select("id, company, contact, phone, region, source, assignee, created_by, status, note, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, team, regions, solutions").order("full_name"),
  ]);
  const failure = profileError || leadError || profilesError;
  if (failure) throw failure;
  currentUser = { id: profile.id, name: profile.full_name, role: profile.role, team: profile.team };
  team = profiles.map((p, i) => ({ id: p.id, name: p.full_name, role: p.role, team: p.team, regions: p.regions || [], solutions: p.solutions || [], color: palette[i % palette.length].split("|")[0], ink: palette[i % palette.length].split("|")[1] }));
  leads = leadData || [];
  $("profileName").textContent = currentUser.name;
  $("profileAvatar").textContent = initials(currentUser.name);
  $("profileRole").textContent = currentUser.role === "admin" ? "영업 관리자" : currentUser.role === "sales" ? `영업 · ${currentUser.team || "팀 미지정"}` : `SA · ${currentUser.team || "팀 미지정"}`;
  $("accountButton").hidden = true;
  $("newLeadButton").hidden = !canManage();
  $("newLeadButtonAll").hidden = !canManage();
  $("autoAssignButton").hidden = !canManage();
  $("autoAssignButtonAll").hidden = !canManage();
  $("viewAllButton").hidden = false;
  setConnection("Supabase 연결됨", true);
  render();
}
async function bootstrap() {
  const now = new Date();
  $("todayLabel").textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(now);
  $("headingDate").textContent = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(now);
  try {
    if (supabase) {
      setConnection("연결 확인 중", false);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        demoMode = false;
        await loadWorkspace();
        if (["#login", "#signup"].includes(location.hash)) { closeModal("authBackdrop"); location.hash = "#dashboard"; }
        return;
      }
      setConnection("로그인 필요", false);
      $("newLeadButton").hidden = true; $("newLeadButtonAll").hidden = true; $("autoAssignButton").hidden = true; $("autoAssignButtonAll").hidden = true;
      showModal("authBackdrop");
    } else {
      const savedTeam = localStorage.getItem("damdang-team-v1");
      if (savedTeam) team = JSON.parse(savedTeam);
      const saved = localStorage.getItem("damdang-leads-v1");
      if (saved) leads = JSON.parse(saved);
      setConnection("샘플 데이터", false);
    }
  } catch (error) {
    console.error(error); showToast("데이터를 불러오지 못했어요. Supabase 설정과 권한을 확인해주세요.");
    setConnection("연결 오류", false);
  }
  render();
}

$("accountButton").addEventListener("click", () => {
  setAuthView("login");
  showModal("authBackdrop");
});
$("profileButton").addEventListener("click", async () => {
  if (demoMode) {
    setAuthView("login");
    showModal("authBackdrop");
    return;
  }
  try {
    demoMode = true;
    await supabase.auth.signOut();
    currentUser = null;
    team = structuredClone(seedTeam);
    leads = structuredClone(seedLeads);
    $("profileName").textContent = "정가영";
    $("profileAvatar").textContent = "정";
    $("profileRole").textContent = "영업 담당자";
    $("accountButton").hidden = false;
    setConnection("샘플 데이터", false);
    $("newLeadButton").hidden = false;
    $("newLeadButtonAll").hidden = false;
    $("autoAssignButton").hidden = false;
    $("autoAssignButtonAll").hidden = false;
    render();
    showToast("로그아웃했어요.");
  } catch (error) {
    demoMode = false;
    console.error(error);
    showToast("로그아웃하지 못했어요. 다시 시도해주세요.");
  }
});

document.addEventListener("click", async (event) => {
  if (event.target.closest("#accountButton, #profileButton") && demoMode) {
    setAuthView("login");
    showModal("authBackdrop");
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    pageState.dashboard = 1; pageState.leads = 1; renderLeads();
  }
  if (event.target.closest("#newLeadButton, #newLeadButtonAll")) { showModal("modalBackdrop"); updateFormRecommendations(); }
  if (event.target.closest("#viewAllButton")) location.hash = "#leads";
  if (event.target.closest("#closeModalButton, #cancelButton")) closeModal("modalBackdrop");
  if (event.target.closest("#closeAuthButton")) {
    closeModal("authBackdrop");
    if (["#login", "#signup"].includes(location.hash)) location.hash = "#dashboard";
  }
  const authViewButton = event.target.closest("[data-auth-view]");
  if (authViewButton) setAuthView(authViewButton.dataset.authView);
  if (event.target.closest("#closeLeadDetailButton, #closeLeadDetailFooter")) closeModal("leadDetailBackdrop");
  if (event.target.closest("#closeSaEditorButton, #cancelSaEditorButton")) closeModal("saEditorBackdrop");
  if (event.target.closest("#teamOptionsButton")) showToast("추천 순위는 담당 지역 일치 여부와 진행 중인 건수로 정합니다.");
  const pageButton = event.target.closest("[data-page-action][data-page-surface]");
  if (pageButton && !pageButton.disabled) {
    const surface = pageButton.dataset.pageSurface;
    pageState[surface] += pageButton.dataset.pageAction === "next" ? 1 : -1;
    renderLeads();
  }
  if (event.target.closest("#sampleButton")) { demoMode = true; currentUser = null; closeModal("authBackdrop"); if (["#login", "#signup"].includes(location.hash)) location.hash = "#dashboard"; setConnection("샘플 데이터", false); $("accountButton").hidden = false; $("newLeadButton").hidden = false; $("newLeadButtonAll").hidden = false; $("autoAssignButton").hidden = false; $("autoAssignButtonAll").hidden = false; render(); }
  if (event.target.closest("#autoAssignButton, #autoAssignButtonAll")) {
    if (!canManage()) return showToast("영업 등록자 또는 관리자 권한이 필요해요.");
    const waiting = leads.filter((lead) => !lead.assignee);
    if (!waiting.length) return showToast("배정 대기 중인 문의가 없어요.");
    try {
      for (const lead of waiting) { const assignee = chooseAssignee(lead.region); if (assignee) await updateLead(lead.id, { assignee }); }
      if (demoMode) render();
      showToast(`${waiting.length}건의 문의를 담당자에게 배정했어요.`);
    } catch (error) { console.error(error); showToast("자동 배정에 실패했어요."); }
  }
  if (event.target.closest("#refreshButton")) {
    if (!demoMode) { try { await loadWorkspace(); showToast("최신 정보로 업데이트했어요."); } catch { showToast("정보를 불러오지 못했어요."); } }
    else { render(); showToast("화면을 업데이트했어요."); }
  }
  const detailRow = event.target.closest("[data-detail]");
  if (detailRow && (!event.target.closest("select, button, a, input") || event.target.closest(".row-menu"))) openLeadDetail(detailRow.dataset.detail);
  const saCard = event.target.closest("[data-edit-sa]");
  if (saCard) {
    if (canEditSaProfile(saCard.dataset.editSa)) openSaEditor(saCard.dataset.editSa);
    else showToast("다른 SA 정보는 관리자만 수정할 수 있어요.");
  }
  const recommendedButton = event.target.closest("[data-recommend-lead][data-recommend-sa]");
  const detailAssignButton = event.target.closest("[data-detail-assign][data-detail-lead]");
  if (recommendedButton || detailAssignButton) {
    const button = recommendedButton || detailAssignButton;
    const id = recommendedButton ? button.dataset.recommendLead : button.dataset.detailLead;
    const assignee = recommendedButton ? button.dataset.recommendSa : button.dataset.detailAssign;
    try { await updateLead(id, { assignee }); const name = person(assignee)?.name || "SA"; if (detailAssignButton) openLeadDetail(id); showToast(`${name} SA에게 배정했어요.`); }
    catch (error) { console.error(error); showToast("담당자 배정에 실패했어요. 권한을 확인해주세요."); }
  }
  const saveNoteButton = event.target.closest("[data-save-note]");
  if (saveNoteButton) {
    const leadId = saveNoteButton.dataset.saveNote;
    try { await updateLead(leadId, { note: $("leadNoteInput").value.trim() }); openLeadDetail(leadId); showToast("영업 메모를 저장했어요."); }
    catch (error) { console.error(error); showToast("메모 저장에 실패했어요."); }
  }
  if (event.target === $("modalBackdrop")) closeModal("modalBackdrop");
  if (event.target === $("authBackdrop")) closeModal("authBackdrop");
  if (event.target === $("leadDetailBackdrop")) closeModal("leadDetailBackdrop");
  if (event.target === $("saEditorBackdrop")) closeModal("saEditorBackdrop");
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const detailRow = event.target.closest?.("tr[data-detail]");
  const saCard = event.target.closest?.("[data-edit-sa]");
  if (detailRow && event.target === detailRow) { event.preventDefault(); openLeadDetail(detailRow.dataset.detail); }
  else if (saCard && event.target === saCard) { event.preventDefault(); openSaEditor(saCard.dataset.editSa); }
});
$("searchInput").addEventListener("input", (event) => { query = event.target.value.trim(); pageState.dashboard = 1; pageState.leads = 1; renderLeads(); });
$("searchInputAll").addEventListener("input", (event) => { query = event.target.value.trim(); pageState.dashboard = 1; pageState.leads = 1; renderLeads(); });
$("leadRegionSelect").addEventListener("change", updateFormRecommendations);
$("signupRole").addEventListener("change", updateSignupTeams);
document.addEventListener("change", async (event) => {
  if (event.target.id === "leadRegionSelect") return;
  const assignId = event.target.dataset.assign;
  const statusId = event.target.dataset.status;
  if (!assignId && !statusId) return;
  if (assignId && !canManage()) return showToast("영업 담당자 또는 관리자 권한이 필요해요.");
  const id = assignId || statusId;
  try { await updateLead(id, assignId ? { assignee: event.target.value || null } : { status: event.target.value }); showToast(assignId ? "담당자를 변경했어요." : "진행 상태를 변경했어요."); }
  catch (error) { console.error(error); showToast("저장하지 못했어요. 권한을 확인해주세요."); }
});
$("leadForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const lead = { id: demoMode ? `l-${crypto.randomUUID()}` : undefined, company: data.get("company").trim(), contact: data.get("contact").trim(), phone: data.get("phone").trim(), region: data.get("region"), source: data.get("source"), status: "new", note: data.get("note").trim(), created_by: demoMode ? "sales1" : currentUser.id, created_at: new Date().toISOString().slice(0, 10) };
  lead.assignee = data.get("assignedSa") || chooseAssignee(lead.region);
  try { await saveLead(lead); closeModal("modalBackdrop"); event.currentTarget.reset(); updateFormRecommendations(); pageState.dashboard = 1; pageState.leads = 1; if (demoMode) render(); else await loadWorkspace(); showToast(`${lead.company}을(를) ${person(lead.assignee)?.name || "SA 미정"}에게 전달했어요.`); }
  catch (error) { console.error(error); showToast("문의 등록에 실패했어요. 입력값과 권한을 확인해주세요."); }
});
$("saEditorForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.memberId.value;
  const regions = [...form.querySelectorAll('input[name="regions"]:checked')].map((input) => input.value);
  const solutions = form.elements.solutions.value.split(",").map((value) => value.trim()).filter(Boolean);
  try {
    if (demoMode) {
      team = team.map((member) => member.id === id ? { ...member, regions, solutions } : member);
      persistDemoTeam();
    } else {
      const { error } = await supabase.from("profiles").update({ regions, solutions }).eq("id", id);
      if (error) throw error;
      await loadWorkspace();
    }
    closeModal("saEditorBackdrop");
    render();
    showToast("SA 담당 정보를 저장했어요.");
  } catch (error) {
    console.error(error);
    showToast("저장하지 못했어요. 관리자 권한과 Supabase 설정을 확인해주세요.");
  }
});
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) { setAuthFeedback("계정을 사용하려면 app.js에 Supabase URL과 공개 키를 먼저 설정하세요."); return; }
  try {
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: data.get("email"), password: data.get("password") });
    if (error) { setAuthFeedback("이메일과 비밀번호를 확인해주세요. 가입 확인 메일을 받은 경우 이메일 인증을 먼저 완료해주세요."); return; }
    demoMode = false;
    await loadWorkspace();
    closeModal("authBackdrop");
    if (["#login", "#signup"].includes(location.hash)) location.hash = "#dashboard";
    showToast("로그인했어요.");
  } catch (error) {
    console.error(error);
    setAuthFeedback("로그인하지 못했어요. 연결 설정과 계정 권한을 확인해주세요.");
    await supabase.auth.signOut();
    demoMode = true;
  }
});
$("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) { setAuthFeedback("회원가입을 사용하려면 app.js에 Supabase URL과 공개 키를 먼저 설정하세요."); return; }
  const data = new FormData(event.currentTarget);
  const fullName = String(data.get("fullName") || "").trim();
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const passwordConfirm = String(data.get("passwordConfirm") || "");
  const role = String(data.get("role") || "");
  const teamName = String(data.get("team") || "");
  if (password !== passwordConfirm) { setAuthFeedback("비밀번호가 서로 다릅니다."); return; }
  if (!signupTeams[role]?.includes(teamName)) { setAuthFeedback("선택한 역할에 맞는 팀을 하나 선택해주세요."); return; }
  try {
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role, team: teamName },
      },
    });
    if (error) throw error;
    if (result.session) {
      try {
        demoMode = false;
        await loadWorkspace();
        closeModal("authBackdrop");
        if (["#login", "#signup"].includes(location.hash)) location.hash = "#dashboard";
        showToast("가입하고 로그인했어요.");
      } catch (loadError) {
        console.error(loadError);
        await supabase.auth.signOut();
        demoMode = true;
        setAuthFeedback("가입은 됐지만 프로필을 불러오지 못했어요. Supabase에서 schema.sql을 실행했는지 확인해주세요.");
      }
    } else {
      setAuthFeedback("가입 요청을 받았습니다. 이메일 인증을 완료한 다음 로그인해주세요.", true);
    }
  } catch (error) {
    console.error(error);
    setAuthFeedback(error.message?.includes("already registered") ? "이미 가입된 이메일입니다. 로그인해주세요." : "가입하지 못했어요. 이메일과 비밀번호, Supabase 설정을 확인해주세요.");
  }
});
supabase?.auth.onAuthStateChange((_event, session) => {
  if (!session && !demoMode) { currentUser = null; showModal("authBackdrop"); }
});
bootstrap();
