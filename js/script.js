// 1. 禁止多指缩放与 iOS 缩放手势
document.addEventListener(
  "touchstart",
  function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false },
);
document.addEventListener("gesturestart", function (event) {
  event.preventDefault();
});

// ================= 配置区 =================
const DIFY_API_KEY = "app-FIpRN8ln822KtJ3k0Gb3578M";
const DIFY_API_URL = "https://567809b6.r31.cpolar.top/v1";
const USERS = { abee: "123456", guest: "888888" };
const OPENING_STATEMENT =
  "你好！我是你的书籍掌握助手。很高兴能陪你一起开启这段读书之旅。";

let currentUser = "";
let conversationId = "";

// ================= 工具函数 =================

function toggleSidebar(show) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (show) {
    sidebar.classList.remove("-translate-x-full");
    overlay.style.display = "block";
    setTimeout(() => (overlay.style.opacity = "1"), 10);
  } else {
    sidebar.classList.add("-translate-x-full");
    overlay.style.opacity = "0";
    setTimeout(() => (overlay.style.display = "none"), 600);
  }
}

function setStatus(text, colorClass) {
  const dot = document.getElementById("conn-status");
  const txt = document.getElementById("status-text");
  if (dot && txt) {
    dot.className = `status-dot ${colorClass}`;
    txt.innerText = text;
  }
}

// ================= 核心逻辑 =================

async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (USERS[user] && USERS[user] === pass) {
        // --- 核心修改：仅在移动端（宽度 < 768px）尝试进入全屏 ---
        if (window.innerWidth < 768) {
            try { 
                enterFullscreen(); 
            } catch(e) {
                console.log("全屏请求未能成功执行");
            }
        }
        
        currentUser = user;
        const loginSec = document.getElementById('login-section');
        loginSec.style.opacity = '0';
        loginSec.style.transform = 'translateY(-40px) scale(0.96)';
        loginSec.style.filter = 'blur(15px)';
        
        setTimeout(() => {
            loginSec.classList.add('hidden');
            document.getElementById('chat-section').classList.remove('hidden');
            document.getElementById('user-name-label').innerText = currentUser;
            document.getElementById('user-avatar').innerText = currentUser.substring(0,1).toUpperCase();
            fetchHistory();
            showOpeningMessage();
        }, 800);
    } else {
        const err = document.getElementById('login-error');
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 3000);
    }
}


function handleLogout() {
  currentUser = "";
  conversationId = "";
  const chatSec = document.getElementById("chat-section");
  chatSec.style.opacity = "0";
  chatSec.style.transform = "scale(1.03)";
  chatSec.style.filter = "blur(20px)";
  setTimeout(() => {
    chatSec.classList.add("hidden");
    chatSec.style.opacity = "1";
    chatSec.style.transform = "none";
    chatSec.style.filter = "none";
    const loginSec = document.getElementById("login-section");
    loginSec.classList.remove("hidden");
    loginSec.style.opacity = "1";
    loginSec.style.transform = "none";
    loginSec.style.filter = "none";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("chat-box").innerHTML = "";
    document.getElementById("history-list").innerHTML = "";
    document.getElementById("display-cid").innerText = `会话: 新`;
    toggleSidebar(false);
    setStatus("工作站已连接", "bg-emerald-500");
  }, 800);
}

function showOpeningMessage() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  setTimeout(() => appendMessage("ai", OPENING_STATEMENT), 700);
}

function startNewChat() {
  conversationId = "";
  document.getElementById("display-cid").innerText = `会话: 新`;
  showOpeningMessage();
  document
    .querySelectorAll(".history-item")
    .forEach((el) => el.classList.remove("active"));
}

// 优化 FetchHistory 以修复 "Failed to fetch" 问题
async function fetchHistory() {
  if (!currentUser) return;
  try {
    // 增加 mode: cors 和更明确的错误检查
    const response = await fetch(
      `${DIFY_API_URL}/conversations?user=${currentUser}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      },
    );

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    const listEl = document.getElementById("history-list");
    listEl.innerHTML = "";

    if (data.data && data.data.length > 0) {
      data.data.forEach((conv, index) => {
        const item = document.createElement("div");
        item.style.animationDelay = `${index * 0.08}s`;
        item.className = `history-item p-6 cursor-pointer flex items-center justify-between group msg-enter ${conv.id === conversationId ? "active" : ""}`;
        const time = new Date(conv.created_at * 1000).toLocaleDateString();
        item.innerHTML = `
                            <div class="flex-1 min-w-0 pr-2" onclick="loadConversation('${conv.id}'); toggleSidebar(false);">
                                <p class="text-[13px] font-bold truncate text-slate-800 tracking-tight">${conv.name || "历史反思记录"}</p>
                                <p class="text-[9px] text-slate-400 mt-2 tracking-[0.2em] font-black uppercase opacity-60">${time}</p>
                            </div>
                            <button onclick="deleteConversation('${conv.id}', event)" class="delete-btn p-3 hover:bg-rose-100 rounded-2xl group/del transition-all active:scale-90">
                                <svg class="w-5 h-5 text-slate-400 group-hover/del:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                        `;
        listEl.appendChild(item);
      });
    } else {
      listEl.innerHTML = `<div class="py-16 text-center text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">暂无历史档案</div>`;
    }
  } catch (err) {
    console.error("History Error Detail:", err);
    const listEl = document.getElementById("history-list");
    listEl.innerHTML = `<div class="py-16 px-4 text-center text-[9px] font-black text-rose-300 tracking-[0.2em] uppercase">链路连接失败，请检查内网穿透状态</div>`;
  }
}

async function deleteConversation(id, event) {
  event.stopPropagation();
  if (!confirm("确定要永久抹除这段反思档案吗？操作不可逆。")) return;
  try {
    const response = await fetch(`${DIFY_API_URL}/conversations/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: currentUser }),
      mode: "cors",
    });
    if (response.ok) {
      if (conversationId === id) startNewChat();
      fetchHistory();
    }
  } catch (err) {
    console.error("Delete Error:", err);
  }
}

async function loadConversation(id) {
  conversationId = id;
  document.getElementById("display-cid").innerText =
    `ID: ${id.substring(0, 5)}..`;
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML =
    '<div class="text-slate-300 text-[10px] font-black text-center py-32 animate-pulse tracking-[1em] uppercase italic">正在解码加密数据...</div>';
  try {
    const response = await fetch(
      `${DIFY_API_URL}/messages?user=${currentUser}&conversation_id=${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      },
    );
    const data = await response.json();
    chatBox.innerHTML = "";
    if (data.data) {
      data.data.forEach((msg) => {
        appendMessage("user", msg.query);
        appendMessage("ai", msg.answer);
      });
    }
    fetchHistory();
  } catch (err) {
    appendMessage("ai", "❌ 链路故障，无法恢复档案。");
  }
}

async function sendMessage() {
  const inputField = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const message = inputField.value.trim();
  if (!message || sendBtn.disabled) return;

  sendBtn.disabled = true;
  appendMessage("user", message);
  inputField.value = "";
  const aiMsgDiv = createAiMessagePlaceholder();
  setStatus("AI 思考中...", "bg-amber-400 animate-pulse");

  try {
    const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: "streaming",
        conversation_id: conversationId,
        user: currentUser,
      }),
      mode: "cors",
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data:")) continue;
        try {
          const data = JSON.parse(line.substring(5));
          if (data.conversation_id && !conversationId) {
            conversationId = data.conversation_id;
            document.getElementById("display-cid").innerText =
              `ID: ${conversationId.substring(0, 5)}..`;
            fetchHistory();
          }
          if (data.event === "message" || data.event === "agent_message") {
            fullAnswer += data.answer || "";
            aiMsgDiv.innerText = fullAnswer;
            scrollChat();
            setStatus("正在同步回流...", "bg-blue-400 animate-pulse");
          }
          if (data.event === "message_end") {
            setStatus("工作站已连接", "bg-emerald-500");
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    setStatus("链路中断", "bg-rose-500");
    aiMsgDiv.innerHTML = `<span class="text-rose-500 font-bold text-xs uppercase tracking-widest">系统异常:</span> ${err.message}`;
  } finally {
    sendBtn.disabled = false;
  }
}

function createAiMessagePlaceholder() {
  const chatBox = document.getElementById("chat-box");
  const outer = document.createElement("div");
  outer.className = "w-full flex justify-start msg-enter";
  const inner = document.createElement("div");
  inner.className = "max-w-2xl lg:max-w-5xl w-full mx-auto flex gap-5 md:gap-10 items-start";
  const avatar = document.createElement("div");
  avatar.className = `w-11 h-11 md:w-14 md:h-14 rounded-[1.6rem] flex-shrink-0 flex items-center justify-center text-[10px] font-black bg-white text-slate-900 border border-slate-100 shadow-sm`;
  avatar.innerText = "AI";
  const content = document.createElement("div");
  // 关键修改：将 p-6 md:p-10 改为 px-6 py-4 md:px-10 md:py-6 (显著降低垂直高度)
  content.className = "bg-white text-slate-800 px-6 py-4 md:px-10 md:py-6 rounded-[2.5rem] rounded-tl-lg border border-slate-50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] max-w-[85%] lg:max-w-[75%] text-base md:text-[17px] whitespace-pre-wrap leading-[1.8] font-medium tracking-tight";
  content.innerText = "...";
  inner.appendChild(avatar);
  inner.appendChild(content);
  outer.appendChild(inner);
  chatBox.appendChild(outer);
  scrollChat();
  return content;
}

function appendMessage(role, text) {
  if (!text) return;
  const chatBox = document.getElementById("chat-box");
  const outer = document.createElement("div");
  outer.className = `w-full flex ${role === "user" ? "justify-end" : "justify-start"} msg-enter`;
  const inner = document.createElement("div");
  inner.className = `max-w-2xl lg:max-w-5xl w-full mx-auto flex gap-5 md:gap-10 items-start ${role === "user" ? "flex-row-reverse" : ""}`;
  const avatar = document.createElement("div");
  if (role === "user") {
    avatar.className = `w-11 h-11 md:w-14 md:h-14 rounded-[1.6rem] flex-shrink-0 flex items-center justify-center text-[10px] font-black bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.5)] border border-white/20`;
    avatar.innerText = "我";
  } else {
    avatar.className = `w-11 h-11 md:w-14 md:h-14 rounded-[1.6rem] flex-shrink-0 flex items-center justify-center text-[10px] font-black bg-white text-slate-900 border border-slate-100 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)]`;
    avatar.innerText = "AI";
  }
  const content = document.createElement("div");
  // 关键修改：将 p-6 md:p-10 改为 px-6 py-4 md:px-10 md:py-6 (显著降低垂直高度)
  if (role === "user") {
    content.className = "bg-slate-900 text-white px-6 py-4 md:px-10 md:py-6 rounded-[2.5rem] rounded-tr-lg shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] max-w-[85%] lg:max-w-[75%] text-base md:text-[17px] whitespace-pre-wrap leading-[1.8] font-medium tracking-tight border border-white/10";
  } else {
    content.className = "bg-white text-slate-800 px-6 py-4 md:px-10 md:py-6 rounded-[2.5rem] rounded-tl-lg border border-slate-50 shadow-[0_25px_50px_-20px_rgba(0,0,0,0.06)] max-w-[85%] lg:max-w-[75%] text-base md:text-[17px] whitespace-pre-wrap leading-[1.8] font-medium tracking-tight";
  }
  content.innerText = text;
  inner.appendChild(avatar);
  inner.appendChild(content);
  outer.appendChild(inner);
  chatBox.appendChild(outer);
  scrollChat();
}

function scrollChat() {
  const chatBox = document.getElementById("chat-box");
  if (chatBox) {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
  }
}
function enterFullscreen() {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
    }
}
