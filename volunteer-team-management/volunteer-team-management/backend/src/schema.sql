-- Volunteer Team Management System — PostgreSQL Schema

CREATE TYPE user_role AS ENUM ('ORGANIZER', 'ARDENTEER', 'QUANTEER');
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');
CREATE TYPE meeting_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- USERS
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'QUANTEER',
    phone         VARCHAR(30),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TEAMS
CREATE TABLE teams (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    created_by   INTEGER REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TEAM MEMBERSHIP (an Ardenteer leads, Quanteers are members)
CREATE TABLE team_members (
    id         SERIAL PRIMARY KEY,
    team_id    INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_lead    BOOLEAN NOT NULL DEFAULT FALSE, -- true = Ardenteer leading this team
    joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- TASKS
CREATE TABLE tasks (
    id           SERIAL PRIMARY KEY,
    team_id      INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    assigned_to  INTEGER REFERENCES users(id),
    assigned_by  INTEGER REFERENCES users(id),
    status       task_status NOT NULL DEFAULT 'PENDING',
    due_date     DATE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EVENTS (e.g. recurring Friday programs)
CREATE TABLE events (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(100), -- e.g. 'WEEKLY:FRIDAY'
    start_time   TIMESTAMP NOT NULL,
    end_time     TIMESTAMP,
    location     VARCHAR(200),
    created_by   INTEGER REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MEETINGS
CREATE TABLE meetings (
    id           SERIAL PRIMARY KEY,
    team_id      INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    agenda       TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    location     VARCHAR(200),
    status       meeting_status NOT NULL DEFAULT 'SCHEDULED',
    created_by   INTEGER REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MEETING DECISIONS / MINUTES
CREATE TABLE meeting_notes (
    id          SERIAL PRIMARY KEY,
    meeting_id  INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MEETING ATTENDANCE
CREATE TABLE meeting_attendance (
    id          SERIAL PRIMARY KEY,
    meeting_id  INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      attendance_status NOT NULL DEFAULT 'ABSENT',
    UNIQUE(meeting_id, user_id)
);

-- ANNOUNCEMENTS (primary posts — Organizer/Ardenteer only)
CREATE TABLE announcements (
    id          SERIAL PRIMARY KEY,
    team_id     INTEGER REFERENCES teams(id) ON DELETE CASCADE, -- NULL = org-wide
    title       VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- THREADED REPLIES (Google-Chat style — anyone incl. Quanteers can reply)
CREATE TABLE announcement_replies (
    id               SERIAL PRIMARY KEY,
    announcement_id  INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    parent_reply_id  INTEGER REFERENCES announcement_replies(id) ON DELETE CASCADE, -- NULL = top-level thread reply
    content          TEXT NOT NULL,
    created_by       INTEGER REFERENCES users(id),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_team ON tasks(team_id);
CREATE INDEX idx_tasks_assignee ON tasks(assigned_to);
CREATE INDEX idx_meetings_team ON meetings(team_id);
CREATE INDEX idx_announcements_team ON announcements(team_id);
CREATE INDEX idx_replies_announcement ON announcement_replies(announcement_id);
