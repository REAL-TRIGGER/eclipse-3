import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkOwner() {
  const securityStatus = document.getElementById("securityStatus");
  const ownerNameEl = document.getElementById("ownerName");

  securityStatus.textContent = "Verifying session and role…";

  const { data: { session }, error: sessionError } = await client.auth.getSession();

  if (sessionError || !session) {
    securityStatus.textContent = "No session found. Redirecting to login…";
    window.location.href = "../index.html"; // LOGIN PAGE
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
    window.location.href = "index.html"; // DASHBOARD
    return;
  }

  if (ownerNameEl && profile.full_name) {
    ownerNameEl.textContent = profile.full_name;
  }

  if (profile.role !== "Owner") {
    securityStatus.textContent = "You are not Owner. Redirecting…";
    window.location.href = "index.html"; // DASHBOARD
    return;
  }

  securityStatus.textContent = "Access granted. You have full Owner permissions.";
}

checkOwner();
