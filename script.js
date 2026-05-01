// --- DOM ELEMENTS ---
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const joinModal = document.getElementById('join-modal');
const feed = document.getElementById('feed');
const confessionInput = document.getElementById('confessionInput');
const channelTitle = document.getElementById('current-channel-title');
const modBadge = document.getElementById('modBadge');

// Mobile specific
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');

const emailInput = document.getElementById('emailInput');
const studentPasswordInput = document.getElementById('studentPasswordInput');
const authBtnStudent = document.getElementById('authBtnStudent');
const authErrorStudent = document.getElementById('auth-error-student');
const toggleAuthMode = document.getElementById('toggleAuthMode');

const modEmailInput = document.getElementById('modEmailInput');
const modPasswordInput = document.getElementById('modPasswordInput');
const loginBtnMod = document.getElementById('loginBtnMod');

const channelBtns = document.querySelectorAll('.channel-btn');
const selectDept = document.getElementById('select-dept');
const selectLevel = document.getElementById('select-level');
const confirmJoinBtn = document.getElementById('confirm-join-btn');

const complaintPostIdInput = document.getElementById("complaintPostId");
const complaintTextInput = document.getElementById("complaintText");

// --- STATE ---
const MOD_EMAIL = "admin@sau.in"; 
const MOD_PASSWORD = "sau@admin";
const DUMMY_STUDENT_EMAIL = "student@sau.in";
const DUMMY_STUDENT_PASSWORD = "sau123";

const PROFANITY_LIST = ["heck", "darn", "crap", "idiot"];
const MAX_POSTS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

let posts = [];
let postHistory = [];
let registeredUsers = [];
let isSignUpMode = false;
let currentChannel = "general";
let userDept = "";
let userLevel = "";

// ================= MOBILE MENU LOGIC =================
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// ================= AUTH LOGIC =================
document.getElementById('tab-student').addEventListener('click', (e) => switchTab(e, 'student-form', 'mod-form'));
document.getElementById('tab-mod').addEventListener('click', (e) => switchTab(e, 'mod-form', 'student-form'));

function switchTab(e, showId, hideId) {
    document.querySelectorAll('.role-tabs button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(showId).classList.remove('hidden');
    document.getElementById(hideId).classList.add('hidden');
    clearInputs();
}

function clearInputs() {
    emailInput.value = ''; studentPasswordInput.value = '';
    modEmailInput.value = ''; modPasswordInput.value = '';
    authErrorStudent.style.display = 'none';
}

toggleAuthMode.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    document.getElementById('studentFormTitle').innerText = isSignUpMode ? "Create Student Account" : "Student Login";
    authBtnStudent.innerText = isSignUpMode ? "Sign Up & Enter" : "Log In";
    toggleAuthMode.innerText = isSignUpMode ? "Log in" : "Create an account";
});

authBtnStudent.addEventListener('click', () => {
    const email = emailInput.value.trim().toLowerCase();
    const pass = studentPasswordInput.value;
    if (!email.endsWith('.in')) return showError("Use @sau.in email.");
    if (email === MOD_EMAIL) return showError("Use Mod tab for admin.");
    if (pass.length < 6) return showError("Password too short.");

    if (isSignUpMode) {
        if (registeredUsers.find(u => u.email === email)) return showError("Account exists.");
        registeredUsers.push({ email, pass });
        showApp("student");
    } else {
        const isValid = (email === DUMMY_STUDENT_EMAIL && pass === DUMMY_STUDENT_PASSWORD) || 
                        registeredUsers.find(u => u.email === email && u.pass === pass);
        if (isValid) showApp("student");
        else showError("Invalid credentials.");
    }
});

loginBtnMod.addEventListener('click', () => {
    if (modEmailInput.value.toLowerCase() === MOD_EMAIL && modPasswordInput.value === MOD_PASSWORD) {
        showApp("moderator");
    } else {
        document.getElementById('login-error-mod').style.display = 'block';
    }
});

function showError(msg) {
    authErrorStudent.innerText = msg;
    authErrorStudent.style.display = 'block';
}

// ================= CORE APP FLOW =================
function showApp(role) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    modBadge.classList.toggle('hidden', role !== "moderator");
    const panel = document.getElementById("moderatorComplaints");

    if (role === "moderator") {
        userDept = "ALL"; userLevel = "ALL";
        unlockAndRender();
        panel?.classList.remove("hidden");
        renderComplaints();
    } else {
        panel?.classList.add("hidden");
        joinModal.classList.remove('hidden');
    }
}

confirmJoinBtn.addEventListener('click', () => {
    userDept = selectDept.value;
    userLevel = selectLevel.value;
    joinModal.classList.add('hidden');
    unlockAndRender();
});

function unlockAndRender() {
    channelBtns.forEach(btn => {
        const ch = btn.dataset.channel;
        if (ch === "general" || ch === userDept || ch === userLevel || userDept === "ALL") {
            btn.classList.remove('locked');
        }
    });
    renderPosts("new");
}

channelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) return alert("Access Denied.");
        channelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChannel = btn.dataset.channel;
        channelTitle.innerText = btn.innerText;
        renderPosts("new");
        
        // Auto-close sidebar on mobile after clicking a channel
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});

// ================= POSTING & RENDER =================
function censorText(text) {
    let t = text;
    PROFANITY_LIST.forEach(w => {
        const r = new RegExp(`\\b${w}\\b`, "gi");
        t = t.replace(r, "*".repeat(w.length));
    });
    return t;
}

document.getElementById('submitBtn').addEventListener('click', () => {
    const text = confessionInput.value.trim();
    if (!text) return;
    posts.unshift({ id: Date.now(), text: censorText(text), votes: 0, timestamp: Date.now(), channel: currentChannel });
    confessionInput.value = "";
    renderPosts("new");
});

window.handleVote = function(id, change) {
    const post = posts.find(p => p.id === id);
    if (post) {
        post.votes += change;
        renderPosts(document.getElementById('btn-trending').classList.contains('active') ? "trending" : "new");
    }
};

document.getElementById('btn-new').addEventListener('click', () => renderPosts("new"));
document.getElementById('btn-trending').addEventListener('click', () => renderPosts("trending"));

function renderPosts(sortType) {
    document.getElementById('btn-new').classList.toggle('active', sortType === "new");
    document.getElementById('btn-trending').classList.toggle('active', sortType === "trending");
    feed.innerHTML = "";

    let filtered = posts.filter(p => p.channel === currentChannel);
    if (sortType === "trending") filtered.sort((a,b) => b.votes - a.votes);
    else filtered.sort((a,b) => b.timestamp - a.timestamp);

    if (filtered.length === 0) {
        feed.innerHTML = `<p style="text-align:center; color:#666; margin-top: 50px;">No confessions in ${currentChannel} yet.</p>`;
        return;
    }

    filtered.forEach(post => {
        const el = document.createElement('article');
        el.className = 'post-card';
        el.innerHTML = `
            <div class="post-content">
                <strong style="color:var(--accent);">ID: ${post.id}</strong><br>
                ${post.text}
            </div>
            <div class="post-footer">
                <span>${new Date(post.timestamp).toLocaleDateString()}</span>
                <div class="votes">
                    <button onclick="handleVote(${post.id}, 1)">👍</button>
                    <span>${post.votes}</span>
                    <button onclick="handleVote(${post.id}, -1)">👎</button>
                </div>
            </div>`;
        feed.appendChild(el);
    });
}

// ================= COMPLAINT LOGIC =================
function submitComplaint() {
    const postId = complaintPostIdInput.value;
    const text = complaintTextInput.value.trim();
    if (!postId || !text) return alert("Enter Post ID and text.");

    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
    complaints.push({ postId, text, date: new Date().toLocaleDateString() });
    localStorage.setItem("complaints", JSON.stringify(complaints));
    complaintPostIdInput.value = ""; complaintTextInput.value = "";
    alert("Complaint submitted ✅");
}

function renderComplaints() {
    const container = document.getElementById("complaintList");
    if (!container) return;
    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
    container.innerHTML = complaints.length === 0 ? "<p style='color:gray;'>No complaints yet</p>" : "";
    complaints.forEach(c => {
        const el = document.createElement("div");
        el.className = "post-card";
        el.style.borderLeft = "4px solid var(--danger)";
        el.innerHTML = `<strong style="color:var(--danger);">Post ID: ${c.postId}</strong><p>${c.text}</p><small>${c.date}</small>`;
        container.appendChild(el);
    });
}

document.getElementById('logoutBtn').addEventListener('click', () => location.reload());
