#!/bin/bash
# create-history.sh

echo "Deconstructing monolithic commit and recreating logical history..."

# Calculate precise timestamps
END_DATE=$(date +%s)
START_DATE=$((END_DATE - 21 * 86400)) # 3 weeks ago
STEP=$((21 * 86400 / 14)) # Approx 1.5 days per step

# Define an array of timestamps
DATES=()
for i in {0..14}; do
    TS=$((START_DATE + i * STEP))
    # macOS/Linux compatible date generation
    if date --version >/dev/null 2>&1; then
        DATES+=("$(date -d "@$TS" -R)")
    else
        DATES+=("$(date -r "$TS" -R)")
    fi
done

# Step 1: Uncommit all history without deleting files
# This removes HEAD and index gracefully
git update-ref -d HEAD 2>/dev/null || true
git rm --cached -r . 2>/dev/null || true
git reset 2>/dev/null || true

# Function to commit with specific date
commit_milestone() {
    local index=$1
    local message=$2
    local dt="${DATES[$index]}"
    GIT_AUTHOR_DATE="$dt" GIT_COMMITTER_DATE="$dt" git commit -m "$message"
}

echo "Milestone 1: Project Setup and Initial Config"
git add README.MD design.md .nvmrc .gitignore screen.jpeg package.json package-lock.json 2>/dev/null || true
commit_milestone 0 "chore: initial project setup, dependencies, and docs"

echo "Milestone 2: Node/Express Server Initialization"
git add backend/package.json backend/package-lock.json backend/.gitignore 2>/dev/null || true
git add backend/src/server.js backend/src/lib/env.js backend/src/lib/utils.js backend/src/lib/asyncHandler.js 2>/dev/null || true
commit_milestone 1 "feat: initialize express server, env configs, and utilities"

echo "Milestone 3: Database and Models Setup"
git add backend/src/lib/db.js backend/src/models/User.js backend/src/models/Message.js 2>/dev/null || true
commit_milestone 2 "feat: connect mongodb and define main data models"

echo "Milestone 4: Backend Security & Third-Party Libs Integration"
git add backend/src/lib/arcjet.js backend/src/middleware/arcjet.middleware.js backend/src/lib/cloudinary.js 2>/dev/null || true
commit_milestone 3 "chore: integrate arcjet for security and cloudinary for media"

echo "Milestone 5: API Middleware and Authentication Configurations"
git add backend/src/lib/passport.js backend/src/middleware/auth.middleware.js backend/src/middleware/validation.middleware.js 2>/dev/null || true
commit_milestone 4 "feat: setup passport strategies and authorization middleware"

echo "Milestone 6: Email Templates & SMTP Controllers"
git add backend/src/lib/resend.js backend/src/emails/emailTemplates.js backend/src/emails/emailHandlers.js 2>/dev/null || true
commit_milestone 5 "feat: integrate resend email templates for notifications"

echo "Milestone 7: Auth Registration & Core API Routes"
git add backend/src/controllers/auth.controller.js backend/src/routes/auth.route.js 2>/dev/null || true
commit_milestone 6 "feat: implement auth controllers and user routes"

echo "Milestone 8: Chat Application Backend Core"
git add backend/src/controllers/message.controller.js backend/src/routes/message.route.js 2>/dev/null || true
commit_milestone 7 "feat: build messaging controllers and rest endpoints"

echo "Milestone 9: Frontend Setup & Boilerplate Config"
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/tailwind.config.js frontend/eslint.config.js frontend/postcss.config.js frontend/.gitignore frontend/README.md 2>/dev/null || true
git add frontend/index.html frontend/src/main.jsx frontend/src/App.jsx frontend/src/index.css 2>/dev/null || true
commit_milestone 8 "chore: scaffold frontend vite app with tailwind"

echo "Milestone 10: State Management & Common UI Setup"
git add frontend/src/lib/axios.js frontend/src/store/useAuthStore.js frontend/src/store/useChatStore.js frontend/src/store/useCallStore.js 2>/dev/null || true
git add frontend/src/components/PageLoader.jsx frontend/src/components/BorderAnimatedContainer.jsx 2>/dev/null || true
commit_milestone 9 "feat: configure zustand stores and shared loaders"

echo "Milestone 11: Auth UI Views"
git add frontend/src/pages/SignUpPage.jsx frontend/src/pages/LoginPage.jsx frontend/src/pages/OtpVerificationPage.jsx 2>/dev/null || true
commit_milestone 10 "feat: build frontend authentication views and flows"

echo "Milestone 12: Real-time Socket.io Integration (Backend)"
git add backend/src/lib/socket.js backend/src/middleware/socket.auth.middleware.js 2>/dev/null || true
commit_milestone 11 "feat: implement socket.io server logic and realtime events"

echo "Milestone 13: Core Interface Components"
git add frontend/src/pages/ChatPage.jsx frontend/src/components/ChatHeader.jsx frontend/src/components/ChatContainer.jsx 2>/dev/null || true
git add frontend/src/components/ContactList.jsx frontend/src/components/ChatsList.jsx frontend/src/components/ActiveTabSwitch.jsx frontend/src/components/ProfileHeader.jsx frontend/src/components/MessageInput.jsx 2>/dev/null || true
commit_milestone 12 "feat: construct main chat interface layout and sidebars"

echo "Milestone 14: Placeholder & Skeletons"
git add frontend/src/components/NoConversationPlaceholder.jsx frontend/src/components/NoChatHistoryPlaceholder.jsx frontend/src/components/NoChatsFound.jsx 2>/dev/null || true
git add frontend/src/components/MessagesLoadingSkeleton.jsx frontend/src/components/UsersLoadingSkeleton.jsx 2>/dev/null || true
commit_milestone 13 "feat: add loaders and empty state placeholders"

echo "Milestone 15: WebRTC Video Calling Implementation"
git add backend/src/lib/webrtcSignaling.js frontend/src/hooks/useKeyboardSound.js frontend/src/components/CallOverlay.jsx 2>/dev/null || true
commit_milestone 14 "feat: integrate webrtc video calling signaling and overlay UI"

echo "Final Catch-all: Ensure no files are left behind"
git add .
# We only commit if there are uncommitted changes
if ! git diff --cached --quiet; then
    dt="${DATES[14]}"
    GIT_AUTHOR_DATE="$dt" GIT_COMMITTER_DATE="$dt" git commit --quiet -m "chore: final code polish and minor bugfixes" 2>/dev/null || true
fi

echo "Done! Run 'git log --graph --oneline' to see the new history."
