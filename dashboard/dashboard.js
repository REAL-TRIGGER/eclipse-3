import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const client = createClient(
  "https://fjkybogixlqecziuxfui.supabase.co",
  "sb_publishable_SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_"
);

async function loadUser() {
  // Get session
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    window.location.href = "../index.html";
    return;
  }

  const user = session.user;

  // Load profile row from your `profiles` table
  const { data: profile, error } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Fallback if something is missing
  const role = profile?.role || "User";
  const fullName = profile?.full_name || user.user_metadata.full_name || "User";

  console.log("Loaded ROLE:", role);

  // Update UI
  document.getElementById("userInfo").innerText =
    `${fullName}\n${user.email}`;

  document.getElementById("userName").innerText = fullName;
  document.getElementById("userEmail").innerText = user.email;

  document.getElementById("profilePic").src =
    user.user_metadata.avatar_url || "images/defaultpfp.png";

  // Apply role-based visibility
  applyRoleVisibility(role);

  // Setup dropdown
  setupDropdown();
}

// Hide sidebar items based on role
function applyRoleVisibility(role) {
  const navVIP = document.getElementById("nav-vip");
  const navAdmin = document.getElementById("nav-addon");

  // VIP: only VIP, Admin, Owner
  if (role !== "VIP" && role !== "Admin" && role !== "Owner") {
    if (navVIP) navVIP.style.display = "none";
  }

  // Admin: only Admin + Owner
  if (role !== "Admin" && role !== "Owner") {
    if (navAdmin) navAdmin.style.display = "none";
  }
}

// Dropdown logic
function setupDropdown() {
  const profilePic = document.getElementById("profilePic");
  const dropdown = document.getElementById("dropdownMenu");

  profilePic.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", (e) => {
    if (!profilePic.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
}

// Logout
export async function logout() {
  await client.auth.signOut();
  window.location.href = "../index.html";
}

loadUser();
