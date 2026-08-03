# Volunteer Team Management System

তিনটি রোল সমর্থন করে এমন একটি ভলান্টিয়ার টিম ম্যানেজমেন্ট প্ল্যাটফর্ম:
- **Organizer** — অফিস স্টাফ, ফুল অ্যাডমিন কন্ট্রোল (টিম, মিটিং, ঘোষণা)
- **Ardenteer** — সিনিয়র ভলান্টিয়ার, টিম লিড, টাস্ক অ্যাসাইনমেন্ট
- **Quanteer** — ভলান্টিয়ার, টাস্ক এক্সিকিউশন, থ্রেডেড আলোচনা

স্ট্যাক: **Next.js (frontend) + Express (backend) + PostgreSQL**

## প্রজেক্ট স্ট্রাকচার

```
volunteer-team-management/
├── backend/           # Express API
│   ├── src/
│   │   ├── schema.sql         # PostgreSQL schema
│   │   ├── db.js              # DB connection pool
│   │   ├── middleware/         # auth.js, role.js
│   │   ├── routes/             # auth, teams, tasks, meetings, announcements
│   │   └── server.js
│   ├── package.json
│   └── .env.example
└── frontend/          # Next.js app
    ├── pages/          # login, register, dashboard, teams, tasks, meetings, announcements
    ├── components/
    ├── lib/api.js      # fetch wrapper + auth session helpers
    └── package.json
```

## চালানোর নিয়ম (Setup)

### 1. Database
```bash
createdb volunteer_team_db
cd backend
cp .env.example .env   # DATABASE_URL, JWT_SECRET বসান
npm install
npm run migrate        # schema.sql রান করে
```

### 2. Backend
```bash
cd backend
npm run dev             # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

### 4. প্রথম Organizer অ্যাকাউন্ট বানানো
প্রথম ইউজার সবসময় QUANTEER হিসেবে সাইনআপ হয় (সিকিউরিটির জন্য)। প্রথম Organizer বানাতে
DB-তে সরাসরি রোল আপডেট করুন:

```sql
UPDATE users SET role = 'ORGANIZER' WHERE email = 'your-email@example.com';
```

এরপর সেই Organizer অ্যাকাউন্ট দিয়ে অন্যদের Ardenteer/Organizer বানানো যাবে।

## মূল ফিচার (এই স্কাফোল্ডে যা আছে)
- JWT-based authentication + role-based authorization (Organizer/Ardenteer/Quanteer)
- Team creation, membership, team leads
- Task assignment ও status tracking (PENDING → IN_PROGRESS → COMPLETED/BLOCKED)
- Meeting scheduling, agenda, decisions/notes, attendance tracking
- Announcements (Organizer/Ardenteer only) + Google Chat-style threaded replies (সবাই রিপ্লাই দিতে পারে)

## পরের ধাপ (এখনও বানানো হয়নি — future work)
- Recurring events (weekly Friday programs) ফ্রন্টএন্ড UI
- Email/push notifications
- File attachments
- Admin panel for user role management (UI, currently via SQL)
- Docker Compose for one-command local setup

## GitHub-এ পুশ করার আগে
- `.env` ফাইলগুলো `.gitignore`-এ আছে (দেখুন `.gitignore`), তাই সিক্রেট কমিট হবে না।
- `npm install` চালানোর পর `node_modules` push করবেন না — সেটাও ইগনোর করা আছে।
