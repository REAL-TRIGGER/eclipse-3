import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://fjkybogixlqecziuxfui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const profilePicEl = document.getElementById("profilePic");
const dropdownMenu = document.getElementById("dropdownMenu");
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const avatarEl = document.getElementById("avatar");

// Nav Items
const navVIP = document.getElementById("nav-vip");
const navAdmin = document.getElementById("nav-addon");
const navOwner = document.getElementById("nav-owner");

async function initDashboard() {
    // 1. Check if user is logged in
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = "../index.html";
        return;
    }
    const user = session.user;

    // 2. Hide ALL role-gated nav items by default
    navVIP?.classList.add("hidden");
    navAdmin?.classList.add("hidden");
    navOwner?.classList.add("hidden");

    // 3. Fetch profile data
    const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .single();

    // 4. If profile fetch fails, treat as unauthorized
    if (profileError || !profile) {
        console.error("Profile fetch failed:", profileError);
        window.location.href = "../index.html";
        return;
    }

    // 5. Populate UI
    const userInfoEl = document.getElementById("userInfo");
    if (userInfoEl) userInfoEl.textContent = `Welcome, ${profile.full_name || "User"}!`;
    if (userNameEl) userNameEl.textContent = profile.full_name || "User";
    if (userEmailEl) userEmailEl.textContent = user.email;

    if (profile.avatar_url) {
        if (profilePicEl) profilePicEl.src = profile.avatar_url;
        if (avatarEl) avatarEl.src = profile.avatar_url;
    }

    // 6. Show nav items based on role
    const role = profile.role;

    if (["vip", "jr-mod", "mod", "admin", "owner"].includes(role)) {
        navVIP?.classList.remove("hidden");
    }
    if (["mod", "admin", "owner"].includes(role)) {
        navAdmin?.classList.remove("hidden");
    }
    if (role === "owner") {
        navOwner?.classList.remove("hidden");
    }
}

// Dropdown Toggle Logic
if (profilePicEl && dropdownMenu) {
    profilePicEl.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === "flex" ? "none" : "flex";
    });
    window.addEventListener("click", (e) => {
        if (!profilePicEl.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = "none";
        }
    });
}

// Logout buttons
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "../index.html";
});
document.getElementById("logoutBtn2")?.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "../index.html";
});

// Start with retry loop for OAuth redirect timing
async function start() {
    let session = null;
    let attempts = 0;

    while (!session && attempts < 5) {
        const { data } = await client.auth.getSession();
        session = data.session;
        if (!session) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    if (session) {
        await initDashboard();
    } else {
        window.location.href = "../index.html";
    }
}

start();
