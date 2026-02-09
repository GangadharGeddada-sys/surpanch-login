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

const setViewMode = (mode) => {
  document.body.classList.remove("mode-public", "mode-sarpanch", "mode-admin");
  document.body.classList.add(`mode-${mode}`);
};

let villageData = [];
let otpRequestId = "";
let verificationToken = "";
let adminToken = "";

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

const resetDashboard = () => {
  dashboardContent.innerHTML = '<p class="muted">Select your village and login to view details.</p>';
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
  const data = await api("/api/locations");
  villageData = data.districts;
  populateSelect(districtSelect, villageData, "Choose district");
};

const resetOtpState = () => {
  otpBtn.disabled = true;
  loginBtn.disabled = true;
  otpInput.value = "";
  otpRequestId = "";
  verificationToken = "";
  otpMessage.textContent = "OTP will be sent from backend after generation.";
};

const handleDistrictChange = () => {
  const district = villageData.find((item) => item.name === districtSelect.value);
  mandalSelect.disabled = !district;
  villageSelect.disabled = true;
  villageSelect.innerHTML = '<option value="">Choose village</option>';
  resetOtpState();
  if (district) {
    populateSelect(mandalSelect, district.mandals, "Choose mandal");
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

const handleVillageOrMobileChange = () => {
  otpBtn.disabled = !villageSelect.value || !mobileInput.value;
  loginBtn.disabled = true;
};

stateSelect.addEventListener("change", () => {
  districtSelect.disabled = false;
  populateSelect(districtSelect, villageData, "Choose district");
  mandalSelect.disabled = true;
  villageSelect.disabled = true;
  mandalSelect.innerHTML = '<option value="">Choose mandal</option>';
  villageSelect.innerHTML = '<option value="">Choose village</option>';
  resetOtpState();
});

districtSelect.addEventListener("change", handleDistrictChange);
mandalSelect.addEventListener("change", handleMandalChange);
villageSelect.addEventListener("change", handleVillageOrMobileChange);
mobileInput.addEventListener("input", handleVillageOrMobileChange);

otpBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/otp/send", {
      method: "POST",
      body: JSON.stringify({
        mobile: mobileInput.value.trim(),
        district: districtSelect.value,
        mandal: mandalSelect.value,
        village: villageSelect.value
      })
    });
    otpRequestId = data.requestId;
    otpMessage.textContent = `OTP sent successfully. Demo OTP: ${data.devOtp}`;
  } catch (error) {
    otpMessage.textContent = error.message;
  }
});

verifyBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/otp/verify", {
      method: "POST",
      body: JSON.stringify({ requestId: otpRequestId, otp: otpInput.value.trim() })
    });
    verificationToken = data.verificationToken;
    loginBtn.disabled = false;
    otpMessage.textContent = "OTP verified successfully. You can login now.";
  } catch (error) {
    loginBtn.disabled = true;
    otpMessage.textContent = error.message;
  }
});

sarpanchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/api/sarpanch/login", {
      method: "POST",
      body: JSON.stringify({
        verificationToken,
        mobile: mobileInput.value.trim(),
        district: districtSelect.value,
        mandal: mandalSelect.value,
        village: villageSelect.value
      })
    });

    dashboardContent.innerHTML = "";
    const items = [
      { title: "State", value: data.state },
      { title: "District", value: data.district },
      { title: "Mandal", value: data.mandal },
      { title: "Village", value: data.village.name },
      { title: "Population", value: data.village.population.toLocaleString() },
      { title: "Households", value: data.village.households.toLocaleString() },
      { title: "Primary Occupation", value: data.village.primaryOccupation },
      { title: "Key Facilities", value: data.village.keyFacilities.join(", ") },
      { title: "Ongoing Projects", value: data.village.projects.join(", ") },
      { title: "Sarpanch", value: data.village.sarpanch }
    ];

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "dashboard-item";
      card.innerHTML = `<h4>${item.title}</h4><p>${item.value}</p>`;
      dashboardContent.appendChild(card);
    });

    setSarpanchLoggedIn(true);
    setViewMode("sarpanch");
  } catch (error) {
    otpMessage.textContent = error.message;
  }
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
  setViewMode("public");
});

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value.trim();
    const loginData = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    adminToken = loginData.token;
    adminMessage.textContent = "Access granted. Loading sarpanches...";
    adminMessage.classList.remove("badge");

    const sarpanchesData = await api("/api/admin/sarpanches", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    sarpanchTable.innerHTML = "";
    sarpanchesData.sarpanches.forEach((sarpanch) => {
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
    setViewMode("admin");
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.classList.add("badge");
    sarpanchTable.innerHTML = "";
  }
});

adminLogoutBtn.addEventListener("click", () => {
  adminForm.reset();
  adminToken = "";
  adminMessage.textContent = "Enter your admin credentials to continue.";
  adminMessage.classList.remove("badge");
  sarpanchTable.innerHTML = "";
  setAdminLoggedIn(false);
  setViewMode("public");
});

resetDashboard();
setSarpanchLoggedIn(false);
setAdminLoggedIn(false);
setViewMode("public");
loadVillageData();
