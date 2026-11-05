const $=id=>document.getElementById(id), API="";
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function request(path,opts={}){const r=await fetch(API+path,{headers:{"Content-Type":"application/json"},...opts});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.detail||"Request failed")}return r.json()}
function toast(s){let t=$("toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function dateText(s){return s?new Date(s+"T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):"—"}
function view(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===name));let nav=document.querySelector(`.nav[data-view="${name}"]`);$("crumb").textContent=name.toUpperCase();$("topTitle").textContent=nav?nav.innerText.trim():"Your Viora space";location.hash=name;window.scrollTo(0,0)}
document.querySelectorAll("[data-view]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();view(a.dataset.view)}));
$("today").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
$("moodEditorDate").value = today();$("apptDate").min=today();$("periodStart").max=today();$("symptomDate").value=today();
function bindChecks(selector,key,countId){let saved=JSON.parse(localStorage.getItem(key)||"{}");document.querySelectorAll(selector).forEach(i=>{i.checked=!!saved[i.dataset.task||i.dataset.sleeptask];i.addEventListener("change",()=>{let k=i.dataset.task||i.dataset.sleeptask;let v=JSON.parse(localStorage.getItem(key)||"{}");v[k]=i.checked;localStorage.setItem(key,JSON.stringify(v));update()})});function update(){let all=[...document.querySelectorAll(selector)],done=all.filter(x=>x.checked).length;if($(countId))$(countId).textContent=`${done} / ${all.length}`}update()}
bindChecks("[data-task]","viora-selfcare","taskProgress");bindChecks("[data-sleeptask]","viora-sleeptasks","sleepTaskCount");

// PERIOD TRACKER: backend logs, symptom logs, phase estimate and monthly calendar
let periodItems=[],calendarDate=new Date();
function latestPeriod(){return periodItems[0]}
function cycleInfo(){let p=latestPeriod();if(!p)return null;let start=new Date(p.start_date+"T12:00:00"),now=new Date();now.setHours(12,0,0,0);let day=Math.max(1,Math.floor((now-start)/86400000)+1),len=p.cycle_length,cycleDay=((day-1)%len)+1,next=new Date(start);next.setDate(start.getDate()+Math.ceil((now-start)/86400000/len)*len);while(next<=now)next.setDate(next.getDate()+len);let ov=new Date(start);ov.setDate(start.getDate()+len-14);let phase=cycleDay<=p.period_length?"Menstrual phase":cycleDay<=len-17?"Follicular phase":cycleDay<=len-12?"Ovulation window":"Luteal phase";return {start,day:cycleDay,len,next,ov,phase}}
async function loadPeriods(){try{periodItems=await request("/api/periods");renderPeriod();}catch(e){console.error(e)}}
function renderPeriod(){let info=cycleInfo();if(info){$("cycleHeadline").textContent=`Day ${info.day} of your cycle`; $("cycleCaption").textContent=`Your cycle began ${dateText(latestPeriod().start_date)} · ${info.len}-day average`; $("cycleDay").textContent=info.day;$("cycleDayLabel").textContent="CYCLE DAY";$("cyclePhase").textContent=info.phase;$("nextDate").textContent="Next period estimate · "+dateText(info.next.toISOString().slice(0,10));$("nextPeriod").textContent=dateText(info.next.toISOString().slice(0,10));$("nextPeriodSub").textContent="Estimated from your average cycle";$("ovulationDate").textContent=dateText(info.ov.toISOString().slice(0,10));$("ovulationSub").textContent="Estimated midpoint window";$("dashCycle").textContent=`Cycle day ${info.day}`;$("dashCycleSub").textContent=info.phase+" · Next period "+dateText(info.next.toISOString().slice(0,10));}else{$("cycleHeadline").textContent="Your cycle starts with a check-in";$("cycleCaption").textContent="Add your most recent period start date to see an estimate.";$("cycleDay").textContent="—";$("cyclePhase").textContent="Add a period date";$("nextDate").textContent="No estimate yet";$("nextPeriod").textContent="—";$("ovulationDate").textContent="—";$("dashCycle").textContent="Let's start tracking";$("dashCycleSub").textContent="Log a period to see your cycle overview."}
$("periodHistory").innerHTML=periodItems.length?periodItems.map(p=>`<div class="history-item"><div><b>Period started ${dateText(p.start_date)}</b><small>${p.cycle_length}-day cycle · ${p.period_length}-day period</small></div><button class="delete" data-period-delete="${p.id}">Delete</button></div>`).join(""):"No period logs yet.";renderCalendar()}
function renderCalendar(){let y=calendarDate.getFullYear(),m=calendarDate.getMonth();$("calendarMonth").textContent=calendarDate.toLocaleDateString(undefined,{month:"long",year:"numeric"});let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),html=["S","M","T","W","T","F","S"].map(x=>`<span class="weekday">${x}</span>`).join("");for(let i=0;i<first;i++)html+="<span></span>";let info=cycleInfo();for(let d=1;d<=days;d++){let dt=new Date(y,m,d),cls=[];if(dt.toDateString()===new Date().toDateString())cls.push("today");if(info){let delta=Math.floor((dt-info.start)/86400000),cd=((delta%info.len)+info.len)%info.len+1;if(delta>=0&&cd<=latestPeriod().period_length)cls.push("period-day");else if(delta>=0&&cd>=info.len-17&&cd<=info.len-11)cls.push("fertile-day")}html+=`<span class="${cls.join(" ")}">${d}</span>`} $("calendarGrid").innerHTML=html}
$("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()};
$("openPeriod").onclick=()=>$("periodModal").classList.add("open");$("openSymptoms").onclick=()=>$("symptomModal").classList.add("open");$("phaseInfo").onclick=()=>$("phaseModal").classList.add("open");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove("open"));document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
$("periodForm").onsubmit=async e=>{e.preventDefault();try{await request("/api/periods",{method:"POST",body:JSON.stringify({start_date:$("periodStart").value,cycle_length:+$("cycleLength").value,period_length:+$("periodLength").value})});$("periodModal").classList.remove("open");await loadPeriods();toast("Period date saved to your cycle history.")}catch(err){toast(err.message)}};
$("periodHistory").onclick=async e=>{let b=e.target.closest("[data-period-delete]");if(!b)return;try{await request("/api/periods/"+b.dataset.periodDelete,{method:"DELETE"});await loadPeriods();toast("Period entry deleted.")}catch(err){toast(err.message)}};
async function loadSymptoms(){try{let a=await request("/api/symptoms");$("symptomHistory").innerHTML=a.length?a.map(x=>`<div class="history-item"><div><b>${esc(x.symptoms)}</b><small>${dateText(x.log_date)} ${x.note?"· "+esc(x.note):""}</small></div><button class="delete" data-sym-delete="${x.id}">Delete</button></div>`).join(""):"No symptoms logged yet."}catch(e){console.error(e)}}
$("symptomForm").onsubmit=async e=>{e.preventDefault();let symptoms=[...document.querySelectorAll(".symptom-options input:checked")].map(x=>x.value);if(!symptoms.length){toast("Choose at least one symptom.");return}try{await request("/api/symptoms",{method:"POST",body:JSON.stringify({log_date:$("symptomDate").value,symptoms,note:$("symptomNote").value})});$("symptomModal").classList.remove("open");$("symptomForm").reset();$("symptomDate").value=today();await loadSymptoms();toast("Symptoms saved.")}catch(err){toast(err.message)}};
$("symptomHistory").onclick=async e=>{let b=e.target.closest("[data-sym-delete]");if(!b)return;await request("/api/symptoms/"+b.dataset.symDelete,{method:"DELETE"});loadSymptoms()};

// SLEEP: visually dark night interface; log & tasks stored only in browser
const sleepKey="viora-sleep-log";
function calcSleep(b,w){let [bh,bm]=b.split(":").map(Number),[wh,wm]=w.split(":").map(Number),n=wh*60+wm-(bh*60+bm);if(n<=0)n+=1440;return n}
function renderSleep(d){let min=d.minutes||452,h=Math.floor(min/60),m=min%60,score=d.score||92;$("sleepHours").innerHTML=`${h}<span>h</span> ${m}<span>m</span>`;$("sleepScore").textContent=`SLEEP SCORE · ${score}%`;$("dashSleep").textContent=`${h}h ${m}m`;$("sleepQualityLine").textContent=d.quality==="Restless"?"A restless night happens. Give yourself a gentle start today.":"A little time to recharge can make a difference. Keep nurturing your routine.";let bars=JSON.parse(localStorage.getItem("viora-sleep-week")||"[82,74,56,88,78,94,0]");$("weekBars").innerHTML=bars.map((v,i)=>`<div><i style="height:${v}%"></i><small>${"MTWTFSS"[i]}</small></div>`).join("")}
renderSleep(JSON.parse(localStorage.getItem(sleepKey)||'{"minutes":452,"quality":"Restful","score":92}'));
$("logSleepOpen").onclick=()=>$("sleepFormPanel").classList.add("open");$("closeSleep").onclick=()=>$("sleepFormPanel").classList.remove("open");
$("sleepForm").onsubmit=e=>{e.preventDefault();let mins=calcSleep($("bed").value,$("wake").value),quality=$("sleepQuality").value,score=Math.min(100,Math.round(mins/480*100)+(quality==="Restful"?4:quality==="Restless"?-12:0));let d={minutes:mins,quality,score};localStorage.setItem(sleepKey,JSON.stringify(d));let week=JSON.parse(localStorage.getItem("viora-sleep-week")||"[82,74,56,88,78,94,0]");week[6]=score;localStorage.setItem("viora-sleep-week",JSON.stringify(week));renderSleep(d);$("sleepFormPanel").classList.remove("open");toast("Sleep log saved on this device.")};

// STEPS: intentionally read-only step count; only goal is editable
const goalKey="viora-step-goal";let goal=Number(localStorage.getItem(goalKey)||8000);$("stepGoal").value=goal;$("goalDisplay").textContent=goal.toLocaleString()+" steps";$("dashGoal").textContent="Daily goal: "+goal.toLocaleString()+" steps";$("saveGoal").onclick=()=>{goal=Math.max(500,Math.min(30000,Number($("stepGoal").value)||8000));localStorage.setItem(goalKey,goal);$("stepGoal").value=goal;$("goalDisplay").textContent=goal.toLocaleString()+" steps";$("dashGoal").textContent="Daily goal: "+goal.toLocaleString()+" steps";toast("Your daily step goal is saved.")};

// MEDICATIONS: local browser reminder list
const medKey="viora-medications";function meds(){return JSON.parse(localStorage.getItem(medKey)||"[]")}
function renderMeds(){let a=meds();$("medCount").textContent=a.length+" reminders";$("dashMeds").textContent=a.length?a.length+" reminders saved":"No reminders yet";$("medList").innerHTML=a.length?a.sort((x,y)=>x.time.localeCompare(y.time)).map(x=>`<div class="history-item"><div><b>${esc(x.name)}</b><small>${esc(x.time)} · ${esc(x.note)}</small></div><button class="delete" data-med-done="${x.id}">${x.done?"Taken ✓":"Mark taken"}</button><button class="delete" data-med-del="${x.id}">×</button></div>`).join(""):"No reminders added."}
$("medForm").onsubmit=e=>{e.preventDefault();let a=meds();a.push({id:Date.now(),name:$("medName").value,time:$("medTime").value,note:$("medNote").value,done:false});localStorage.setItem(medKey,JSON.stringify(a));$("medForm").reset();renderMeds();toast("Reminder added to this browser.")};
$("medList").onclick=e=>{let done=e.target.closest("[data-med-done]"),del=e.target.closest("[data-med-del]"),a=meds();if(done)a=a.map(x=>x.id==done.dataset.medDone?{...x,done:!x.done}:x);if(del)a=a.filter(x=>x.id!=del.dataset.medDel);localStorage.setItem(medKey,JSON.stringify(a));renderMeds()};

// APPOINTMENTS: backend
async function loadAppointments(){let a=await request("/api/appointments");$("appointmentList").innerHTML=a.length?a.map(x=>`<div class="history-item"><div><b>${esc(x.title)}</b><small>${dateText(x.appointment_date)} · ${esc(x.appointment_time)} ${x.notes?"· "+esc(x.notes):""}</small></div><button class="delete" data-appt-del="${x.id}">Delete</button></div>`).join(""):"No appointments yet."}
$("appointmentForm").onsubmit=async e=>{e.preventDefault();try{await request("/api/appointments",{method:"POST",body:JSON.stringify({title:$("apptTitle").value,appointment_date:$("apptDate").value,appointment_time:$("apptTime").value,notes:$("apptNotes").value})});$("appointmentForm").reset();await loadAppointments();toast("Appointment saved.")}catch(err){toast(err.message)}};
$("appointmentList").onclick=async e=>{let b=e.target.closest("[data-appt-del]");if(b){await request("/api/appointments/"+b.dataset.apptDel,{method:"DELETE"});loadAppointments()}};

// MOOD JOURNAL: backend

/* =========================================
   VIORA MOOD JOURNAL
   FASTAPI + SQLITE BACKEND
========================================= */

let currentMoodType = "check-in";
let currentQuestion = "";

const moodEmojis = {
    "Awesome": "😄",
    "Great": "😍",
    "Loved": "🥰",
    "Okay": "😌",
    "Meh": "😕",
    "Anxious": "😰",
    "Bad": "😟",
    "Terrible": "😣",
    "Upset": "😠",
    "Reflecting": "✍️"
};

const entryLabels = {
    "check-in": "Daily check-in",
    "morning": "Morning journal",
    "evening": "Evening journal",
    "question": "Question of the day",
    "positive": "Positive moment"
};

// -----------------------------------------
// OPEN MOOD POP-UP
// -----------------------------------------

function openMoodPicker() {
    $("moodPickerModal").classList.add("open");
}

document.querySelectorAll("[data-open-mood-picker]")
.forEach(button => {
    button.addEventListener("click", openMoodPicker);
});

// -----------------------------------------
// OPEN JOURNAL EDITOR
// -----------------------------------------

function openMoodEditor(type, mood, prompt) {

    currentMoodType = type;

    $("moodEditorTitle").textContent =
        entryLabels[type] || "Your little reflection";

    $("moodEntryType").value = type;

    $("moodEditorMood").value = mood;

    $("moodEditorPrompt").textContent = prompt;

    $("moodEditorNote").value = "";

    $("moodEditorDate").value = today();

    $("moodPickerModal").classList.remove("open");

    $("moodEditorModal").classList.add("open");
}

// -----------------------------------------
// SELECT ONE OF NINE EMOTIONS
// -----------------------------------------

document.querySelectorAll("[data-mood-choice]")
.forEach(button => {

    button.addEventListener("click", () => {

        const selectedMood = button.dataset.moodChoice;

        openMoodEditor(
            "check-in",
            selectedMood,
            "You chose " + selectedMood +
            ". Would you like to write a little about how you're feeling?"
        );

    });

});

// -----------------------------------------
// MORNING / EVENING / POSITIVE JOURNAL
// -----------------------------------------

document.querySelectorAll("[data-journal-type]")
.forEach(button => {

    button.addEventListener("click", () => {

        const type = button.dataset.journalType;

        const journalPrompts = {

            morning: "What is one intention you want to set for today?",

            evening: "What was one meaningful moment from your day?",

            positive: "Write one small thing that made you smile today."

        };

        const defaultMood = {
            morning: "Great",
            evening: "Okay",
            positive: "Loved"
        };

        openMoodEditor(
            type,
            defaultMood[type],
            journalPrompts[type]
        );

    });

});

// -----------------------------------------
// DAILY REFLECTION QUESTIONS
// -----------------------------------------

const dailyQuestions = [

    "What is one thing you can do today to make yourself feel better?",

    "What made you smile recently?",

    "What is something you are grateful for today?",

    "What is one thing you would like to let go of?",

    "What is something you love about yourself?",

    "What would your ideal peaceful day look like?",

    "What is one small achievement you are proud of?"

];

let questionIndex = new Date().getDate() % dailyQuestions.length;

function displayQuestion() {

    currentQuestion = dailyQuestions[questionIndex];

    $("dailyQuestion").textContent = currentQuestion;

}

displayQuestion();

$("newQuestion").addEventListener("click", () => {

    questionIndex =
        (questionIndex + 1) % dailyQuestions.length;

    displayQuestion();

});

$("writeQuestion").addEventListener("click", () => {

    openMoodEditor(
        "question",
        "Reflecting",
        currentQuestion
    );

});

// -----------------------------------------
// SAVE A JOURNAL ENTRY TO BACKEND
// -----------------------------------------

$("moodEntryForm").addEventListener("submit", async event => {

    event.preventDefault();

    try {

        const moodData = {

            mood: $("moodEditorMood").value,

            note: $("moodEditorNote").value.trim(),

            entry_date: $("moodEditorDate").value,

            entry_type: currentMoodType,

            prompt: $("moodEditorPrompt").textContent

        };

        await request("/api/moods", {

            method: "POST",

            body: JSON.stringify(moodData)

        });

        $("moodEditorModal").classList.remove("open");

        $("moodEntryForm").reset();

        await loadMoods();

        toast("Your journal entry has been saved ♡");

    }

    catch(error) {

        toast(error.message);

    }

});

// -----------------------------------------
// WEEKLY MOOD TIMELINE
// -----------------------------------------

function localDateString(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

function renderMoodWeek(entries) {

    const container = $("moodWeek");

    const items = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(date.getDate() - i);

        const dateString = localDateString(date);

        const entry = entries.find(
            item => item.entry_date === dateString
        );

        const weekday = date.toLocaleDateString(
            "en",
            { weekday: "short" }
        );

        const emoji = entry
            ? (moodEmojis[entry.mood] || "♡")
            : "·";

        const todayClass = i === 0 ? "today" : "";

        items.push(`
            <div class="mood-day ${todayClass}">
                <span>${weekday}</span>
                <strong>${date.getDate()}</strong>
                <small>${emoji}</small>
            </div>
        `);

    }

    container.innerHTML = items.join("");

}

// -----------------------------------------
// DISPLAY SAVED MOOD AND JOURNAL ENTRIES
// -----------------------------------------

async function loadMoods() {

    try {

        const entries = await request("/api/moods");

        renderMoodWeek(entries);

        const container = $("moodList");

        if (!entries.length) {

            container.innerHTML =
                "No entries yet. Start with your first check-in!";

            return;

        }

        container.innerHTML = entries.map(entry => {

            const emoji =
                moodEmojis[entry.mood] || "♡";

            const category =
                entryLabels[entry.entry_type] ||
                "Journal entry";

            return `

                <div class="history-item">

                    <div>

                        <b>
                            ${emoji}
                            ${esc(entry.mood)}
                        </b>

                        <small>
                            ${dateText(entry.entry_date)}
                        </small>

                        <span class="mood-entry-type">
                            ${category}
                        </span>

                        ${
                            entry.prompt
                            ? `<small>${esc(entry.prompt)}</small>`
                            : ""
                        }

                        <p>${esc(entry.note || "Mood check-in")}</p>

                    </div>

                    <button
                        class="delete"
                        data-mood-del="${entry.id}">
                        Delete
                    </button>

                </div>

            `;

        }).join("");

    }

    catch(error) {

        console.error("Mood loading error:", error);

    }

}

// -----------------------------------------
// DELETE JOURNAL ENTRY
// -----------------------------------------

$("moodList").addEventListener("click", async event => {

    const button = event.target.closest("[data-mood-del]");

    if (!button) return;

    try {

        await request(
            "/api/moods/" + button.dataset.moodDel,
            { method: "DELETE" }
        );

        await loadMoods();

        toast("Journal entry deleted.");

    }

    catch(error) {

        toast(error.message);

    }

});

loadPeriods();loadSymptoms();loadAppointments();loadMoods();let initial=location.hash.slice(1);if(initial&&$("page-"+initial))view(initial);
