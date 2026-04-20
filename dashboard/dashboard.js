import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://fjkybogixlqecziuxfui.supabase.co";
const SUPABASE_ANON_KEY = "sb-publishable-SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userInfoEl = document.getElementById("userInfo");
const profilePicEl = document.getElementById("profilePic");
const dropdownMenu = document.getElementById("dropdownMenu");
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");

const navHome = document.getElementById("nav-home");
const navVIP = document.getElementById("nav-vip");
const navAdmin = document.getElementById("nav-addon");
const navSettings = document.getElementById("nav-settings");
const navOwner = document.getElementById("nav-owner");

// Toggle profile dropdown
if (profilePicEl && dropdownMenu) {
  profilePicEl.addEventListener("click", () => {
    dropdownMenu.style.display =
      dropdownMenu.style.display === "flex" ? "none" : "flex";
  });

  window.addEventListener("click", (e) => {
    // If the click is NOT on the profile pic AND NOT on the menu, hide it
    if (!profilePicEl.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.style.display = "none";
    }
  });
}
// Logout → back to LOGIN at /index.html
export async function logout() {
  await client.auth.signOut();
  window.location.href = "../index.html";
}
window.logout = logout;

async function ensureProfile(user) {
  const { data: existing } = await client
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await client.from("profiles").insert({
      id: user.id,
      role: "User",
      full_name: user.user_metadata.full_name || "User"
    });
  }
}

async function loadUser() {
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    if (userInfoEl) {
      userInfoEl.textContent = "No session. Redirecting to login…";
    }
    // IMPORTANT: dashboard → login at ROOT
    window.location.href = "../index.html";
    return;
  }

  const user = session.user;

  await ensureProfile(user);

  const { data: profile } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "User";
  const fullName = profile?.full_name || user.user_metadata.full_name || "User";

  console.log("Loaded ROLE:", role);

  if (userInfoEl) {
    userInfoEl.textContent =
      `Name: ${fullName}\nEmail: ${user.email}\nRole: ${role}`;
  }

  if (userNameEl) userNameEl.textContent = fullName;
  if (userEmailEl) userEmailEl.textContent = user.email || "";

  if (user.user_metadata?.avatar_url && profilePicEl) {
    profilePicEl.src = user.user_metadata.avatar_url;
  } else if (profilePicEl) {
    profilePicEl.src =
      "https://api.dicebear.com/7.x/identicon/svg?seed=" +
      encodeURIComponent(fullName);
  }

  // Role-based nav visibility
  if (role !== "VIP" && role !== "Admin" && role !== "Owner") {
    if (navVIP) navVIP.style.display = "none";
  }

  if (role !== "Admin" && role !== "Owner") {
    if (navAdmin) navAdmin.style.display = "none";
  }

  if (role !== "Owner") {
    if (navOwner) navOwner.style.display = "none";
  }
}

loadUser();
