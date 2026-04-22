import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://fjkybogixlqecziuxfui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// All available permissions with friendly labels
const PERMISSIONS = [
  { key: "canBan",              label: "Ban Members",   icon: "fa-ban" },
  { key: "canMute",             label: "Mute Members",  icon: "fa-microphone-slash" },
  { key: "canManageLinks",      label: "Manage Links",  icon: "fa-link" },
  { key: "canManageRoles",      label: "Manage Roles",  icon: "fa-shield-halved" },
  { key: "canManageUsers",      label: "Manage Users",  icon: "fa-users" },
  { key: "canManageEverything", label: "Full Access",   icon: "fa-crown" },
];

// ─── OWNER AUTH CHECK ───────────────────────────────────
async function checkOwner() {
  const securityStatus = document.getElementById("securityStatus");
  const ownerNameEl = document.getElementById("ownerName");

  securityStatus.textContent = "Verifying session and role…";

  const { data: { session }, error: sessionError } = await client.auth.getSession();

  if (sessionError || !session) {
    securityStatus.textContent = "No session found. Redirecting to login…";
    window.location.href = "../index.html";
    return;
  }

  const user = session.user;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    securityStatus.textContent = "No profile found. Redirecting…";
    window.location.href = "index.html";
    return;
  }

  if (ownerNameEl && profile.full_name) {
    ownerNameEl.textContent = profile.full_name;
  }

  if (profile.role !== "owner") {
    securityStatus.textContent = "You are not Owner. Redirecting…";
    window.location.href = "index.html";
    return;
  }

  securityStatus.textContent = "Access granted. You have full Owner permissions.";
  loadRoles();
}

checkOwner();

// ─── LOAD ROLES ─────────────────────────────────────────
async function loadRoles() {
  const rolesList = document.getElementById("rolesList");
  rolesList.innerHTML = "<p style='color:#a0a4b8; font-size:13px;'>Loading roles...</p>";

  const { data: roles, error } = await client
    .from("roles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    rolesList.innerHTML = "<p style='color:#ff6b6b'>Error loading roles.</p>";
    return;
  }

  rolesList.innerHTML = roles.map(role => renderRoleCard(role)).join("");

  // Bind toggle events
  rolesList.querySelectorAll(".perm-toggle").forEach(toggle => {
    toggle.addEventListener("change", async (e) => {
      const roleId = e.target.dataset.roleId;
      const permKey = e.target.dataset.perm;
      const checked = e.target.checked;
      await updatePermission(roleId, permKey, checked);
    });
  });
}

// ─── RENDER ROLE CARD ───────────────────────────────────
function renderRoleCard(role) {
  const perms = role.permissions || {};

  const togglesHTML = PERMISSIONS.map(p => `
    <div class="perm-row">
      <div class="perm-label">
        <i class="fa-solid ${p.icon}"></i>
        <span>${p.label}</span>
      </div>
      <label class="toggle-switch">
        <input
          type="checkbox"
          class="perm-toggle"
          data-role-id="${role.id}"
          data-perm="${p.key}"
          ${perms[p.key] ? "checked" : ""}
        >
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join("");

  return `
    <div class="role-card" id="role-${role.id}">
      <div class="role-card-header">
        <div class="role-card-title">
          <span style="font-size:20px;">${role.icon || "🔵"}</span>
          <span>${role.name}</span>
        </div>
        <div class="role-card-actions">
          <button class="btn-edit-small" onclick="openEditRoleModal('${role.id}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-danger-small" onclick="deleteRole('${role.id}', '${role.name}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="perm-grid">
        ${togglesHTML}
      </div>
    </div>
  `;
}

// ─── UPDATE PERMISSION ──────────────────────────────────
async function updatePermission(roleId, permKey, value) {
  const { data: role } = await client
    .from("roles")
    .select("permissions")
    .eq("id", roleId)
    .single();

  const updated = { ...(role?.permissions || {}), [permKey]: value };

  const { error } = await client
    .from("roles")
    .update({ permissions: updated })
    .eq("id", roleId);

  if (error) {
    alert("Failed to update permission.");
    const toggle = document.querySelector(
      `.perm-toggle[data-role-id="${roleId}"][data-perm="${permKey}"]`
    );
    if (toggle) toggle.checked = !value;
  }
}

// ─── CREATE ROLE ────────────────────────────────────────
function openCreateRoleModal() {
  document.getElementById("createRoleModal")?.remove();

  document.body.insertAdjacentHTML("beforeend", `
    <div id="createRoleModal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        background: #11141b; border-radius: 12px; padding: 30px;
        width: 400px; border: 1px solid #222; box-shadow: 0 0 40px rgba(0,0,0,0.5);
      ">
        <h3 style="margin: 0 0 20px 0; font-size: 18px; color:white;">✨ Create New Role</h3>

        <div style="margin-bottom: 15px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Role Name</label>
          <input id="newRoleName" placeholder="e.g. Staff" style="
            width: 100%; padding: 10px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; color: white;
            font-size: 14px; box-sizing: border-box;
          "/>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Icon (emoji)</label>
          <input id="newRoleIcon" placeholder="e.g. 🔥" style="
            width: 100%; padding: 10px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; color: white;
            font-size: 14px; box-sizing: border-box;
          "/>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Color</label>
          <input id="newRoleColor" type="color" value="#4255ff" style="
            width: 100%; height: 40px; padding: 2px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; cursor: pointer;
            box-sizing: border-box;
          "/>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button onclick="document.getElementById('createRoleModal').remove()" style="
            background: #1a1d26; color: #a0a4b8; padding: 10px 16px;
            border-radius: 8px; border: none; cursor: pointer; font-size: 14px; margin-top:0;
          ">Cancel</button>
          <button onclick="submitCreateRole()" style="
            background: #4255ff; color: white; padding: 10px 16px;
            border-radius: 8px; border: none; cursor: pointer; font-size: 14px;
            font-weight: bold; margin-top:0;
          ">Create Role</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("newRoleName").focus();
}

async function submitCreateRole() {
  const name = document.getElementById("newRoleName").value.trim();
  const icon = document.getElementById("newRoleIcon").value.trim() || "🔵";
  const color = document.getElementById("newRoleColor").value;

  if (!name) {
    alert("Please enter a role name.");
    return;
  }

  const { error } = await client
    .from("roles")
    .insert({ name, permissions: {}, icon, color });

  if (error) {
    alert("Error creating role: " + error.message);
    return;
  }

  document.getElementById("createRoleModal").remove();
  loadRoles();
}

window.submitCreateRole = submitCreateRole;
document.getElementById("createRoleBtn").onclick = openCreateRoleModal;

// ─── EDIT ROLE ──────────────────────────────────────────
function openEditRoleModal(roleId) {
  const card = document.getElementById(`role-${roleId}`);
  const roleName = card.querySelector(".role-card-title span:last-child").textContent;
  const roleIcon = card.querySelector(".role-card-title span:first-child").textContent;

  document.getElementById("editRoleModal")?.remove();

  document.body.insertAdjacentHTML("beforeend", `
    <div id="editRoleModal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        background: #11141b; border-radius: 12px; padding: 30px;
        width: 400px; border: 1px solid #222; box-shadow: 0 0 40px rgba(0,0,0,0.5);
      ">
        <h3 style="margin: 0 0 20px 0; font-size: 18px; color:white;">✏️ Edit Role</h3>

        <div style="margin-bottom: 15px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Role Name</label>
          <input id="editRoleName" value="${roleName}" style="
            width: 100%; padding: 10px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; color: white;
            font-size: 14px; box-sizing: border-box;
          "/>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Icon (emoji)</label>
          <input id="editRoleIcon" value="${roleIcon}" style="
            width: 100%; padding: 10px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; color: white;
            font-size: 14px; box-sizing: border-box;
          "/>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display:block; font-size:13px; color:#a0a4b8; margin-bottom:6px;">Color</label>
          <input id="editRoleColor" type="color" value="#4255ff" style="
            width: 100%; height: 40px; padding: 2px; background: #0d0f14;
            border: 1px solid #333; border-radius: 6px; cursor: pointer;
            box-sizing: border-box;
          "/>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button onclick="document.getElementById('editRoleModal').remove()" style="
            background: #1a1d26; color: #a0a4b8; padding: 10px 16px;
            border-radius: 8px; border: none; cursor: pointer; font-size: 14px; margin-top:0;
          ">Cancel</button>
          <button onclick="submitEditRole('${roleId}')" style="
            background: #4255ff; color: white; padding: 10px 16px;
            border-radius: 8px; border: none; cursor: pointer; font-size: 14px;
            font-weight: bold; margin-top:0;
          ">Save Changes</button>
        </div>
      </div>
    </div>
  `);
}

async function submitEditRole(roleId) {
  const name = document.getElementById("editRoleName").value.trim();
  const icon = document.getElementById("editRoleIcon").value.trim() || "🔵";
  const color = document.getElementById("editRoleColor").value;

  if (!name) {
    alert("Please enter a role name.");
    return;
  }

  const { error } = await client
    .from("roles")
    .update({ name, icon, color })
    .eq("id", roleId);

  if (error) {
    alert("Error updating role: " + error.message);
    return;
  }

  document.getElementById("editRoleModal").remove();
  loadRoles();
}

window.submitEditRole = submitEditRole;
window.openEditRoleModal = openEditRoleModal;

// ─── DELETE ROLE ────────────────────────────────────────
async function deleteRole(id, name) {
  if (!confirm(`Delete the "${name}" role?`)) return;

  const { error } = await client
    .from("roles")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error deleting role: " + error.message);
    return;
  }

  loadRoles();
}

window.deleteRole = deleteRole;
