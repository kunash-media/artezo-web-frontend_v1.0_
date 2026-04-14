/**
 * auth.js — Clean User Authentication (Session + HttpOnly Cookies)
 * For use with Live Server proxy
 */

const UserAuth = (() => {
  const LOGIN_PAGE = "../LoginPage/login.html";
  const HOME_PAGE = "/index.html";

  console.log(`[UserAuth] Initializing in development mode`);
  console.log(`[UserAuth] Current origin: ${window.location.origin}`);
  console.log(`[UserAuth] Using proxy for /api requests`);

  // ====================== CORE API FETCH ======================
  async function apiFetch(path, options = {}) {
    const url = path.startsWith("/") ? path : `/${path}`;
    const config = {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    };

    console.log(`[API Fetch] ${options.method || "GET"} ${url} (via proxy)`);

    try {
      const response = await fetch(url, config);
      console.log(`[API Fetch] Response: ${response.status} ${url}`);
      return response;
    } catch (error) {
      console.error(`[API Fetch] Error on ${url}:`, error);
      throw error;
    }
  }

  // ====================== LOGIN ======================
  async function login(identifier, password) {
    console.log(`[Login] Attempting login for identifier: ${identifier}`);

    try {
      // Clear any previous session
      await clearExistingSession();

      const response = await fetch("/api/users/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      console.log(`[Login] Response status: ${response.status}`);

      let data = {};
      if (response.headers.get("content-type")?.includes("application/json")) {
        const text = await response.text();
        if (text.trim()) data = JSON.parse(text);
      }

      if (response.ok) {
        console.log(`[Login] ✅ Login successful`, data);

        // Store user info
        // Store user info
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
          localStorage.setItem(
            "userFirstName",
            data.firstName || data.userFirstName || "",
          );
          localStorage.setItem(
            "userLastName",
            data.lastName || data.userLastName || "",
          );

          // Better email handling
          if (data.email) {
            localStorage.setItem("userEmail", data.email);
          } else if (identifier.includes("@")) {
            localStorage.setItem("userEmail", identifier);
          }

          localStorage.setItem("lastLogin", new Date().toISOString());
        }

        // Verify session right after login
        await verifySession(data.userId || localStorage.getItem("userId"));

        return { success: true, data };
      } else {
        console.warn(`[Login] Failed:`, data);
        return {
          success: false,
          message:
            data.message || data.error || "Invalid email/phone or password",
        };
      }
    } catch (err) {
      console.error("[Login] Network/Parse error:", err);
      return {
        success: false,
        message: "Network error. Please check if backend is running.",
      };
    }
  }

  // ====================== VERIFY SESSION ======================
  async function verifySession(userId) {
    if (!userId) return false;

    try {
      const response = await apiFetch(`/api/users/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[Verify] Session is valid`, data);

        if (data.firstName)
          localStorage.setItem("userFirstName", data.firstName);
        if (data.lastName) localStorage.setItem("userLastName", data.lastName);

        return true;
      }
      console.log(`[Verify] Session check failed: ${response.status}`);
      return false;
    } catch (error) {
      console.error(`[Verify] Error:`, error);
      return false;
    }
  }

  // ====================== IS AUTHENTICATED ======================
  async function isAuthenticated() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.log("[Auth Check] No userId found in localStorage");
      return false;
    }
    return await verifySession(userId);
  }

  // ====================== LOGOUT ======================
  async function logout() {
    console.log("[Logout] Starting logout process");

    try {
      await fetch("/api/users/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("[Logout] Backend logout failed - clearing locally anyway");
    } finally {
      _clearSession();
      console.log("[Logout] Session cleared, redirecting to login");
      window.location.href = HOME_PAGE;
    }
  }

  function clearExistingSession() {
    console.log("[ClearSession] Clearing existing session before new login");
    _clearSession();
  }

  function _clearSession() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("lastLogin");
  }

  // ====================== ROUTE GUARDS ======================
  async function requireLogin() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log("[Route Guard] Not authenticated → redirecting to login");
      window.location.href = LOGIN_PAGE;
    }
    return authenticated;
  }

  async function redirectIfLoggedIn() {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      console.log("[Route Guard] Already logged in → redirecting to home");
      window.location.href = HOME_PAGE;
    }
  }

  // ====================== GET CURRENT USER ======================
  function getCurrentUser() {
    return {
      userId: localStorage.getItem("userId"),
      firstName: localStorage.getItem("userFirstName"),
      lastName: localStorage.getItem("userLastName"),
      email: localStorage.getItem("userEmail"),
      fullName:
        `${localStorage.getItem("userFirstName") || ""} ${localStorage.getItem("userLastName") || ""}`.trim(),
    };
  }

  // ====================== PUBLIC API ======================
  return {
    login,
    logout,
    isAuthenticated,
    requireLogin,
    redirectIfLoggedIn,
    apiFetch,
    getCurrentUser,
    verifySession,
    clearExistingSession,
  };
})();

// ====================== GLOBAL LOGOUT OVERLAY ======================
// ====================== GLOBAL LOGOUT OVERLAY ======================
/**
 * Shows confirmation overlay before logout.
 * Does NOT modify existing UserAuth.logout() logic.
 * Can be called from anywhere (header.js, etc.).
 */
// Update the showLogoutOverlay function in auth.js:
function showLogoutOverlay(message = "Are you sure you want to logout?") {
  if (document.getElementById("logoutOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "logoutOverlay";
  overlay.style.cssText = `
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%;
    background: rgba(0, 0, 0, 0.65); 
    backdrop-filter: blur(6px);
    display: flex; 
    justify-content: center; 
    align-items: center;
    z-index: 99999;
  `;

  overlay.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);">
      <div style="width: 72px; height: 72px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <i class="fa-solid fa-arrow-right-from-bracket" style="font-size: 34px; color: #dc2626;"></i>
      </div>
      <h3 style="font-size: 24px; font-weight: 700; color: #1D3C4A; margin-bottom: 12px;">Logout</h3>
      <p style="color: #6b7280; font-size: 15.5px; line-height: 1.5; margin-bottom: 32px;">${message}</p>
      
      <div style="display: flex; gap: 14px; justify-content: center;">
        <button id="logoutCancelBtn"
          style="flex: 1; background: #f3f4f6; color: #374151; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s ease;">
          Cancel
        </button>
        <button id="logoutConfirmBtn"
          style="flex: 1; background: #dc2626; color: white; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s ease;">
          Yes, Logout
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add hover effects
  const cancelBtn = document.getElementById("logoutCancelBtn");
  const confirmBtn = document.getElementById("logoutConfirmBtn");

  if (cancelBtn) {
    cancelBtn.onmouseover = () => (cancelBtn.style.background = "#e5e7eb");
    cancelBtn.onmouseout = () => (cancelBtn.style.background = "#f3f4f6");
  }

  if (confirmBtn) {
    confirmBtn.onmouseover = () => (confirmBtn.style.background = "#ef4444");
    confirmBtn.onmouseout = () => (confirmBtn.style.background = "#dc2626");
  }

  // Confirm → Call the confirmLogout handler
  document.getElementById("logoutConfirmBtn").onclick = async () => {
    overlay.remove();
    await confirmLogout(); // Call the new confirm handler
  };

  // Cancel → Just close overlay
  document.getElementById("logoutCancelBtn").onclick = () => {
    overlay.remove();
  };
}

// Add this new function to auth.js for the actual logout execution
async function confirmLogout() {
  console.log("[Auth] Executing logout with cleanup");

  // Close any open dropdowns/modals
  const desktopDropdown = document.getElementById("account-dropdown");
  if (desktopDropdown) desktopDropdown.classList.add("hidden");

  const mobileDropdown = document.getElementById("mobile-profile-dropdown");
  if (mobileDropdown && mobileDropdown.remove) {
    mobileDropdown.remove();
  }

  // Execute the actual logout logic
  await UserAuth.logout();
}

// Make confirmLogout available globally
window.confirmLogout = confirmLogout;
// ====================== MAKE AVAILABLE GLOBALLY ======================
window.UserAuth = UserAuth;
window.showLogoutOverlay = showLogoutOverlay;

console.log("[UserAuth] ✅ Module loaded with proxy support");
console.log("[UserAuth] Current origin:", window.location.origin);
console.log("[UserAuth] Current user:", UserAuth.getCurrentUser());
