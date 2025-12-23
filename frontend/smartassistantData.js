// ================== SMART ASSISTANT DATA LOADER ==================
// Smart assistant logic
const API_BASE_URL = window.location.hostname.includes("vercel.app")
  ? "https://atom-bank-backend.onrender.com"
  : "";

(async function loadSmartAssistantData() {
  // Wait for auth check to complete (with timeout)
  await new Promise((resolve) => {
    if (window.currentUser) {
      resolve();
    } else {
      // Listen for userLoaded event
      window.addEventListener("userLoaded", function handler() {
        window.removeEventListener("userLoaded", handler);
        resolve();
      });
    }
  });

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    await new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve);
    });
  }

  const chatContainer = document.getElementById("chatContainer");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  if (!chatContainer || !chatInput || !sendBtn) return;

  function addMessage(message, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser
      ? "message user-message"
      : "message bot-message";
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = "";

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      addMessage(
        data.response || "I'm here to help you with your banking needs!"
      );
    } catch (err) {
      console.error("Error sending message:", err);
      addMessage(
        "Sorry, I'm having trouble right now. Please try again later."
      );
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
})();
