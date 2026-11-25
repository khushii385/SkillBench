# SkillBench Frontend

React + Vite frontend for the SkillBench microservices backend.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
```
Start the backend first: auth (8081), project (8082), escrow (8083) and the API gateway (8080).

## Config
The gateway URL defaults to `http://localhost:8080`. To change it, create a `.env` file:
```
VITE_GATEWAY_URL=http://localhost:8080
```
The currency symbol is set in one place: `src/utils/format.js` (`CURRENCY`).

## Pages
| Route | Who | What |
|---|---|---|
| `/` | everyone | Landing page |
| `/login`, `/register` | guests | Auth |
| `/dashboard` | both | Overview from real project and escrow data |
| `/dashboard/projects` | client | Post, edit, delete projects; fund, release or refund escrow |
| `/dashboard/find-work` | developer | Open projects, accept a project |
| `/dashboard/tasks` | developer | Projects assigned to you |
| `/dashboard/submissions` | both | Developer submits work, client approves or asks for changes |
| `/dashboard/skills` | both | Developer skill profiles (edit your own, browse others) |
| `/dashboard/wallet` | both | Escrow payments and earnings |
| `/dashboard/analytics` | both | Charts computed from your data |
| `/dashboard/api-tester` | both | Send real requests to the gateway |
| `/dashboard/settings` | both | Change name and password, sign out |
