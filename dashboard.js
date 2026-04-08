import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const client = createClient(
  "https://fjkybogixlqecziuxfui.supabase.co",
  "sb_publishable_SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_"
);

async function protectPage() {
  const { data: sessionData } = await client.auth.getSession();

  if (!sessionData || !sessionData.session) {
    window.location.href = "../signin.html";
    return;
  }

  const user = sessionData.session.user;

  document.getElementById("user-email").innerText = user.email;
  document.getElementById("user-role").innerText =
    user.user_metadata?.role || "User";
}

protectPage();

window.logout = async function () {
  await client.auth.signOut();
  window.location.href = "../signin.html";
};
