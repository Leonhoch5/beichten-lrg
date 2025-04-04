document.addEventListener("DOMContentLoaded", async function () {
  // DOM Elements
  const loginSection = document.getElementById("loginSection");
  const adminContent = document.getElementById("adminContent");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const currentUserSpan = document.getElementById("currentUser");
  const passwordModal = document.getElementById("passwordModal");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const cancelPasswordChange = document.getElementById("cancelPasswordChange");
  const userManagementSection = document.getElementById(
    "userManagementSection"
  );
  const usersList = document.getElementById("usersList");
  const addUserBtn = document.getElementById("addUserBtn");
  const userModal = document.getElementById("userModal");
  const userForm = document.getElementById("userForm");
  const cancelUserModal = document.getElementById("cancelUserModal");
  const modalUsername = document.getElementById("modalUsername");
  const modalPassword = document.getElementById("modalPassword");
  const userId = document.getElementById("userId");
  const userModalTitle = document.getElementById("userModalTitle");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const editBeichteId = document.getElementById("editBeichteId");
  const editText = document.getElementById("editText");
  const editAge = document.getElementById("editAge");
  const editGender = document.getElementById("editGender");
  const cancelEdit = document.getElementById("cancelEdit");

  cancelEdit.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/beichten/${editBeichteId.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editText.value,
          age: editAge.value || null,
          gender: editGender.value || null,
        }),
      });

      if (response.ok) {
        editModal.style.display = "none";
        renderBeichten();
      } else {
        const error = await response.json();
        alert(error.error || "Aktualisierung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Error updating beichte:", error);
      alert("Aktualisierung fehlgeschlagen");
    }
  });

  // Check existing session
  async function checkSession() {
    try {
      const response = await fetch("/api/session");
      const data = await response.json();

      if (data.loggedIn) {
        loginSection.style.display = "none";
        adminContent.style.display = "block";
        currentUserSpan.textContent = data.user.username;

        // Only show user management for root
        userManagementSection.style.display =
          data.user.role === "root" ? "block" : "none";

        renderBeichten();
        if (data.user.role === "root") {
          renderUsers();
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  }

  // Handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        loginSection.style.display = "none";
        adminContent.style.display = "block";
        currentUserSpan.textContent = data.user.username;

        // Only show user management for root
        userManagementSection.style.display =
          data.user.role === "root" ? "block" : "none";

        renderBeichten();
        if (data.user.role === "root") {
          renderUsers();
        }
      } else {
        alert("Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login fehlgeschlagen. Bitte versuchen Sie es erneut.");
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        loginSection.style.display = "block";
        adminContent.style.display = "none";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  });

  // Handle password change
  changePasswordBtn.addEventListener("click", () => {
    passwordModal.style.display = "flex";
  });

  cancelPasswordChange.addEventListener("click", () => {
    passwordModal.style.display = "none";
    changePasswordForm.reset();
  });

  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    try {
      const response = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        alert("Passwort erfolgreich geändert.");
        passwordModal.style.display = "none";
        changePasswordForm.reset();
      } else {
        const error = await response.json();
        alert(error.error || "Passwortänderung fehlgeschlagen.");
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert("Passwortänderung fehlgeschlagen.");
    }
  });

  // Handle user management
  addUserBtn.addEventListener("click", () => {
    userModalTitle.textContent = "Moderator hinzufügen";
    userId.value = "";
    modalUsername.value = "";
    modalPassword.value = "";
    userModal.style.display = "flex";
  });

  cancelUserModal.addEventListener("click", () => {
    userModal.style.display = "none";
    userForm.reset();
  });

  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = modalUsername.value;
    const password = modalPassword.value;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role: "moderator",
        }),
      });

      if (response.ok) {
        userModal.style.display = "none";
        userForm.reset();
        renderUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Benutzererstellung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Benutzererstellung fehlgeschlagen");
    }
  });

  // Beichten management functions
  async function fetchPendingBeichten() {
    const response = await fetch("/api/beichten/pending");
    return await response.json();
  }

  async function fetchApprovedBeichten() {
    const response = await fetch("/api/beichten/approved");
    return await response.json();
  }

  async function approveBeichte(id) {
    await fetch(`/api/beichten/${id}/approve`, { method: "PUT" });
  }

  async function rejectBeichte(id) {
    await fetch(`/api/beichten/${id}`, { method: "DELETE" });
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("de-DE");
  }

function createBeichteElement(beichte, isPending) {
    const div = document.createElement('div');
    div.className = 'beichte';
    div.dataset.id = beichte.id;
    
    let html = `
        <div class="beichte-text">${beichte.text}</div>
        <div class="beichte-meta">
            <span class="date">${formatDate(beichte.timestamp)}</span>
    `;
    
    if (beichte.age || beichte.gender) {
        if (beichte.age) html += `<span class="age">👤 ${beichte.age}</span>`;
        if (beichte.gender) {
            const emoji = beichte.gender === 'männlich' ? '👨' : 
                         beichte.gender === 'weiblich' ? '👩' : '🧑';
            html += `<span class="gender">${emoji}</span>`;
        }
    }
    
    html += `</div><div class="actions">`;
    
    if (isPending) {
        html += `
            <button class="approve">👍 Freigeben</button>
            <button class="reject">👎 Ablehnen</button>
        `;
    } else {
        html += `
            <button class="edit">✏️ Bearbeiten</button>
            <button class="delete">🗑️ Löschen</button>
        `;
    }
    
    html += `</div>`;
    div.innerHTML = html;
    
    // Add event listeners
    if (isPending) {
        div.querySelector('.approve').addEventListener('click', async () => {
            await fetch(`/api/beichten/${beichte.id}/approve`, { method: 'PUT' });
            renderBeichten();
        });
        
        div.querySelector('.reject').addEventListener('click', async () => {
            if (confirm('Möchten Sie diese Beichte wirklich ablehnen?')) {
                await fetch(`/api/beichten/${beichte.id}`, { method: 'DELETE' });
                renderBeichten();
            }
        });
    } else {
        div.querySelector('.edit').addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/beichten/${beichte.id}`);
                const beichteData = await response.json();
                openEditModal(beichteData);
            } catch (error) {
                console.error('Error fetching beichte:', error);
            }
        });
        
        div.querySelector('.delete').addEventListener('click', async () => {
            if (confirm('Möchten Sie diese Beichte wirklich löschen?')) {
                await fetch(`/api/beichten/${beichte.id}`, { method: 'DELETE' });
                renderBeichten();
            }
        });
    }
    
    return div;
}

function openEditModal(beichte) {
    editBeichteId.value = beichte.id;
    editText.value = beichte.text;
    editAge.value = beichte.age || '';
    editGender.value = beichte.gender || '';
    editModal.style.display = 'flex';
}


  async function renderBeichten() {
    try {
      // Render pending beichten
      const pendingList = document.getElementById("pendingList");
      pendingList.innerHTML = "";
      const pending = await fetchPendingBeichten();

      if (pending.length === 0) {
        pendingList.innerHTML =
          '<p class="no-beichten">Keine ausstehenden Beichten.</p>';
      } else {
        pending.forEach((beichte) => {
          const beichteEl = createBeichteElement(beichte, true);
          pendingList.appendChild(beichteEl);
        });
      }

      // Render approved beichten
      const approvedList = document.getElementById("approvedList");
      approvedList.innerHTML = "";
      const approved = await fetchApprovedBeichten();

      if (approved.length === 0) {
        approvedList.innerHTML =
          '<p class="no-beichten">Noch keine freigegebenen Beichten.</p>';
      } else {
        approved.forEach((beichte) => {
          const beichteEl = createBeichteElement(beichte, false);
          approvedList.appendChild(beichteEl);
        });
      }
    } catch (error) {
      console.error("Error rendering beichten:", error);
    }
  }

  // User management functions
  async function fetchUsers() {
    const response = await fetch("/api/users");
    return await response.json();
  }

  async function deleteUser(id) {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    return await response.json();
  }

  function renderUsers() {
    fetchUsers()
      .then((users) => {
        usersList.innerHTML = "";

        if (users.length === 0) {
          usersList.innerHTML = "<p>Keine Benutzer gefunden.</p>";
          return;
        }

        users.forEach((user) => {
          const userEl = document.createElement("div");
          userEl.className = "user-item";
          userEl.innerHTML = `
                    <div>
                        <strong>${user.username}</strong>
                        <span>(${user.role})</span>
                        <small>Erstellt am: ${new Date(
                          user.created_at
                        ).toLocaleDateString()}</small>
                    </div>
                    <div class="user-actions">
                        ${
                          user.role !== "root"
                            ? `<button class="delete-user" data-id="${user.id}">Löschen</button>`
                            : ""
                        }
                    </div>
                `;
          usersList.appendChild(userEl);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-user").forEach((button) => {
          button.addEventListener("click", async (e) => {
            if (confirm("Möchten Sie diesen Benutzer wirklich löschen?")) {
              const id = e.target.dataset.id;
              await deleteUser(id);
              renderUsers();
            }
          });
        });
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        usersList.innerHTML = "<p>Fehler beim Laden der Benutzer.</p>";
      });
  }

  // Initialize
  await checkSession();
});
