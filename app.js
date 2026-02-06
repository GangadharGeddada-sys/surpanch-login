const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

const stateSelect = document.getElementById("state-select");
const districtSelect = document.getElementById("district-select");
const mandalSelect = document.getElementById("mandal-select");
const villageSelect = document.getElementById("village-select");
const mobileInput = document.getElementById("mobile-input");
const otpBtn = document.getElementById("otp-btn");
const otpInput = document.getElementById("otp-input");
const verifyBtn = document.getElementById("verify-btn");
const otpMessage = document.getElementById("otp-message");
const loginBtn = document.getElementById("login-btn");
const dashboardContent = document.getElementById("dashboard-content");
const sarpanchForm = document.getElementById("sarpanch-form");
const sarpanchAuthPanel = document.getElementById("sarpanch-auth-panel");
const sarpanchDashboardCard = document.getElementById("sarpanch-dashboard-card");
const sarpanchLogoutBtn = document.getElementById("sarpanch-logout");

const adminForm = document.getElementById("admin-form");
const adminMessage = document.getElementById("admin-message");
const sarpanchTable = document.getElementById("sarpanch-table");
const adminAuthPanel = document.getElementById("admin-auth-panel");
const adminDashboardCard = document.getElementById("admin-dashboard-card");
const adminLogoutBtn = document.getElementById("admin-logout");

let villageData = [];
let currentOtp = "";
let verified = false;

const resetDashboard = () => {
  dashboardContent.innerHTML = "";
  const note = document.createElement("p");
  note.className = "muted";
  note.textContent = "Select your village and login to view details.";
  dashboardContent.appendChild(note);
};

const setSarpanchLoggedIn = (loggedIn) => {
  sarpanchAuthPanel.classList.toggle("hidden", loggedIn);
  sarpanchDashboardCard.classList.toggle("hidden", !loggedIn);
};

const setAdminLoggedIn = (loggedIn) => {
  adminAuthPanel.classList.toggle("hidden", loggedIn);
  adminDashboardCard.classList.toggle("hidden", !loggedIn);
};

const populateSelect = (select, items, placeholder) => {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    select.appendChild(option);
  });
};

const loadVillageData = async () => {
  const response = await fetch("data/villages.json");
  const data = await response.json();
  villageData = data.districts;
  populateSelect(districtSelect, villageData, "Choose district");
};

const loadSarpanches = async () => {
  const response = await fetch("data/sarpanches.json");
  const data = await response.json();
  return data.sarpanches;
};

const resetOtpState = () => {
  otpBtn.disabled = true;
  loginBtn.disabled = true;
  verified = false;
  otpInput.value = "";
  currentOtp = "";
  otpMessage.textContent = "OTP will be shown after generation.";
};

const handleDistrictChange = () => {
  const district = villageData.find((item) => item.name === districtSelect.value);
  mandalSelect.disabled = !district;
  villageSelect.disabled = true;
  resetOtpState();

  if (district) {
    populateSelect(mandalSelect, district.mandals, "Choose mandal");
    villageSelect.innerHTML = '<option value="">Choose village</option>';
  }
};

const handleMandalChange = () => {
  const district = villageData.find((item) => item.name === districtSelect.value);
  const mandal = district?.mandals.find((item) => item.name === mandalSelect.value);
  villageSelect.disabled = !mandal;
  resetOtpState();

  if (mandal) {
    populateSelect(villageSelect, mandal.villages, "Choose village");
  }
};

const handleVillageChange = () => {
  otpBtn.disabled = !villageSelect.value || !mobileInput.value;
  loginBtn.disabled = true;
  verified = false;
};

mobileInput.addEventListener("input", () => {
  otpBtn.disabled = !villageSelect.value || !mobileInput.value;
  loginBtn.disabled = true;
  verified = false;
});

stateSelect.addEventListener("change", () => {
  if (stateSelect.value !== "Andhra Pradesh") {
    districtSelect.innerHTML = '<option value="">Choose district</option>';
    districtSelect.disabled = true;
  } else {
    districtSelect.disabled = false;
    populateSelect(districtSelect, villageData, "Choose district");
  }
  mandalSelect.disabled = true;
  villageSelect.disabled = true;
  mandalSelect.innerHTML = '<option value="">Choose mandal</option>';
  villageSelect.innerHTML = '<option value="">Choose village</option>';
  resetOtpState();
});

districtSelect.addEventListener("change", handleDistrictChange);
mandalSelect.addEventListener("change", handleMandalChange);
villageSelect.addEventListener("change", handleVillageChange);

otpBtn.addEventListener("click", () => {
  currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMessage.textContent = `OTP sent to ${mobileInput.value}: ${currentOtp}`;
  verified = false;
  loginBtn.disabled = true;
});

verifyBtn.addEventListener("click", () => {
  if (otpInput.value === currentOtp && currentOtp.length === 6) {
    verified = true;
    loginBtn.disabled = false;
    otpMessage.textContent = "OTP verified successfully. You can login now.";
  } else {
    verified = false;
    loginBtn.disabled = true;
    otpMessage.textContent = "Incorrect OTP. Please try again.";
  }
});

sarpanchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!verified) {
    otpMessage.textContent = "Please verify OTP before login.";
    return;
  }

  const district = villageData.find((item) => item.name === districtSelect.value);
  const mandal = district?.mandals.find((item) => item.name === mandalSelect.value);
  const village = mandal?.villages.find((item) => item.name === villageSelect.value);
  if (!village) return;

  dashboardContent.innerHTML = "";
  const items = [
    { title: "State", value: "Andhra Pradesh" },
    { title: "District", value: district.name },
    { title: "Mandal", value: mandal.name },
    { title: "Village", value: village.name },
    { title: "Population", value: village.population.toLocaleString() },
    { title: "Households", value: village.households.toLocaleString() },
    { title: "Primary Occupation", value: village.primaryOccupation },
    { title: "Key Facilities", value: village.keyFacilities.join(", ") },
    { title: "Ongoing Projects", value: village.projects.join(", ") },
    { title: "Sarpanch", value: village.sarpanch }
  ];

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "dashboard-item";
    card.innerHTML = `<h4>${item.title}</h4><p>${item.value}</p>`;
    dashboardContent.appendChild(card);
  });

  setSarpanchLoggedIn(true);
});

sarpanchLogoutBtn.addEventListener("click", () => {
  sarpanchForm.reset();
  stateSelect.value = "Andhra Pradesh";
  mandalSelect.disabled = true;
  villageSelect.disabled = true;
  mandalSelect.innerHTML = '<option value="">Choose mandal</option>';
  villageSelect.innerHTML = '<option value="">Choose village</option>';
  populateSelect(districtSelect, villageData, "Choose district");
  resetOtpState();
  resetDashboard();
  setSarpanchLoggedIn(false);
});

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  if (email !== "admin@gmail.com" || password !== "12345") {
    adminMessage.textContent = "Invalid credentials. Please use the default admin login.";
    adminMessage.classList.add("badge");
    sarpanchTable.innerHTML = "";
    return;
  }

  adminMessage.textContent = "Access granted. Sarpanch list loaded.";
  adminMessage.classList.remove("badge");

  const sarpanches = await loadSarpanches();
  sarpanchTable.innerHTML = "";
  sarpanches.forEach((sarpanch) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <strong>${sarpanch.name}</strong>
      <span>${sarpanch.village}, ${sarpanch.mandal} (${sarpanch.district})</span>
      <span>Contact: ${sarpanch.contact}</span>
      <span>Tenure: ${sarpanch.tenure}</span>
      <span class="muted">Focus: ${sarpanch.focus}</span>
    `;
    sarpanchTable.appendChild(row);
  });

  setAdminLoggedIn(true);
});

adminLogoutBtn.addEventListener("click", () => {
  adminForm.reset();
  adminMessage.textContent = "Default email: admin@gmail.com | password: 12345";
  adminMessage.classList.remove("badge");
  sarpanchTable.innerHTML = "";
  setAdminLoggedIn(false);
});

resetDashboard();
setSarpanchLoggedIn(false);
setAdminLoggedIn(false);
loadVillageData();
