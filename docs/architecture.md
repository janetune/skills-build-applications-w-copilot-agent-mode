# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Build a thin React interface in the Vite app that renders the four primary routes (activities, teams, leaderboard, workouts) using a shared API client, Bootstrap styling, and accessible status states. The UI should fetch data from `/api`, show loading while pending, render empty/error states intentionally, and never leak backend implementation details.
- Logic tier decision: Keep Express route handlers focused on request validation, persistence orchestration, and response shaping. The logic layer will validate IDs and payloads before persisting, map business rules to model data, and return deliberate 4xx responses instead of unhandled cast errors or generic 500s.
- Data tier decision: Use Mongoose schemas and seed data to define the canonical contract for users, teams, activities, and workout suggestions. Reuse ObjectId references for user/team relationships, keep required fields explicit in schema validation, and seed realistic sample data that exercises the leaderboard and recommendation logic.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes` in POST `/api/activities`, verify the referenced user and team exist, reject invalid IDs with a deliberate 4xx, and compute `points` and `occurredAt` server-side so the contract is consistent across clients.
- Team management approach: Require a team `name` and keep `mascot` and `members` in the persisted document. `members` should be stored as actual user references or identifiers so the team listing and dashboard can render membership data reliably.
- Leaderboard approach: Aggregate total points by team from the activities collection, sort descending by total points, assign a 1-based rank, and return objects shaped as `{ teamName, totalPoints, rank }` so the UI can render a leaderboard without extra processing.
- Workout suggestions approach: Match the requested user email to a seeded user, inspect that user's recent activity pattern or fitness goal, and return workout suggestions ordered by relevance. The first suggestion should match the user's focus, include a `reason`, and fall back to a deliberate 4xx when the email does not map to a user.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the schema contract for users, teams, activities, and workouts. Failures here usually mean required fields, relationships, or typed defaults are not enforced in Mongoose.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates route behavior and HTTP contracts. Failures here indicate the Express layer is returning the wrong status codes, missing JSON fields, or incorrect rankings/suggestions.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the actual React UI contract. Failures here mean the presentation layer is not rendering the expected data, loading states, empty states, or accessible error messages.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — confirms TypeScript and backend integration compile cleanly after the data and API fixes.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the Vite app still compiles after wiring the React routes and API client to the backend contract.
