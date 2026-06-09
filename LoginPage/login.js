// Global vars for forgot password
    let currentEmail = '', timerInterval = null, timeLeft = 30;

    function togglePassword(inputId, iconId) {
      const input = document.getElementById(inputId);
      const icon = document.getElementById(iconId);
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    }

    function toggleAuth() {
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      const loginHeader = document.getElementById("loginHeader");
      const signupHeader = document.getElementById("signupHeader");
      const loginToggle = document.getElementById("loginToggleText");
      const signupToggle = document.getElementById("signupToggleText");

      loginForm.classList.toggle("hidden");
      signupForm.classList.toggle("hidden");
      loginHeader.classList.toggle("hidden");
      signupHeader.classList.toggle("hidden");
      loginToggle.classList.toggle("hidden");
      signupToggle.classList.toggle("hidden");
    }

    // ENHANCED Signup handler with backend API integration (UI unchanged)
    async function signupUser(event) {
      event.preventDefault();

      const firstName = document.getElementById("firstName")?.value.trim() || "";
      const middleName = document.getElementById("middleName")?.value.trim() || "";
      const lastName = document.getElementById("lastName")?.value.trim() || "";
      const email = document.getElementById("signupEmail")?.value.trim() || "";
      const phone = document.getElementById("signupPhone")?.value.trim() || "";
      const password = document.getElementById("signupPassword")?.value || "";
      const confirmPass = document.getElementById("confirmPassword")?.value || "";
      const address = document.getElementById("address")?.value.trim() || "";
      const flatNo = document.getElementById("flatNo")?.value.trim() || "";
      const city = document.getElementById("city")?.value.trim() || "";
      const state = document.getElementById("state")?.value.trim() || "";
      const pincode = document.getElementById("pincode")?.value.trim() || "";
      const nearBy = document.getElementById("nearBy")?.value.trim() || "";
      const landmark = document.getElementById("landmark")?.value.trim() || "";

      if (!firstName) { showToast("First name is required", "error"); return; }
      if (!email) { showToast("Email is required", "error"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Invalid email format", "error"); return; }
      if (!phone) { showToast("Phone number is required", "error"); return; }
      if (!password) { showToast("Password is required", "error"); return; }
      if (password !== confirmPass) { showToast("Passwords do not match", "error"); return; }
      if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
      if (pincode && pincode.length !== 6) { showToast("Pincode must be 6 digits", "error"); return; }

      const payload = {
        firstName, middleName, lastName, email, phone, password,
        address, flatNo, city, state, pincode, nearBy, landmark
      };

      const submitBtn = document.getElementById("signupSubmitBtn");
      const originalBtnText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Creating Account...';
      submitBtn.classList.add("opacity-70", "cursor-not-allowed");

      try {
        const response = await fetch("http://localhost:8085/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          showToast(data.message || "Account created successfully!", "success");

          document.getElementById("firstName").value = "";
          document.getElementById("middleName").value = "";
          document.getElementById("lastName").value = "";
          document.getElementById("signupEmail").value = "";
          document.getElementById("signupPhone").value = "";
          document.getElementById("signupPassword").value = "";
          document.getElementById("confirmPassword").value = "";
          document.getElementById("address").value = "";
          document.getElementById("flatNo").value = "";
          document.getElementById("city").value = "";
          document.getElementById("state").value = "";
          document.getElementById("pincode").value = "";
          document.getElementById("nearBy").value = "";
          document.getElementById("landmark").value = "";
          document.getElementById("signupStrengthBar").style.width = "0%";

          setTimeout(() => { toggleAuth(); }, 1500);
        } else {
          const errorMsg = data.message || data.error || "Registration failed. Please try again.";
          if (errorMsg.toLowerCase().includes("email") || errorMsg.toLowerCase().includes("duplicate")) {
            showToast("Email already registered. Please use a different email or login.", "error");
          } else if (errorMsg.toLowerCase().includes("phone")) {
            showToast("Phone number already registered.", "error");
          } else {
            showToast(errorMsg, "error");
          }
        }
      } catch (error) {
        console.error("Signup API error:", error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          showToast("Cannot connect to server. Please check if backend is running at http://localhost:8085", "error");
        } else {
          showToast("Network error. Please check your connection and try again.", "error");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
      }
    }

    // Enhanced loginUser function with proper response handling
    async function loginUser(event) {
      event.preventDefault();

      const identifier = document.getElementById("loginPhone").value;
      const password = document.getElementById("password").value;

      if (!identifier || !password) {
        showToast("Please enter email/phone and password", "error");
        return;
      }

      const payload = { identifier: identifier, password: password };

      try {
        const response = await fetch("http://localhost:8085/api/users/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        const contentType = response.headers.get("content-type");
        let data = {};
        if (contentType && contentType.includes("application/json")) {
          const textResponse = await response.text();
          if (textResponse && textResponse.trim()) {
            data = JSON.parse(textResponse);
          }
        }

        if (response.ok) {
          if (data.userId) {
            localStorage.setItem("userId", data.userId);
          }
          showToast("Login successful!", "success");
          if (typeof updateMobileLoginButton === "function") {
            updateMobileLoginButton();
          }
          setTimeout(() => { window.location.href = "/index.html"; }, 1200);
        } else {
          const errorMessage = data.message || "Invalid credentials";
          showToast(errorMessage, "error");
        }
      } catch (error) {
        console.error("Login error:", error);
        showToast("Server error. Please try again.", "error");
      }
    }

    // Password strength for signup
    function checkSignupStrength() {
      const pass = document.getElementById("signupPassword")?.value || "";
      const bar = document.getElementById("signupStrengthBar");
      const textEl = document.getElementById("signupStrengthText");
      let strength = 0;
      if (pass.length >= 6) strength++;
      if (/[A-Z]/.test(pass)) strength++;
      if (/[0-9]/.test(pass)) strength++;
      if (/[@$!%*?&#]/.test(pass)) strength++;

      if (!pass) {
        bar.style.width = "0%"; bar.style.background = "#e5e7eb";
        textEl.innerText = "Password strength"; textEl.className = "text-xs text-gray-400 mt-1";
      } else if (strength === 1) {
        bar.style.width = "25%"; bar.style.background = "#ef4444";
        textEl.innerText = "Weak"; textEl.className = "text-xs text-red-500 mt-1";
      } else if (strength === 2) {
        bar.style.width = "50%"; bar.style.background = "#f97316";
        textEl.innerText = "Fair"; textEl.className = "text-xs text-orange-500 mt-1";
      } else if (strength === 3) {
        bar.style.width = "75%"; bar.style.background = "#eab308";
        textEl.innerText = "Good"; textEl.className = "text-xs text-yellow-600 mt-1";
      } else {
        bar.style.width = "100%"; bar.style.background = "#10b981";
        textEl.innerText = "Strong"; textEl.className = "text-xs text-green-600 mt-1";
      }
    }

    document.getElementById("signupPassword")?.addEventListener("input", checkSignupStrength);

    function showToast(message, type) {
      const container = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";
      toast.className = `${bgColor} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-slideIn text-sm`;
      toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // ─── FORGOT PASSWORD ────────────────────────────────────────────────────────

    function openForgotModal() {
      document.getElementById("forgotModal").classList.remove("hidden");
      document.getElementById("forgotModal").style.display = "flex";
      resetForgotSteps();
    }

    function closeForgotModal() {
      document.getElementById("forgotModal").style.display = "none";
      document.getElementById("forgotModal").classList.add("hidden");
      if (timerInterval) clearInterval(timerInterval);
      // Clear OTP inputs
      for (let i = 0; i < 6; i++) {
        const inp = document.getElementById(`otp${i}`);
        if (inp) inp.value = "";
      }
      // Clear password fields
      const np = document.getElementById("newPassword");
      const cp = document.getElementById("confirmPasswordReset");
      if (np) np.value = "";
      if (cp) cp.value = "";
      const bar = document.getElementById("strengthBar");
      if (bar) { bar.style.width = "0%"; }
    }

    function resetForgotSteps() {
      document.getElementById("step1").style.display = "block";
      document.getElementById("step2").style.display = "none";
      document.getElementById("step3").style.display = "none";
      document.getElementById("step4").style.display = "none";
      document.getElementById("emailInput").value = "";
      document.getElementById("emailError").classList.add("hidden");
      updateForgotSteps(1);
    }

    function updateForgotSteps(step) {
      for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`stepIndicator${i}`);
        const line = document.getElementById(`line${i - 1}`);
        if (i <= step) {
          ind.classList.add("active");
          if (line) line.classList.add("active");
        } else {
          ind.classList.remove("active");
          if (line) line.classList.remove("active");
        }
      }
    }

    // STEP 1 — Send OTP via API
    async function sendOTP() {
      const email = document.getElementById("emailInput").value.trim();
      const emailErrorEl = document.getElementById("emailError");
      const sendBtn = document.querySelector("#step1 button[onclick='sendOTP()']");

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailErrorEl.innerText = "Please enter a valid email address";
        emailErrorEl.classList.remove("hidden");
        return;
      }
      emailErrorEl.classList.add("hidden");

      // Loading state
      const originalText = sendBtn.innerHTML;
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending OTP...';

      try {
        const response = await fetch("http://localhost:8085/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          currentEmail = email;
          // Show masked email in step 2 (e.g. su***@gmail.com)
          const maskedEmail = maskEmail(email);
          document.getElementById("emailDisplay").innerText = maskedEmail;

          showToast("OTP sent successfully!", "success");
          document.getElementById("step1").style.display = "none";
          document.getElementById("step2").style.display = "block";
          updateForgotSteps(2);
          startTimer();
          // Focus first OTP box
          setTimeout(() => { document.getElementById("otp0")?.focus(); }, 100);
        } else {
          const msg = data.message || data.error || "Failed to send OTP. Please try again.";
          emailErrorEl.innerText = msg;
          emailErrorEl.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Send OTP error:", error);
        emailErrorEl.innerText = "Network error. Please check your connection.";
        emailErrorEl.classList.remove("hidden");
      } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
      }
    }

    // Mask email for display: su***@gmail.com
    function maskEmail(email) {
      const [local, domain] = email.split("@");
      if (local.length <= 2) return `${local[0]}***@${domain}`;
      return `${local.substring(0, 2)}${"*".repeat(Math.min(local.length - 2, 4))}@${domain}`;
    }

    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timeLeft = 30;
      const timerSpan = document.getElementById("timer");
      const resendWrapper = document.getElementById("resendWrapper");

      // Hide resend link, show countdown
      if (resendWrapper) resendWrapper.style.display = "none";
      const countdownEl = document.getElementById("countdownEl");
      if (countdownEl) countdownEl.style.display = "block";

      if (timerSpan) timerSpan.innerText = timeLeft;

      timerInterval = setInterval(() => {
        timeLeft--;
        if (timerSpan) timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          // Show resend option when timer ends
          if (resendWrapper) resendWrapper.style.display = "block";
          if (countdownEl) countdownEl.style.display = "none";
        }
      }, 1000);
    }

    // Resend OTP
    async function resendOTP() {
      const resendBtn = document.getElementById("resendBtn");
      if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.innerText = "Sending...";
      }

      try {
        const response = await fetch("http://localhost:8085/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          showToast("OTP resent successfully!", "success");
          // Clear existing OTP inputs
          for (let i = 0; i < 6; i++) {
            const inp = document.getElementById(`otp${i}`);
            if (inp) inp.value = "";
          }
          document.getElementById("otpError").classList.add("hidden");
          startTimer();
          setTimeout(() => { document.getElementById("otp0")?.focus(); }, 100);
        } else {
          showToast(data.message || "Failed to resend OTP.", "error");
        }
      } catch (error) {
        showToast("Network error. Please try again.", "error");
      } finally {
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.innerText = "Resend OTP";
        }
      }
    }

    // STEP 2 — Verify OTP via API
    async function verifyOTP() {
      let otp = "";
      for (let i = 0; i < 6; i++) otp += document.getElementById(`otp${i}`).value;

      const otpErrorEl = document.getElementById("otpError");

      if (otp.length < 6) {
        otpErrorEl.innerText = "Please enter the complete 6-digit OTP";
        otpErrorEl.classList.remove("hidden");
        return;
      }
      otpErrorEl.classList.add("hidden");

      const verifyBtn = document.querySelector("#step2 button[onclick='verifyOTP()']");
      const originalText = verifyBtn.innerHTML;
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Verifying...';

      try {
        const response = await fetch("http://localhost:8085/api/otp/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, otp })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          if (timerInterval) clearInterval(timerInterval);
          showToast("OTP verified!", "success");
          document.getElementById("step2").style.display = "none";
          document.getElementById("step3").style.display = "block";
          updateForgotSteps(3);
          setTimeout(() => { document.getElementById("newPassword")?.focus(); }, 100);
        } else {
          const msg = data.message || data.error || "Invalid or expired OTP. Please try again.";
          otpErrorEl.innerText = msg;
          otpErrorEl.classList.remove("hidden");
          // Shake OTP inputs for visual feedback
          const otpContainer = document.getElementById("otpContainer");
          if (otpContainer) {
            otpContainer.style.animation = "shake 0.4s ease";
            setTimeout(() => { otpContainer.style.animation = ""; }, 400);
          }
        }
      } catch (error) {
        console.error("Verify OTP error:", error);
        otpErrorEl.innerText = "Network error. Please try again.";
        otpErrorEl.classList.remove("hidden");
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = originalText;
      }
    }

    // STEP 3 — Reset Password via API
    async function updatePassword() {
      const newPass = document.getElementById("newPassword").value;
      const confirmPass = document.getElementById("confirmPasswordReset").value;
      const passErrorEl = document.getElementById("passError");

      if (newPass.length < 6) {
        passErrorEl.innerText = "Password must be at least 6 characters";
        passErrorEl.classList.remove("hidden");
        return;
      }
      if (newPass !== confirmPass) {
        passErrorEl.innerText = "Passwords do not match";
        passErrorEl.classList.remove("hidden");
        return;
      }
      passErrorEl.classList.add("hidden");

      // We need the OTP from step 2 for the reset-password payload
      let otp = "";
      for (let i = 0; i < 6; i++) otp += (document.getElementById(`otp${i}`)?.value || "");

      const updateBtn = document.querySelector("#step3 button[onclick='updatePassword()']");
      const originalText = updateBtn.innerHTML;
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Updating...';

      try {
        const response = await fetch("http://localhost:8085/api/otp/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, otp, newPassword: newPass })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          document.getElementById("step3").style.display = "none";
          document.getElementById("step4").style.display = "block";
          updateForgotSteps(4);
        } else {
          const msg = data.message || data.error || "Failed to reset password. Please try again.";
          passErrorEl.innerText = msg;
          passErrorEl.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Reset password error:", error);
        passErrorEl.innerText = "Network error. Please try again.";
        passErrorEl.classList.remove("hidden");
      } finally {
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalText;
      }
    }

    function checkStrength() {
      const pass = document.getElementById("newPassword").value;
      const bar = document.getElementById("strengthBar");
      let s = 0;
      if (pass.length >= 6) s++;
      if (/[A-Z]/.test(pass)) s++;
      if (/[0-9]/.test(pass)) s++;
      if (/[@$!%*?&#]/.test(pass)) s++;
      if (s === 1) { bar.style.width = "25%"; bar.style.background = "#ef4444"; }
      else if (s === 2) { bar.style.width = "50%"; bar.style.background = "#f97316"; }
      else if (s === 3) { bar.style.width = "75%"; bar.style.background = "#eab308"; }
      else if (s >= 4) { bar.style.width = "100%"; bar.style.background = "#10b981"; }
      else { bar.style.width = "0%"; bar.style.background = "#e5e7eb"; }
    }

    // OTP input — auto-advance and backspace handling
    for (let i = 0; i < 6; i++) {
      const inp = document.getElementById(`otp${i}`);
      if (!inp) continue;

      inp.addEventListener("input", (e) => {
        // Allow only digits
        inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (inp.value.length === 1 && i < 5) {
          document.getElementById(`otp${i + 1}`).focus();
        }
      });

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && i > 0) {
          document.getElementById(`otp${i - 1}`).focus();
        }
      });

      inp.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
        for (let j = 0; j < pasted.length && j < 6; j++) {
          const box = document.getElementById(`otp${j}`);
          if (box) box.value = pasted[j];
        }
        const lastFilled = Math.min(pasted.length, 5);
        document.getElementById(`otp${lastFilled}`)?.focus();
      });
    }