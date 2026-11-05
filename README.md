# VIORA — You do you, we'll track the rest.

Desktop-first wellness and self-care mini project.

## Stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: FastAPI (Python)
- Database: SQLite (created automatically as `viora.db`)

## Run in VS Code (Windows)
1. Extract this ZIP and open the `Viora` folder in VS Code.
2. Open Terminal → New Terminal.
3. Run `python -m pip install -r requirements.txt`
4. Run `python -m uvicorn backend.main:app --reload`
5. Open http://127.0.0.1:8000
6. API docs: http://127.0.0.1:8000/docs

Keep the terminal open while using the site. Press Ctrl+C to stop the server.

## Data storage
- FastAPI + SQLite: period logs and symptoms, appointments, mood journal.
- Browser localStorage: sleep log, sleep routine checklist, step goal, medication reminders, self-care checklist.
- Upcoming retreats: illustrative static sample cards.

## Important limitations
- Step count is not manually editable. The current UI displays no detected steps until a future phone/wearable integration is implemented. Only the daily goal can be set.
- Sleep and medication are browser-only, not synced across devices.
- Period phase and next-period dates are estimates based on the entered cycle length; not medical or contraceptive advice.
- Retreats are sample listings and do not support real bookings.
- This is an educational demo. Do not enter real sensitive health information.
