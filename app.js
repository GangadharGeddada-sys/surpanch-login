const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

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

const adminForm = document.getElementById("admin-form");
const adminMessage = document.getElementById("admin-message");
const sarpanchTable = document.getElementById("sarpanch-table");

let villageData = [];
let currentOtp = "";
let verified = false;

const resetDashboard = () => {
  dashboardContent.innerHTML = "";
  const note = document.createElement("p");
  note.className = "muted";
  note.textContent = "Select a village and login to view the dashboard.";
  dashboardContent.appendChild(note);
};

const populateSelect = (select, items) => {
  select.innerHTML = "<option value=\"\">Choose option</option>";
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
  populateSelect(districtSelect, villageData);
};

const loadSarpanches = async () => {
  const response = await fetch("data/sarpanches.json");
  const data = await response.json();
  return data.sarpanches;
};

const handleDistrictChange = () => {
  const district = villageData.find((item) => item.name === districtSelect.value);
  mandalSelect.disabled = !district;
  villageSelect.disabled = true;
  otpBtn.disabled = true;
  loginBtn.disabled = true;
  verified = false;
  otpMessage.textContent = "OTP will be shown after generation.";
  otpInput.value = "";
  currentOtp = "";
  if (district) {
    populateSelect(mandalSelect, district.mandals);
    mandalSelect.value = "";
    villageSelect.innerHTML = "<option value=\"\">Choose village</option>";
  }
};

const handleMandalChange = () => {
  const district = villageData.find((item) => item.name === districtSelect.value);
  const mandal = district?.mandals.find((item) => item.name === mandalSelect.value);
  villageSelect.disabled = !mandal;
  otpBtn.disabled = true;
  loginBtn.disabled = true;
  verified = false;
  otpMessage.textContent = "OTP will be shown after generation.";
  otpInput.value = "";
  currentOtp = "";
  if (mandal) {
    populateSelect(villageSelect, mandal.villages);
    villageSelect.value = "";
  }
};

const handleVillageChange = () => {
  otpBtn.disabled = !villageSelect.value || !mobileInput.value;
  verified = false;
  loginBtn.disabled = true;
  otpMessage.textContent = "OTP will be shown after generation.";
  otpInput.value = "";
};

mobileInput.addEventListener("input", () => {
  otpBtn.disabled = !villageSelect.value || !mobileInput.value;
});

districtSelect.addEventListener("change", handleDistrictChange);
mandalSelect.addEventListener("change", handleMandalChange);
villageSelect.addEventListener("change", handleVillageChange);

otpBtn.addEventListener("click", () => {
  currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMessage.textContent = `OTP sent to ${mobileInput.value}: ${currentOtp}`;
  verified = false;
});

verifyBtn.addEventListener("click", () => {
  if (otpInput.value === currentOtp) {
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
});

resetDashboard();
loadVillageData();
