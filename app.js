// ========== Data Model ==========
const STATUS_COLS = [
  "Backlog", "Approved", "In Progress", "Awaiting Parts", "Done"
];

let workOrders = [
  {
    id: "1",
    title: "Conveyor Motor Broken",
    description: "Main conveyor is not running.",
    asset: "Conveyor A-23",
    priority: "High",
    status: "Backlog",
    assignedTo: "Unassigned",
    requiredParts: "",
    comments: [],
    createdDate: "2025-10-01T08:00:00",
    completedDate: null,
    submittedBy: "operator1"
  },
  {
    id: "2",
    title: "Boiler Leak Detected",
    description: "Leak in Boiler B-12. Needs inspection.",
    asset: "Boiler B-12",
    priority: "Medium",
    status: "In Progress",
    assignedTo: "tech2",
    requiredParts: "",
    comments: ["Started inspection."],
    createdDate: "2025-10-02T09:00:00",
    completedDate: null,
    submittedBy: "operator2"
  },
  {
    id: "3",
    title: "Pump X-15 Noise",
    description: "Unusual noise from Pump X-15.",
    asset: "Pump X-15",
    priority: "Low",
    status: "Approved",
    assignedTo: "Unassigned",
    requiredParts: "",
    comments: [],
    createdDate: "2025-10-04T07:30:00",
    completedDate: null,
    submittedBy: "operator3"
  }
];

// ========== Utility ==========
function genId() {
  return String(Date.now() + Math.floor(Math.random()*10000));
}
function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

// ========== DOM Elements ==========
const kanbanSection = document.getElementById("kanbanSection");
const analyticsSection = document.getElementById("analyticsSection");
const kanbanBtn = document.getElementById("kanbanBtn");
const analyticsBtn = document.getElementById("analyticsBtn");
const newOrderBtn = document.getElementById("newOrderBtn");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalContainer = document.getElementById("modalContainer");

// ========== Kanban Board ==========
function renderKanban() {
  kanbanSection.innerHTML = "";
  STATUS_COLS.forEach(status => {
    const col = document.createElement("div");
    col.className = "kanban-col";
    col.dataset.status = status;
    col.ondragover = e => e.preventDefault();
    col.ondrop = onDropCard;
    const h = document.createElement("h3");
    h.innerText = status;
    col.appendChild(h);
    workOrders
      .filter(wo => wo.status === status)
      .forEach(wo => col.appendChild(renderCard(wo)));
    kanbanSection.appendChild(col);
  });
}
function renderCard(wo) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = wo.id;
  card.ondragstart = onDragCard;
  card.onclick = () => showWorkOrderModal(wo.id);
  card.innerHTML = `
    <b>${wo.title}</b>
    <p>${wo.asset}</p>
    <span class="priority ${wo.priority.toLowerCase()}">${wo.priority}</span>
  `;
  return card;
}
let draggedCardId = null;
function onDragCard(e) {
  draggedCardId = e.target.dataset.id;
  e.dataTransfer.effectAllowed = "move";
}
function onDropCard(e) {
  const status = e.currentTarget.dataset.status;
  if (draggedCardId) {
    updateWorkOrderStatus(draggedCardId, status);
    renderKanban();
    draggedCardId = null;
  }
}

// ========== Work Order Modal ==========
function showWorkOrderModal(id) {
  const wo = workOrders.find(w => w.id === id);
  if (!wo) return;
  modalBackdrop.style.display = "block";
  modalContainer.style.display = "block";
  modalContainer.innerHTML = `
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>${wo.title}</h2>
    <p><b>Description:</b> ${wo.description}</p>
    <p><b>Asset:</b> ${wo.asset}</p>
    <p><b>Priority:</b> <span class="priority ${wo.priority.toLowerCase()}">${wo.priority}</span></p>
    <p><b>Assigned Technician:</b> ${wo.assignedTo}</p>
    <p><b>Required Parts:</b> ${wo.requiredParts || "-"}</p>
    <p><b>Status:</b> ${wo.status}</p>
    <p><b>Submitted By:</b> ${wo.submittedBy}</p>
    <div class="modal-actions">${renderStatusButtons(wo)}</div>
    <div><b>Comments:</b><ul>${wo.comments.map(c => `<li>${c}</li>`).join("")}</ul></div>
  `;
}
function closeModal() {
  modalBackdrop.style.display = "none";
  modalContainer.style.display = "none";
  modalContainer.innerHTML = "";
}
window.closeModal = closeModal; // for inline onclick

function renderStatusButtons(wo) {
  let html = "";
  if (wo.status === "Approved") {
    html += `<button onclick="changeStatus('${wo.id}','In Progress')">Start Work</button>`;
  }
  if (wo.status === "In Progress") {
    html += `<button onclick="changeStatus('${wo.id}','Awaiting Parts')">Request Part</button>`;
    html += `<button onclick="changeStatus('${wo.id}','Done')">Complete</button>`;
  }
  if (wo.status === "Awaiting Parts") {
    html += `<button onclick="changeStatus('${wo.id}','In Progress')">Parts Arrived</button>`;
  }
  return html;
}
window.changeStatus = function(id, newStatus) {
  updateWorkOrderStatus(id, newStatus);
  closeModal();
  renderKanban();
};

// ========== Update Work Order (Status, etc) ==========
function updateWorkOrderStatus(id, newStatus) {
  workOrders = workOrders.map(wo => {
    if (wo.id === id) {
      let completedDate = wo.completedDate;
      if (newStatus === "Done") completedDate = new Date().toISOString();
      return { ...wo, status: newStatus, completedDate };
    }
    return wo;
  });
}

// ========== New Work Order Modal ==========
function showNewOrderForm() {
  modalBackdrop.style.display = "block";
  modalContainer.style.display = "block";
  modalContainer.innerHTML = `
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>New Work Order</h2>
    <form id="newOrderForm">
      <label>Title:<br><input required name="title"></label>
      <label>Asset/Machine:<br>
        <select name="asset">
          <option>Conveyor A-23</option>
          <option>Pump X-15</option>
          <option>Boiler B-12</option>
        </select>
      </label>
      <label>Issue Description:<br>
        <textarea required name="description"></textarea>
      </label>
      <label>Priority:<br>
        <select name="priority">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </label>
      <input type="hidden" name="submittedBy" value="operator1">
      <button type="submit">Submit</button>
    </form>
  `;
  document.getElementById("newOrderForm").onsubmit = onNewOrderSubmit;
}
function onNewOrderSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const wo = {
    id: genId(),
    title: fd.get("title"),
    asset: fd.get("asset"),
    description: fd.get("description"),
    priority: fd.get("priority"),
    status: "Backlog",
    assignedTo: "Unassigned",
    requiredParts: "",
    comments: [],
    createdDate: new Date().toISOString(),
    completedDate: null,
    submittedBy: fd.get("submittedBy")
  };
  workOrders.push(wo);
  closeModal();
  renderKanban();
}

// ========== Analytics ==========
function renderAnalytics() {
  analyticsSection.innerHTML = `
    <h2>Analytics Dashboard</h2>
    <div class="charts-row">
      <div class="chart-box" id="statusChartBox">
        <h4>Work Orders by Status</h4>
        <canvas id="statusPie" width="220" height="220"></canvas>
      </div>
      <div class="chart-box" id="mttcChartBox">
        <h4>Mean Time To Complete (MTTC)</h4>
        <canvas id="mttcLine" width="280" height="220"></canvas>
      </div>
    </div>
  `;
  drawStatusPieChart();
  drawMTTCLineChart();
}
function drawStatusPieChart() {
  const ctx = document.getElementById("statusPie").getContext("2d");
  const counts = STATUS_COLS.map(status => workOrders.filter(wo => wo.status === status).length);
  const total = counts.reduce((a,b) => a+b, 0) || 1;
  const colors = ["#8884d8","#82ca9d","#ffc658","#f08080","#a4de6c"];
  let angle = 0;
  ctx.clearRect(0,0,220,220);
  counts.forEach((count, i) => {
    const slice = (count/total)*2*Math.PI;
    ctx.beginPath();
    ctx.moveTo(110,110);
    ctx.arc(110,110,90,angle,angle+slice,false);
    ctx.fillStyle = colors[i%colors.length];
    ctx.fill();
    angle += slice;
  });
  // legend
  STATUS_COLS.forEach((status,i)=>{
    ctx.fillStyle = colors[i%colors.length];
    ctx.fillRect(10,200-15*i,10,10);
    ctx.fillStyle = "#333";
    ctx.font="12px Segoe UI";
    ctx.fillText(status,25,210-15*i);
  });
}
function drawMTTCLineChart() {
  const ctx = document.getElementById("mttcLine").getContext("2d");
  // gather dates and MTTC values
  const completed = workOrders.filter(wo=>wo.completedDate);
  const data = completed.map(wo=>{
    const created = new Date(wo.createdDate), completedDate = new Date(wo.completedDate);
    const mttc = (completedDate - created)/3600000; // hours
    return { date: completedDate.toISOString().slice(0,10), mttc };
  }).sort((a,b)=>a.date.localeCompare(b.date));
  ctx.clearRect(0,0,280,220);
  ctx.strokeStyle="#8884d8"; ctx.lineWidth=2;
  ctx.beginPath();
  data.forEach((d,i)=>{
    const x = 40 + i*40, y = 180 - (d.mttc||0)*15;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
    ctx.arc(x,y,2,0,2*Math.PI);
  });
  ctx.stroke();
  // axes
  ctx.strokeStyle="#aaa"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(40,180); ctx.lineTo(260,180); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40,180); ctx.lineTo(40,40); ctx.stroke();
  ctx.font="12px Segoe UI"; ctx.fillStyle="#333";
  data.forEach((d,i)=>{
    const x = 40+i*40; ctx.fillText(d.date,x-15,200);
    ctx.fillText(d.mttc.toFixed(1),x-5,170-(d.mttc||0)*15);
  });
}

// ========== Navigation ==========
kanbanBtn.onclick = ()=>{
  kanbanSection.style.display = "";
  analyticsSection.style.display = "none";
  renderKanban();
};
analyticsBtn.onclick = ()=>{
  kanbanSection.style.display = "none";
  analyticsSection.style.display = "";
  renderAnalytics();
};
newOrderBtn.onclick = showNewOrderForm;

// initial render
renderKanban();
