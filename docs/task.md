# Personal Movie & TV Recommendation App — Project Tasks

> A phased implementation plan for building a private, persistent movie and TV recommendation application with a Tinder-style rating flow.

---

## Project Goal

Build a personal movie and TV recommendation application that:

- Learns the user's taste through fast, swipe-style interactions
- Stores all data persistently in the cloud
- Allows the user to return after months or years without losing progress
- Keeps every user's viewing history and preferences private
- Generates recommendations from deterministic, explainable logic
- Can later support an AI explanation layer without depending on AI as the source of truth

---

## Core Product Principles

- Personal profiles only
- No shared profiles
- No household profiles
- No couples matching
- No social sharing
- Supabase is the source of truth
- Do not rely only on `localStorage`
- Raw user interactions must always be preserved
- Recommendations should initially work without an AI API
- Every implementation phase must be testable independently
- Run lint, type checking, tests, and production build after each major phase
- Commit each phase separately

---

## Preferred Stack

```text
Frontend: Next.js App Router
Language: TypeScript
UI: React + Tailwind CSS + shadcn/ui
Database: Supabase PostgreSQL
Authentication: Supabase Auth
Content Data: TMDB API
Deployment: Vercel
```

---

# Task Execution Order

- [x] Task 1 — Product Architecture
- [x] Task 2 — Project Foundation
- [x] Task 3 — Database and Privacy
- [x] Task 4 — Authentication
- [x] Task 5 — TMDB Integration
- [ ] Task 6 — Tinder-Style Rating Flow
- [ ] Task 7 — Taste Profile Engine
- [ ] Task 8 — Recommendation Engine
- [ ] Task 9 — Recommendation Experience
- [ ] Task 10 — History and Long-Term Persistence
- [ ] Task 11 — Production Readiness Review

---

# Task 1 — Product Architecture

## Why This Task Matters

This task defines the product boundaries and architecture before implementation begins. It prevents unnecessary scope, data-model mistakes, and premature complexity.

## Prompt

```text
You are a senior product engineer and software architect.

I want to build a personal movie and TV recommendation web application.

The main onboarding experience should feel similar to Tinder:

- The user sees one movie or TV show card at a time.
- The user can swipe or use buttons to provide quick feedback.
- The system uses these interactions to build a personal taste profile.
- Each user has a completely private profile.
- Do not implement shared profiles, household profiles, couples matching, or social sharing.
- Different users must never see each other's watch history, ratings, preferences, or recommendation feedback.

Primary interaction options:

- Watched and liked
- Watched and disliked
- Watched and neutral
- Not watched but interested
- Not interested
- Skip / unsure

The product must remember the user's data permanently so the user can return after a year and continue from the same state.

Preferred stack:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- TMDB API
- Vercel

Your task is to create an implementation plan only. Do not write production code yet.

Create:

1. Product scope
2. MVP definition
3. Main user journeys
4. Application routes
5. Component architecture
6. Backend architecture
7. Database entities
8. Authentication and privacy model
9. TMDB integration strategy
10. Recommendation-system strategy
11. Data persistence and backup strategy
12. Risks and technical decisions
13. Step-by-step implementation phases
14. Clear acceptance criteria for the MVP

Important constraints:

- Keep the MVP focused.
- Do not add social or shared-user features.
- Do not rely only on localStorage.
- Supabase must be the source of truth.
- The recommendation model should initially work without requiring an AI API.
- AI may later explain recommendations, but it should not own the user data or recommendation state.
- Design the architecture so an AI layer can be added later.
- Prefer simple, testable logic over unnecessary complexity.

Before completing the plan, inspect the existing repository if one exists and identify reusable code, outdated files, and architecture conflicts.
```

## Completion Checklist

- [x] Product scope is clearly defined
- [x] MVP boundaries are explicit
- [x] Routes and component structure are documented
- [x] Database entities are identified
- [x] Privacy model is defined
- [x] Recommendation strategy is explainable and testable
- [x] Risks and acceptance criteria are included
- [x] No production code was added

---

# Task 2 — Project Foundation

## Why This Task Matters

This task creates a clean and scalable application foundation before business logic is introduced.

## Prompt

```text
Implement the foundation of the personal movie and TV recommendation application based on the approved architecture plan.

Use:

- Next.js App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Supabase
- TMDB API

Tasks:

1. Inspect the repository before making changes.
2. Reuse valid existing code where appropriate.
3. Remove or isolate irrelevant starter files.
4. Create a clean and scalable folder structure.
5. Configure environment-variable validation.
6. Add Supabase browser and server clients.
7. Add a TMDB API client.
8. Add shared TypeScript types.
9. Add error boundaries and loading states.
10. Add a basic responsive application shell.
11. Add navigation placeholders for:
   - Discover
   - Rate titles
   - Recommendations
   - Watchlist
   - History
   - Settings
12. Create an informative README with local setup instructions.

Required environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- TMDB_API_TOKEN

Do not hardcode secrets.

Do not build the full product in this task.

At the end:

- Run linting.
- Run type checking.
- Run the production build.
- Fix all relevant errors.
- Summarize the files created, changed, and removed.
- Document any assumptions or blockers.
```

## Completion Checklist

- [x] Repository was inspected first
- [x] Folder structure is clean
- [x] TypeScript strict mode is enabled
- [x] Environment variables are validated
- [x] Supabase server and browser clients exist
- [x] TMDB client exists
- [x] Application shell is responsive
- [x] Navigation placeholders exist
- [x] README contains setup instructions
- [x] Lint passes
- [x] Type checking passes
- [x] Production build passes

---

# Task 3 — Database and Privacy

## Why This Task Matters

This task creates the permanent data layer and ensures that every user's data remains private.

## Prompt

```text
Design and implement the Supabase database layer for the personal recommendation application.

The system is private and user-specific.

Each authenticated user must only be able to read and modify their own:

- Profile
- Content interactions
- Ratings
- Watch history
- Watchlist
- Recommendation feedback
- Taste preferences
- Onboarding progress

Create migrations for the following concepts:

1. profiles
2. content_items
3. user_content_interactions
4. user_watch_progress
5. user_preferences
6. recommendation_sessions
7. recommendation_events

The content_items table should cache normalized TMDB metadata and support both movies and TV shows.

The user_content_interactions table should support:

- watched_liked
- watched_disliked
- watched_neutral
- interested
- not_interested
- skipped
- unsure

Each interaction should preserve:

- user_id
- content_id
- interaction_type
- optional rating
- interaction source
- created_at
- updated_at

Important requirements:

- Use UUID primary keys where appropriate.
- Add unique constraints to avoid accidental duplicate active state.
- Preserve interaction history where useful.
- Add indexes for common recommendation and history queries.
- Enable Row Level Security.
- Create explicit RLS policies.
- Never allow one user to access another user's private data.
- Avoid storing unnecessary TMDB data.
- Include created_at and updated_at timestamps.
- Add a safe profile creation trigger for new authenticated users.
- Make migrations repeatable and maintainable.

Also create:

- Generated or manually maintained TypeScript database types
- Repository/service functions for database access
- Basic database tests or documented SQL validation checks
- Seed data only when it does not contain real user information

At the end, explain the schema decisions and how user privacy is enforced.
```

## Completion Checklist

- [x] All required tables exist
- [x] Migrations are repeatable
- [x] RLS is enabled
- [x] Explicit policies exist
- [x] Cross-user access is blocked
- [x] Useful indexes exist
- [x] Duplicate state is prevented
- [x] Profile creation trigger exists
- [x] TypeScript database types exist
- [x] Repository/service layer exists
- [x] SQL validation or tests exist

---

# Task 4 — Authentication

## Why This Task Matters

Authentication connects permanent user data to a private account and allows the user to return from another device later.

## Prompt

```text
Implement authentication and protected application access using Supabase Auth.

Requirements:

- Support Google sign-in.
- Support email magic-link sign-in.
- Persist the authenticated session correctly.
- Support logout.
- Redirect unauthenticated users to a login page.
- Redirect authenticated users away from the login page.
- Protect private routes on the server where possible.
- Create the user's profile automatically after first login.
- Do not store authentication state only in localStorage.
- Use Supabase's recommended Next.js server-side authentication pattern.
- Do not expose private service-role credentials to the browser.

Create:

1. Login page
2. Authentication callback route
3. Protected application layout
4. User menu
5. Logout action
6. Authentication loading and error states
7. Minimal account settings page
8. Delete-account placeholder with a documented future workflow

The UI should clearly explain that:

- Viewing data is private.
- Ratings and history are stored under the user's account.
- The user can return from another device and continue.

At the end:

- Test anonymous access.
- Test successful sign-in.
- Test protected routes.
- Test session persistence after refresh.
- Run lint, type checking, and build.
```

## Completion Checklist

- [x] Google sign-in works
- [x] Magic-link sign-in works
- [x] Callback route works
- [x] Private routes are protected
- [x] Session persists after refresh
- [x] Logout works
- [x] Auth errors are handled
- [x] Account settings page exists
- [x] No service-role secret is exposed
- [x] Lint, type checking, and build pass

---

# Task 5 — TMDB Integration

## Why This Task Matters

This task provides real movie and TV metadata without unnecessarily copying the full TMDB catalog into the database.

## Prompt

```text
Implement the TMDB data integration for movies and TV shows.

Create a server-side TMDB service that supports:

- Trending movies
- Trending TV shows
- Popular movies
- Popular TV shows
- Search
- Movie details
- TV-show details
- Genres
- Posters and backdrop URLs
- Release year
- Runtime for movies
- Episode runtime where available
- Original language
- Overview
- Vote average
- Content type

Requirements:

- Keep the TMDB API token server-side.
- Add typed response normalization.
- Normalize movies and TV shows into one internal ContentItem model.
- Add request error handling.
- Add reasonable caching.
- Handle missing posters and metadata.
- Store only interacted-with or recommended content in Supabase.
- Do not copy the entire TMDB catalog into the database.
- Avoid duplicate cached content records.
- Preserve the TMDB ID and media type as a unique external identity.
- Add the required TMDB attribution in the UI or documentation.

Create a reusable content-card component that can display both movies and TV shows.

Do not implement the swipe interaction yet.

At the end, create a temporary development page that verifies:

- Trending movie loading
- Trending TV loading
- Search
- Normalized output
- Missing-data behavior
```

## Completion Checklist

- [x] TMDB token remains server-side
- [x] Movies and TV shows use one normalized model
- [x] Trending and popular endpoints work
- [x] Search works
- [x] Details endpoints work
- [x] Missing images and metadata are handled
- [x] Caching exists
- [x] Duplicate content is prevented
- [x] TMDB attribution exists
- [x] Development verification page exists

---

# Task 6 — Tinder-Style Rating Flow

## Why This Task Matters

This is the main data-collection experience. It quickly teaches the application what the user has seen and what they like.

## Prompt

```text
Build the interactive title-rating experience for the application.

The experience should feel inspired by Tinder, but it must remain accessible and usable on desktop and mobile.

The user sees one movie or TV-show card at a time.

Available actions:

- Watched and liked
- Watched and disliked
- Watched and neutral
- Not watched but interested
- Not interested
- Skip / unsure
- Undo the most recent action

UI requirements:

- Large poster or backdrop
- Title
- Release year
- Movie or TV label
- Genres
- Short spoiler-free overview
- Primary interaction buttons
- Swipe gestures on touch devices
- Keyboard shortcuts on desktop
- Visible focus states
- Screen-reader labels
- Loading state for the next card
- Optimistic interaction feedback
- Safe rollback when saving fails
- Undo action
- Session progress indicator
- Optional details expansion without leaving the flow

Interaction behavior:

- Save every confirmed action to Supabase.
- Do not permanently lose interactions after refresh.
- Do not immediately show the same item again.
- Avoid titles the user has already classified.
- Do not infer “dislike” from Skip.
- Skip and Unsure must remain distinct from Not Interested.
- Prefetch the next few cards.
- Prevent accidental duplicate submissions.
- Record the source of the card, such as onboarding, trending, genre exploration, or recommendation.

Create a balanced initial card queue using:

- Popular titles
- Trending titles
- A mixture of movies and TV shows
- A mixture of genres
- Some older widely known titles
- Some newer titles

The purpose of the first session is not to recommend yet. It is to collect useful preference data quickly.

Include an onboarding message explaining:

“Rate titles you already know. The more accurate your answers are, the better your future recommendations become.”

At the end, test:

- Mouse buttons
- Keyboard controls
- Mobile swipe
- Refresh persistence
- Undo
- Failed save
- Duplicate prevention
- Empty queue
```

## Completion Checklist

- [ ] One-card-at-a-time flow works
- [ ] All interaction types are supported
- [ ] Mobile swipe works
- [ ] Keyboard controls work
- [ ] Interactions persist after refresh
- [ ] Undo works
- [ ] Failed save rolls back safely
- [ ] Duplicate submissions are blocked
- [ ] Classified items do not immediately repeat
- [ ] Queue mixes types, years, and genres
- [ ] Empty queue state exists
- [ ] Accessibility requirements are met

---

# Task 7 — Taste Profile Engine

## Why This Task Matters

This task translates raw user interactions into clear preference signals without introducing an opaque AI dependency.

## Prompt

```text
Implement a deterministic personal taste-profile engine.

Do not use an AI API in this stage.

The engine should analyze the user's stored interactions and calculate preference signals for:

- Genres
- Movies versus TV shows
- Release decades
- Original languages
- Runtime ranges
- Popular versus less-mainstream titles
- Strong positive signals
- Strong negative signals
- Confidence level based on the amount of collected data

Interaction weighting should distinguish between:

- Watched and liked
- Watched and disliked
- Watched and neutral
- Interested
- Not interested
- Skipped
- Unsure

Important behavior:

- Watched and liked should be a strong positive signal.
- Watched and disliked should be a strong negative signal.
- Interested should be a weaker positive signal than watched and liked.
- Not interested should be a weaker negative signal than watched and disliked.
- Skip and unsure should contribute little or no preference weight.
- Do not overfit after only a few interactions.
- Use confidence thresholds.
- Keep the scoring logic transparent and testable.
- Store derived preference snapshots, but preserve raw interactions as the source of truth.
- Make recalculation idempotent.

Create:

1. TasteProfile TypeScript model
2. Scoring functions
3. Database persistence for calculated preferences
4. Recalculation service
5. Tests using several example users
6. A private “Your taste so far” screen

The taste screen should show understandable explanations such as:

- You tend to like crime and science-fiction titles.
- You have reacted negatively to slow historical dramas.
- We still need more data about comedy.
- Your current profile confidence is medium.

Do not expose raw internal scoring numbers unless a debug mode is enabled.
```

## Completion Checklist

- [ ] TasteProfile model exists
- [ ] Weighting logic is documented
- [ ] Raw interactions remain the source of truth
- [ ] Derived snapshots are stored
- [ ] Recalculation is idempotent
- [ ] Confidence thresholds exist
- [ ] Skip and unsure have little or no impact
- [ ] Tests cover multiple user patterns
- [ ] Taste summary screen exists
- [ ] Debug values remain hidden by default

---

# Task 8 — Recommendation Engine

## Why This Task Matters

This task converts the user's taste profile into actual recommendations while remaining transparent and testable.

## Prompt

```text
Implement the first recommendation engine for the application.

Do not use an LLM or AI API.

Use:

- The user's raw interactions
- The calculated taste profile
- TMDB discover and metadata endpoints
- Content availability in the local cache
- Exclusion rules

The engine must exclude:

- Titles marked watched
- Titles marked not interested
- Titles already rejected in the current recommendation session
- Duplicate titles
- Titles missing essential metadata

The scoring model may include:

- Genre affinity
- Media-type preference
- Language affinity
- Release-period affinity
- Runtime preference
- TMDB quality signal
- Popularity balance
- Exploration bonus
- Similarity to liked titles
- Penalty for similarity to disliked titles

Create three recommendation categories:

1. Safe Match
2. Worth Exploring
3. Something Different

For each recommendation, return:

- Content item
- Match category
- Confidence
- Human-readable reasons
- Signals that contributed to the result

Examples:

- Recommended because you liked several crime thrillers.
- Similar in tone to titles you rated positively.
- A slightly different choice based on your interest in science fiction.
- Lower confidence because we do not yet have enough comedy feedback.

Requirements:

- Keep the algorithm deterministic enough to test.
- Avoid showing fake precision such as “97.4% match” unless the score is meaningful.
- Add diversity so all results are not from the same franchise or genre.
- Do not recommend only globally popular titles.
- Record recommendation impressions and actions.
- Make it possible to explain why each recommendation was selected.

Create automated tests for:

- New user with little data
- User with strong genre preferences
- Conflicting signals
- Mostly skipped items
- Large interaction history
- Exclusion of watched and rejected content
```

## Completion Checklist

- [ ] Watched items are excluded
- [ ] Not-interested items are excluded
- [ ] Duplicates are excluded
- [ ] Missing metadata is handled
- [ ] Recommendation categories exist
- [ ] Reasons are human-readable
- [ ] Diversity logic exists
- [ ] Exploration logic exists
- [ ] Recommendation impressions are recorded
- [ ] Tests cover required user patterns

---

# Task 9 — Recommendation Experience

## Why This Task Matters

This task creates the everyday product experience where the user receives a small number of useful recommendations.

## Prompt

```text
Build the interactive recommendation experience.

The user should be able to start a recommendation session by selecting:

- Movie or TV show
- No preference
- Available time
- Mood
- Familiar or adventurous
- Optional genre preference

Keep the input flow short and optional. The user should be able to receive recommendations without completing every field.

Return only a small number of strong recommendations:

- Best Match
- Alternative
- Wildcard

Each recommendation card should include:

- Poster
- Title
- Year
- Type
- Genres
- Runtime or episode length
- Spoiler-free description
- Why it was recommended
- Confidence label
- Buttons:
  - Add to watchlist
  - Not interested
  - Already watched
  - Show something similar
  - Replace this recommendation
  - Open details

Important:

- Every action must update the user's stored data.
- Do not show watched content again.
- Do not treat “replace” as a dislike.
- Save recommendation sessions and impressions.
- Explain recommendations using deterministic stored signals.
- Keep recommendation text short and useful.
- Support mobile and desktop.
- Add loading, empty, degraded, and error states.
- If the user does not have enough preference data, encourage them to rate more titles.

Create a direct navigation path between:

- Rate titles
- View taste profile
- Get recommendations
```

## Completion Checklist

- [ ] Session inputs are short and optional
- [ ] Three recommendation slots are shown
- [ ] Recommendation reasons are visible
- [ ] Replace does not count as dislike
- [ ] Every action persists
- [ ] Sessions and impressions persist
- [ ] Watched content stays excluded
- [ ] Mobile and desktop layouts work
- [ ] Loading, empty, degraded, and error states exist
- [ ] Navigation between main flows is clear

---

# Task 10 — History and Long-Term Persistence

## Why This Task Matters

This task makes the application useful over time and ensures the user can return after a long absence without losing context.

## Prompt

```text
Implement the user's persistent library and history experience.

Create the following private pages:

1. Watchlist
2. Watched history
3. Ratings and interactions
4. Recommendation history
5. Continue rating

Features:

- Filter by movie or TV show
- Filter by interaction type
- Filter by genre
- Search within the user's saved items
- Sort by date added, date watched, rating, and title
- Edit a previous interaction
- Move an item between statuses
- Remove an item from the watchlist
- Mark an item as watched
- Add or edit a personal rating
- Preserve timestamps and relevant history
- Show when and why a title was recommended
- Paginate or virtualize large collections

Return experience:

When a user logs in after a long period, show a useful return screen:

- Welcome back
- Number of saved titles
- Number of rated titles
- Current taste-profile confidence
- Continue rating
- Get updated recommendations

Do not reset onboarding progress.

Do not lose previous classifications when the content metadata changes.

Add an export feature that lets the user download their personal data as JSON.

The export should include:

- Profile
- Preferences
- Interactions
- Watch history
- Watchlist
- Recommendation history

Do not include secrets, authentication tokens, or data belonging to other users.
```

## Completion Checklist

- [ ] Watchlist exists
- [ ] Watched history exists
- [ ] Interaction history exists
- [ ] Recommendation history exists
- [ ] Filtering and sorting work
- [ ] Previous interactions can be edited
- [ ] Large collections are paginated or virtualized
- [ ] Return experience exists
- [ ] Onboarding progress is preserved
- [ ] Metadata updates do not erase classification
- [ ] JSON export works
- [ ] Export contains only current-user data
- [ ] Export contains no secrets

---

# Task 11 — Production Readiness Review

## Why This Task Matters

This task validates privacy, stability, accessibility, performance, and long-term usability before deployment.

## Prompt

```text
Perform a complete production-readiness review of the application.

Audit:

- Authentication
- Authorization
- Supabase Row Level Security
- Cross-user data isolation
- Server and client boundaries
- Environment variables
- TMDB API token exposure
- Database constraints
- Duplicate interactions
- Error handling
- Loading states
- Accessibility
- Responsive behavior
- Performance
- Image loading
- Caching
- Recommendation consistency
- Data export
- Empty states
- Long-term session recovery

Required tests:

- User A cannot access User B's data.
- Anonymous users cannot access private routes.
- Refreshing during rating does not lose confirmed actions.
- Duplicate clicks do not create duplicate records.
- Undo restores the correct state.
- Watched items do not reappear in recommendations.
- Not-interested items do not reappear.
- Skipped items are not treated as dislikes.
- Recommendation history persists.
- Export contains only the current user's data.
- Application works after logout and login.
- Application remains usable with a large interaction history.

Run:

- Lint
- Type checking
- Unit tests
- Integration tests
- Production build

Fix issues found during the audit.

Do not perform broad unrelated rewrites.

At the end, provide:

1. Issues discovered
2. Issues fixed
3. Remaining risks
4. Recommended next steps
5. Final MVP acceptance checklist
```

## Completion Checklist

- [ ] Cross-user isolation is tested
- [ ] Anonymous access is blocked
- [ ] TMDB token is not exposed
- [ ] RLS policies are validated
- [ ] Duplicate interactions are prevented
- [ ] Undo is validated
- [ ] Recommendation exclusions are validated
- [ ] Large-history behavior is validated
- [ ] Data export is validated
- [ ] Accessibility is reviewed
- [ ] Responsive behavior is reviewed
- [ ] Performance is reviewed
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Production build passes
- [ ] Remaining risks are documented

---

# Recommended Workflow for Every Task

Use the following workflow for each task:

```text
1. Run the task prompt in Plan Mode.
2. Review the proposed plan.
3. Remove any unnecessary scope.
4. Let the agent implement only the approved task.
5. Review changed files.
6. Run lint.
7. Run type checking.
8. Run tests.
9. Run the production build.
10. Test the affected flow manually.
11. Update this task file.
12. Create a dedicated Git commit.
```

---

# Suggested Git Commit Names

```text
docs: define product architecture and MVP
chore: initialize project foundation
feat: add private Supabase data model
feat: add Supabase authentication
feat: integrate TMDB content service
feat: add swipe-based title rating flow
feat: calculate personal taste profile
feat: add deterministic recommendation engine
feat: build recommendation session UI
feat: add persistent library and history
test: complete production readiness audit
```

---

# MVP Acceptance Criteria

The MVP is complete when:

- [ ] A user can create or access a private account
- [ ] A user can rate movies and TV shows quickly
- [ ] Swipe, buttons, and keyboard controls work
- [ ] Every confirmed interaction is stored in Supabase
- [ ] Data persists after refresh, logout, and future login
- [ ] One user cannot access another user's data
- [ ] A taste profile is calculated from stored interactions
- [ ] Recommendations exclude watched and rejected titles
- [ ] Recommendations include understandable reasons
- [ ] A user can manage a watchlist and history
- [ ] A user can export their data as JSON
- [ ] The application works on desktop and mobile
- [ ] Lint, type checking, tests, and production build pass

---

# Future Ideas — Not Part of the Initial MVP

Keep these ideas outside the initial implementation unless the MVP is already stable:

- AI-generated recommendation explanations
- Natural-language recommendation chat
- Streaming-provider availability filters
- Episode-level TV progress
- New-season notifications
- Import from external watch-history services
- Trailer previews
- Recommendation feedback analytics
- Taste changes over time
- Annual viewing summary
- Native mobile application
- Social features
- Shared profiles
- Household profiles
- Couples matching
