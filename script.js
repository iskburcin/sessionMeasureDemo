// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();

/** Helper Functions */
function $(id) {
    return document.getElementById(id);
}

let sessionTypesByDate = loadSessionData() || {}; // Load from local storage or initialize empty object
function loadSessionData() {
    return JSON.parse(localStorage.getItem("sessionTypesByDate"));
}

function saveSessionData() {
    localStorage.setItem("sessionTypesByDate", JSON.stringify(sessionTypesByDate));
}

function formatDate(date) {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function getDateKey(date) {
    return date.toDateString();
}

/** Render Calendar */
function renderWeekdays() {
    const container = $("calendar-weekdays");
    container.innerHTML = weekdays
        .map(day => `<div class='weekday' style='width: calc(100% / 7); display: grid; place-items: center;'>${day}</div>`)
        .join('');
}

function renderCalendar(date) {
    const daysContainer = $("calendar-days");
    const monthYearLabel = $("month-year");

    daysContainer.innerHTML = "";
    monthYearLabel.textContent = formatDate(date);

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayIndex = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;

    for (let i = 0; i < firstDayIndex; i++) {
        daysContainer.appendChild(document.createElement("div"));
    }
    /** Add actual days */
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        dayDiv.className = "day";

        if (day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
            dayDiv.classList.add("current-day");
        }

        // Seçili günü vurgula
        if (day === date.getDate()) {
            dayDiv.classList.add("selected-day");
        }

        dayDiv.addEventListener("click", () => selectDate(day));
        daysContainer.appendChild(dayDiv);
    }
}

/** SESSION SİDE */

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
    $("selected-date").textContent = getDateKey(activeDate);
    loadSessionsTypes();
}

function addSessionType() {
    const modal = $("session-model");
    const dropdown = $("session-dropdown");
    const sessionDateKey = getDateKey(activeDate);
    const sessionName = $("session-name").value;
    const checkDuration = $("check-duration").value;
    const minDuration = $("min-duration").value;
    const maxDuration = $("max-duration").value;
    if (!sessionName || !checkDuration || !minDuration || !maxDuration) {
        alert("Please fill all fields");
        return;
    }

    if (!sessionTypesByDate[sessionDateKey]) {
        sessionTypesByDate[sessionDateKey] = { sessionTypes: {} };
        sessionTypesByDate[sessionDateKey].sessionDateKey = sessionDateKey;
    }
    sessionTypesByDate[sessionDateKey].sessionTypes[sessionName] = {
        checkDuration,
        minDuration,
        maxDuration,
        sessions: {}
    };
    dropdown.appendChild(new Option(sessionName, sessionName));
    sessionName.value = '';
    checkDuration.value = '';
    minDuration.value = '';
    maxDuration.value = '';
    $("text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    modal.classList.add("hidden");
    saveSessionData();
    loadSessionsTypes();
}

/**
 * Render Sessions
*/
function loadSessionsTypes() {
    const sessionTable = $("session-log-table");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const sessionDateKey = getDateKey(activeDate);
    dropdown.innerHTML = '<option value="" disabled selected hidden>Select a session</option>';
    const sessionData = loadSessionData()[sessionDateKey]?.sessionTypes || {};

    // Correctly check for existence AND for a valid object with sessionTypes property
    if (loadSessionData() && loadSessionData()[sessionDateKey] && sessionData && typeof sessionData === 'object') {

        // Populate dropdown
        Object.keys(sessionData).forEach(sessionType => {
            const option = document.createElement("option");
            option.value = sessionType;
            option.textContent = sessionType;
            dropdown.appendChild(option);
            loadSessionsSummary(sessionData);
        });
        dropdown.classList.remove("hidden");
        txtCntnt.classList.add("hidden");
    } else {
        console.warn(`No sessions found for date: ${sessionDateKey}`);
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
    }
    sessionTable.classList.add('hidden');
}

function loadSessionsSummary(sessionData) {
    const sessSummaryBody = $("session-summary-body");
    sessSummaryBody.innerHTML = "";
    Object.keys(sessionData).forEach(session => {
        const sec = parseFloat(sessionData[session].totalTime) || 0;
        const totalSessions = Object.keys(sessionData[session].sessions).length;
        sessSummaryBody.innerHTML += `
                <tr>
                    <td>${session}</td>
                    <td>${totalSessions}</td>
                    <td>${Math.floor(sec / 60 / 60)}h ${Math.floor(sec / 60 % 60)}m ${Math.floor(sec % 60)}s</td>
                </tr >
            `;
    })
}

$("session-dropdown").addEventListener("change", renderSessions);
function renderSessions() {
    const sessionBody = $("session-log-body");
    const sessionDateKey = getDateKey(activeDate);
    const dateData = sessionTypesByDate[sessionDateKey];
    sessionBody.innerHTML = ''; // Clear previous sessions

    if (!loadSessionData() || !dateData || !dateData.sessionTypes) return;
    const selectedSession = $("session-dropdown").value;

    if (selectedSession) {
        if (dateData.sessionTypes[selectedSession]) {
            const sessionData = dateData.sessionTypes[selectedSession];

            // Check for sessions property before accessing it
            if (sessionData.sessions && Object.keys(sessionData.sessions).length > 0) {
                Object.keys(sessionData.sessions).forEach((key, index) => {
                    const session = sessionData.sessions[key];
                    const sec = parseFloat(session.duration) || 0;
                    sessionBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${new Date(session.start).toLocaleTimeString('en-US')}</td>
                            <td>${session.end ? new Date(session.end).toLocaleTimeString('en-US') : ''}</td>
                            <td>${Math.floor(sec / 60 / 60)}h ${Math.floor(sec / 60 % 60)}m ${Math.floor(sec % 60)}s</td>
                        </tr>`;
                });
            }
            sessionBody.innerHTML += `
                <tr id="last-row">
                    <td id="indx"></td>
                    <td id="start-time"><button id="start-session">Start</button></td>
                    <td id="end-time"><button id="end-session" class="hidden">End</button></td>
                    <td id="dur-session">-</td>
                </tr>`;
            $("session-log-table").classList.remove("hidden");
        } else {
            console.error("Error: Invalid session type or missing session data.");
        }
    } else {
        console.log("Waiting for user to select a session type.");
    }

    // Add event listeners for start and end buttons
    $("start-session").addEventListener("click", function addNewSession() {
        const sessionData = dateData.sessionTypes[selectedSession];
        if (!selectedSession || !sessionData) return;
        let sessions = sessionData.sessions;
        const indx = Object.keys(sessions).length + 1;
        const now = new Date().toISOString();
        sessions[indx] = {
            start: now,
            end: '',
            duration: ''
        };
        $("indx").textContent = indx;
        $("start-session").classList.add('hidden');
        $("start-time").appendChild(document.createTextNode(new Date(now).toLocaleTimeString('en-US')));
        $("end-session").classList.remove('hidden');
        saveSessionData();
    });

    $("end-session").addEventListener("click", function endSession() {
        const sessionsData = dateData.sessionTypes;
        const sessionData = sessionsData[selectedSession];
        if (!selectedSession || !sessionData) return;
        const lastSession = sessionData.sessions
        const indx = Object.keys(sessionData.sessions).length;
        const now = new Date().toISOString();
        lastSession[indx] = {
            start: lastSession[indx].start,
            end: now,
            duration: ((new Date(now) - new Date(lastSession[indx].start)) / 1000).toFixed(2)
        };
        const minutes = lastSession[indx].duration / 60;
        const hours = Math.floor(minutes / 60);

        $("start-session").classList.remove('hidden');
        // $("end-time").textContent = new Date(lastSession.end).toLocaleTimeString('en-US');
        $("end-time").appendChild(document.createTextNode(new Date(lastSession.end).toLocaleTimeString('en-US')));
        $("dur-session").textContent = `${hours}h ${Math.floor(minutes % 60)}m ${Math.floor(lastSession[indx].duration % 60)}s`;
        $("end-session").classList.add('hidden');
        let total = 0;
        Object.keys(sessionData.sessions).forEach((key) => {
            total += parseFloat(sessionData.sessions[key].duration) || 0;
        });
        sessionData.totalTime = total;
        saveSessionData();
        renderSessions();
        loadSessionsSummary(sessionsData);
    });
}

function deleteSession(sessionIndex) {
    const sessionDateKey = getDateKey(activeDate);
    const selectedSession = $("session-dropdown").value;
    const sessionData = sessionTypesByDate[sessionDateKey].sessionTypes[selectedSession];
    if (!selectedSession || !sessionData) return;

    sessionIndex = parseInt(sessionIndex, 10); // Convert sessionIndex to integer
    delete sessionData.sessions[sessionIndex];

    // Re-sort sessions
    const sortedSessions = {};
    Object.keys(sessionData.sessions).sort((a, b) => a - b).forEach((key, index) => {
        sortedSessions[index + 1] = sessionData.sessions[key];
    });
    sessionData.sessions = sortedSessions;

    saveSessionData();
    loadSessionsSummary(sessionDateKey);
    renderSessions();
}

document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for right-click to show delete option
    $("session-log-body").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        if (!targetRow || targetRow.id === "last-row") return;

        // Create context menu
        const contextMenu = $("right-click-menu");
        contextMenu.style.display = "block";
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.left = `${event.pageX}px`;

        // Add event listener for delete option
        contextMenu.querySelector("#delete-session").addEventListener("click", function () {
            const sessionIndex = targetRow.querySelector("td").textContent;
            deleteSession(sessionIndex);
            contextMenu.style.display = "none";
            targetRow.remove();
            loadSessionsSummary(getDateKey(activeDate));
        });

        // Remove context menu on click outside
        document.addEventListener("click", function removeContextMenu() {
            contextMenu.style.display = "none";
            document.removeEventListener("click", removeContextMenu);
        });
    });
});

/** EVENT LISTENERS */
$("add-session-type-btn").addEventListener("click", () => $("session-model").classList.remove("hidden"));
$("close-model").addEventListener("click", () => $("session-model").classList.add("hidden"));
$("submit-session").addEventListener("click", addSessionType);

$("next-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
});

$("prev-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

$("new-session-form").addEventListener("submit", function (e) {
    e.preventDefault();
});

/** Initial Rendering */
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());