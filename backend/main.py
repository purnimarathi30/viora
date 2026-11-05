from pathlib import Path
import sqlite3
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "viora.db"
app = FastAPI(title="Viora API", description="Wellness tracker demo API")

def connect():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    return db

with connect() as db:
    db.executescript("""
    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      cycle_length INTEGER NOT NULL DEFAULT 28,
      period_length INTEGER NOT NULL DEFAULT 5
    );
    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      note TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mood TEXT NOT NULL,
      note TEXT DEFAULT '',
      entry_date TEXT NOT NULL
    );
    """)

class PeriodIn(BaseModel):
    start_date: date
    cycle_length: int = Field(28, ge=21, le=40)
    period_length: int = Field(5, ge=1, le=10)

class SymptomIn(BaseModel):
    log_date: date
    symptoms: list[str]
    note: str = Field("", max_length=500)

class AppointmentIn(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    appointment_date: date
    appointment_time: str
    notes: str = Field("", max_length=500)

class MoodIn(BaseModel):
    mood: str = Field(min_length=1, max_length=30)
    note: str = Field("", max_length=1000)
    entry_date: date

@app.get("/")
def home():
    return FileResponse(ROOT / "index.html")

@app.get("/api/periods")
def periods():
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM periods ORDER BY start_date DESC").fetchall()]

@app.post("/api/periods")
def add_period(data: PeriodIn):
    with connect() as db:
        cur = db.execute("INSERT INTO periods(start_date,cycle_length,period_length) VALUES(?,?,?)",
                         (data.start_date.isoformat(), data.cycle_length, data.period_length))
        return dict(db.execute("SELECT * FROM periods WHERE id=?", (cur.lastrowid,)).fetchone())

@app.delete("/api/periods/{item_id}")
def remove_period(item_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM periods WHERE id=?", (item_id,))
    if not cur.rowcount: raise HTTPException(404, "Period entry not found")
    return {"message":"Deleted"}

@app.get("/api/symptoms")
def symptoms():
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM symptoms ORDER BY log_date DESC,id DESC LIMIT 30").fetchall()]

@app.post("/api/symptoms")
def add_symptoms(data: SymptomIn):
    with connect() as db:
        cur = db.execute("INSERT INTO symptoms(log_date,symptoms,note) VALUES(?,?,?)",
                         (data.log_date.isoformat(), ", ".join(data.symptoms), data.note))
        return dict(db.execute("SELECT * FROM symptoms WHERE id=?", (cur.lastrowid,)).fetchone())

@app.delete("/api/symptoms/{item_id}")
def remove_symptoms(item_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM symptoms WHERE id=?", (item_id,))
    if not cur.rowcount: raise HTTPException(404, "Symptom entry not found")
    return {"message":"Deleted"}

@app.get("/api/appointments")
def appointments():
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM appointments ORDER BY appointment_date,appointment_time").fetchall()]

@app.post("/api/appointments")
def add_appointment(data: AppointmentIn):
    with connect() as db:
        cur = db.execute("INSERT INTO appointments(title,appointment_date,appointment_time,notes) VALUES(?,?,?,?)",
                         (data.title.strip(),data.appointment_date.isoformat(),data.appointment_time,data.notes.strip()))
        return dict(db.execute("SELECT * FROM appointments WHERE id=?", (cur.lastrowid,)).fetchone())

@app.delete("/api/appointments/{item_id}")
def remove_appointment(item_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM appointments WHERE id=?", (item_id,))
    if not cur.rowcount: raise HTTPException(404, "Appointment not found")
    return {"message":"Deleted"}

@app.get("/api/moods")
def moods():
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM moods ORDER BY entry_date DESC,id DESC LIMIT 30").fetchall()]

@app.post("/api/moods")
def add_mood(data: MoodIn):
    with connect() as db:
        cur = db.execute("INSERT INTO moods(mood,note,entry_date) VALUES(?,?,?)",
                         (data.mood,data.note.strip(),data.entry_date.isoformat()))
        return dict(db.execute("SELECT * FROM moods WHERE id=?", (cur.lastrowid,)).fetchone())

@app.delete("/api/moods/{item_id}")
def remove_mood(item_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM moods WHERE id=?", (item_id,))
    if not cur.rowcount: raise HTTPException(404, "Mood entry not found")
    return {"message":"Deleted"}

app.mount("/assets", StaticFiles(directory=ROOT / "assets"), name="assets")
