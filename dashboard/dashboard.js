import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const client = createClient(
  "https://fjkybogixlqecziuxfui.supabase.co",
  "sb_publishable_SjaaZzJG2Q7SLPSQD3hKOg_9h-BNCk_"
);

// Protect the dashboard
async function loadUser() {
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    // Not logged in → send back to login
    window.location.href = "../index.html";
    return;
  }

  const user = session.user;

  // Display user info
  document.getElementById("userInfo").innerHTML = `
    <strong>${user.user_metadata.full_name}</strong><br>
    ${user.email}
  `;
}

loadUser();

// Logout function
window.logout = async () => {
  await client.auth.signOut();
  window.location.href = "../index.html";
};
