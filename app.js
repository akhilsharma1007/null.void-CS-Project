// --- Configuration & Helpers ---
const PROFANITY_LIST = ["heck", "darn", "crap", "idiot"]; // Add real words here
const MAX_POSTS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

// Initialize mock database in localStorage
let posts = JSON.parse(localStorage.getItem("confessions")) || [];
let postHistory = JSON.parse(localStorage.getItem("postHistory")) || [];

// DOM Elements
const confessionInput = document.getElementById("confessionInput");
const submitBtn = document.getElementById("submitBtn");
const feed = document.getElementById("feed");
const spamWarning = document.getElementById("spamWarning");

// --- Core Features ---

// 1. Auto-censor profanity
function censorText(text) {
    let censored = text;
    PROFANITY_LIST.forEach(word => {
        // Create a case-insensitive regex for the exact word
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        censored = censored.replace(regex, "*".repeat(word.length));
    });
    return censored;
}

// 2. Spam Detection (Rate Limiting)
function canPost() {
    const now = Date.now();
    // Keep only timestamps from the last hour
    postHistory = postHistory.filter(timestamp => now - timestamp < ONE_HOUR_MS);
    
    if (postHistory.length >= MAX_POSTS_PER_HOUR) {
        return false;
    }
    return true;
}

// 3. Handle New Post Submission
submitBtn.addEventListener("click", () => {
    let rawText = confessionInput.value.trim();
    if (!rawText) return;

    if (!canPost()) {
        spamWarning.classList.remove("hidden");
        return;
    }

    spamWarning.classList.add("hidden");

    const newPost = {
        id: Date.now(),
        text: censorText(rawText),
        votes: 0,
        timestamp: Date.now()
    };

    // Save post
    posts.unshift(newPost); // Add to beginning
    localStorage.setItem("confessions", JSON.stringify(posts));

    // Update history for spam check
    postHistory.push(Date.now());
    localStorage.setItem("postHistory", JSON.stringify(postHistory));

    // Reset UI
    confessionInput.value = "";
    renderPosts("new");
});

// 4. Upvote / Downvote Logic
function handleVote(id, change) {
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex > -1) {
        posts[postIndex].votes += change;
        localStorage.setItem("confessions", JSON.stringify(posts));
        
        // Re-render based on current active tab
        const currentTab = document.getElementById("btn-trending").classList.contains("active") ? "trending" : "new";
        renderPosts(currentTab);
    }
}

// 5. Render Feed (Trending vs New)
function renderPosts(sortType) {
    // Update active nav buttons
    document.getElementById("btn-new").classList.toggle("active", sortType === "new");
    document.getElementById("btn-trending").classList.toggle("active", sortType === "trending");

    feed.innerHTML = "";

    // Sort logic
    let displayPosts = [...posts];
    if (sortType === "trending") {
        displayPosts.sort((a, b) => b.votes - a.votes);
    } else {
        displayPosts.sort((a, b) => b.timestamp - a.timestamp); // Newest first
    }

    if (displayPosts.length === 0) {
        feed.innerHTML = "<p style='text-align:center; color:#a0a0a0;'>No confessions yet. Be the first!</p>";
        return;
    }

    displayPosts.forEach(post => {
        const date = new Date(post.timestamp).toLocaleDateString();
        
        const postEl = document.createElement("article");
        postEl.className = "post-card";
        postEl.innerHTML = `
            <div class="post-content">
                ${post.text}
            </div>
            <div class="post-footer">
                <span class="date">${date}</span>
                <div class="votes">
                    <button class="vote-btn" onclick="handleVote(${post.id}, 1)">👍</button>
                    <span class="score">${post.votes}</span>
                    <button class="vote-btn" onclick="handleVote(${post.id}, -1)">👎</button>
                </div>
            </div>
        `;
        feed.appendChild(postEl);
    });
}

// Initial render
renderPosts("new");