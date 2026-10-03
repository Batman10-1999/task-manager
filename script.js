const taskInput =
    document.getElementById("taskInput");

const taskList =
    document.getElementById("taskList");

const progressText =
    document.getElementById("progressText");

const alarmDate =
    document.getElementById("alarmDate");

const alarmTime =
    document.getElementById("alarmTime");

const finishDuration =
    document.getElementById("finishDuration");

const reminderBefore =
    document.getElementById("reminderBefore");

const customReminderBox =
    document.getElementById("customReminderBox");

const customReminder =
    document.getElementById("customReminder");

const customReminderUnit =
    document.getElementById("customReminderUnit");
const customDurationBox =
    document.getElementById("customDurationBox");

const customDuration =
    document.getElementById("customDuration");

const customDurationUnit =
    document.getElementById("customDurationUnit");

const timezoneSelect =
    document.getElementById("timezoneSelect");

const globalTime =
    document.getElementById("globalTime");

const globalDate =
    document.getElementById("globalDate");


let tasks = [];

let activeFilter = "all";

let runningTaskId = null;

let audioContext = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadTasks();

        loadTimezone();

        setDefaultAlarmDateTime();

        updateGlobalClock();

        setInterval(
            updateGlobalClock,
            1000
        );

        setInterval(
            updateRunningTimers,
            1000
        );

        setInterval(
            checkAlarms,
            1000
        );

        updateProgress();

    }
);


/* =========================================================
   CUSTOM DURATION
   ========================================================= */

finishDuration.addEventListener(
    "change",
    function () {

        if (
            finishDuration.value ===
            "custom"
        ) {

            customDurationBox
                .classList
                .remove("hidden");

        }
        else {

            customDurationBox
                .classList
                .add("hidden");

        }

    }
);

reminderBefore.addEventListener(
    "change",
    function () {

        if (
            reminderBefore.value ===
            "custom"
        ) {

            customReminderBox
                .classList
                .remove("hidden");

        }
        else {

            customReminderBox
                .classList
                .add("hidden");

        }

    }
);


/* =========================================================
   ADD TASK
   ========================================================= */

function addTask() {

    const text =
        taskInput.value.trim();


    if (text === "") {
        return;
    }


    let alarmTimestamp = null;


    if (
        alarmDate.value !== "" &&
        alarmTime.value !== ""
    ) {

        const alarm =
            new Date(
                alarmDate.value +
                "T" +
                alarmTime.value
            );


        if (
            !isNaN(
                alarm.getTime()
            )
        ) {

            alarmTimestamp =
                alarm.getTime();

        }

    }


    const duration =
        getSelectedDuration();

    const reminder =
    getSelectedReminder();

    const task = {

        id:
            Date.now().toString(),

        text:
            text,

        completed:
            false,

        alarmTime:
            alarmTimestamp,

        reminderBefore:
             reminder,

        alarm5Triggered:
            false,

        alarm1Triggered:
            false,

        alarmFinalTriggered:
            false,

        finishDuration:
            duration,

        running:
            false,

        paused:
            false,

        startedAt:
            null,

        elapsedTime:
            0,

        finishedTime:
            null

    };


    tasks.push(
        task
    );


   taskInput.value = "";

    resetAlarmFields();


    saveTasks();

    renderTasks();

    updateProgress();

}


/* =========================================================
   GET SELECTED DURATION
   ========================================================= */

function getSelectedDuration() {

    const value =
        finishDuration.value;


    if (
        value === "0"
    ) {

        return 0;

    }


    if (
        value === "custom"
    ) {

        const number =
            Number(
                customDuration.value
            );


        if (
            !number ||
            number <= 0
        ) {

            return 0;

        }


        if (
            customDurationUnit.value ===
            "hours"
        ) {

            return (
                number *
                60 *
                60 *
                1000
            );

        }


        return (
            number *
            60 *
            1000
        );

    }


    return (
        Number(value) *
        60 *
        1000
    );

}


/* =========================================================
   CREATE TASK
   ========================================================= */

function createTask(task) {

    const li =
        document.createElement("li");


    if (
        task.completed
    ) {

        li.classList.add(
            "completed"
        );

    }


    if (
        task.running
    ) {

        li.classList.add(
            "task-running-item"
        );

    }


    /* TASK DETAILS */

    const details =
        document.createElement("div");

    details.className =
        "task-details";


    const text =
        document.createElement("span");

    text.className =
        "task-text";

    text.textContent =
        task.text;


    details.appendChild(
        text
    );


    /* TASK INFORMATION */

    const info =
        document.createElement("div");

    info.className =
        "task-info";


    if (
        task.alarmTime
    ) {

        const alarm =
            document.createElement("span");

        alarm.className =
            "task-alarm";

        alarm.textContent =
            "Alarm: " +
            formatTaskDate(
                task.alarmTime
            );

        info.appendChild(
            alarm
        );

    }


    if (
        task.finishDuration > 0
    ) {

        const duration =
            document.createElement("span");

        duration.className =
            "task-alarm";

        duration.textContent =
            "Finish: " +
            formatDuration(
                task.finishDuration
            );

        info.appendChild(
            duration
        );

    }


    if (
        task.running
    ) {

        const running =
            document.createElement("span");

        running.className =
            "task-running";

        running.textContent =
            task.paused
                ? "Paused"
                : "Running";

        info.appendChild(
            running
        );

    }


    if (
        task.elapsedTime > 0 ||
        task.finishedTime
    ) {

        const time =
            document.createElement("span");

        time.className =
            "task-time";

        time.dataset.taskId =
            task.id;

        time.textContent =
            "Time: " +
            formatDuration(
                getCurrentElapsed(
                    task
                )
            );

        info.appendChild(
            time
        );

    }


    details.appendChild(
        info
    );


    /* =====================================================
       ACTIONS
       ===================================================== */

    const actions =
        document.createElement("div");

    actions.className =
        "task-actions";


    /*
     * GREEN CHECK
     *
     * Start
     * Pause
     * Resume
     */

    const controlButton =
        document.createElement("button");

    controlButton.className =
        "task-start-button";


    if (
        task.completed
    ) {

        controlButton.textContent =
            "✓";

        controlButton.disabled =
            true;

    }
    else if (
        task.running &&
        !task.paused
    ) {

        controlButton.textContent =
            "Ⅱ";

        controlButton.title =
            "Pause";

    }
    else if (
        task.running &&
        task.paused
    ) {

        controlButton.textContent =
            "▶";

        controlButton.title =
            "Resume";

    }
    else {

        controlButton.textContent =
            "✓";

        controlButton.title =
            "Start";

    }


    controlButton.onclick =
        function () {

            if (
                task.completed
            ) {
                return;
            }


            if (
                task.running &&
                !task.paused
            ) {

                pauseTask(
                    task.id
                );

            }
            else if (
                task.running &&
                task.paused
            ) {

                resumeTask(
                    task.id
                );

            }
            else {

                startTask(
                    task.id
                );

            }

        };


    actions.appendChild(
        controlButton
    );


    /*
     * RED X
     *
     * Active:
     *     Done
     *
     * Completed:
     *     Delete
     */

    const secondButton =
        document.createElement("button");


    secondButton.className =
        "task-done-button";


    if (
        task.completed
    ) {

        secondButton.textContent =
            "×";

        secondButton.title =
            "Delete";

        secondButton.className =
            "task-delete-button";

        secondButton.onclick =
            function () {

                deleteTask(
                    task.id
                );

            };

    }
    else {

        secondButton.textContent =
            "×";

        secondButton.title =
            "Done";

        secondButton.onclick =
            function () {

                completeTask(
                    task.id
                );

            };

    }


    actions.appendChild(
        secondButton
    );


    li.appendChild(
        details
    );

    li.appendChild(
        actions
    );


    return li;

}


/* =========================================================
   RENDER
   ========================================================= */

function renderTasks() {

    taskList.innerHTML = "";


    tasks.forEach(
        function (task) {

            let show =
                true;


            if (
                activeFilter ===
                "active"
            ) {

                show =
                    !task.completed;

            }


            if (
                activeFilter ===
                "completed"
            ) {

                show =
                    task.completed;

            }


            if (show) {

                taskList.appendChild(
                    createTask(
                        task
                    )
                );

            }

        }
    );


    updateProgress();

}


/* =========================================================
   START
   ========================================================= */

function startTask(taskId) {

    const task =
        findTask(
            taskId
        );


    if (
        !task ||
        task.completed
    ) {

        return;

    }


    if (
        runningTaskId !== null &&
        runningTaskId !== taskId
    ) {

        pauseTask(
            runningTaskId
        );

    }


    task.running =
        true;

    task.paused =
        false;

    task.startedAt =
        Date.now();


    runningTaskId =
        taskId;


    enableAlarmAudio();

    saveTasks();

    renderTasks();


    document.title =
        "Running - " +
        task.text;

}


/* =========================================================
   PAUSE
   ========================================================= */

function pauseTask(taskId) {

    const task =
        findTask(
            taskId
        );


    if (
        !task ||
        !task.running ||
        task.paused
    ) {

        return;

    }


    task.elapsedTime +=
        Date.now() -
        task.startedAt;


    task.startedAt =
        null;

    task.paused =
        true;


    saveTasks();

    renderTasks();

}


/* =========================================================
   RESUME
   ========================================================= */

function resumeTask(taskId) {

    const task =
        findTask(
            taskId
        );


    if (
        !task ||
        !task.running ||
        !task.paused
    ) {

        return;

    }


    task.startedAt =
        Date.now();

    task.paused =
        false;


    runningTaskId =
        taskId;


    enableAlarmAudio();

    saveTasks();

    renderTasks();

}


/* =========================================================
   COMPLETE / DONE
   ========================================================= */

function completeTask(taskId) {

    const task =
        findTask(
            taskId
        );


    if (!task) {
        return;
    }


    if (
        task.running &&
        task.startedAt
    ) {

        task.elapsedTime +=
            Date.now() -
            task.startedAt;

    }


    task.running =
        false;

    task.paused =
        false;

    task.startedAt =
        null;

    task.completed =
        true;

    task.finishedTime =
        Date.now();


    if (
        runningTaskId === taskId
    ) {

        runningTaskId =
            null;

    }


    saveTasks();

    renderTasks();

    updateProgress();


    document.title =
        "Task Manager";

}


/* =========================================================
   AUTOMATIC FINISH
   ========================================================= */

function checkFinishedTasks() {

    tasks.forEach(
        function (task) {

            if (
                !task.running ||
                task.paused ||
                !task.finishDuration ||
                !task.startedAt
            ) {

                return;

            }


            const elapsed =
                getCurrentElapsed(
                    task
                );


            if (
                elapsed >=
                task.finishDuration
            ) {

                completeTask(
                    task.id
                );

            }

        }
    );

}


setInterval(
    checkFinishedTasks,
    1000
);

function getSelectedReminder() {

    const value =
        reminderBefore.value;


    if (
        value === "0"
    ) {

        return 0;

    }


    if (
        value === "custom"
    ) {

        const number =
            Number(
                customReminder.value
            );


        if (
            !number ||
            number <= 0
        ) {

            return 0;

        }


        if (
            customReminderUnit.value ===
            "hours"
        ) {

            return (
                number *
                60 *
                60 *
                1000
            );

        }


        return (
            number *
            60 *
            1000
        );

    }


    return (
        Number(value) *
        60 *
        1000
    );

}

/* =========================================================
   DELETE
   ========================================================= */

function deleteTask(taskId) {

    const task =
        findTask(
            taskId
        );


    if (!task) {
        return;
    }


    tasks =
        tasks.filter(
            function (item) {

                return (
                    item.id !==
                    taskId
                );

            }
        );


    if (
        runningTaskId === taskId
    ) {

        runningTaskId =
            null;

    }


    saveTasks();

    renderTasks();

    updateProgress();

}


/* =========================================================
   FIND TASK
   ========================================================= */

function findTask(taskId) {

    return tasks.find(
        function (task) {

            return (
                task.id ===
                taskId
            );

        }
    );

}


/* =========================================================
   CURRENT ELAPSED TIME
   ========================================================= */

function getCurrentElapsed(task) {

    let total =
        task.elapsedTime ||
        0;


    if (
        task.running &&
        !task.paused &&
        task.startedAt
    ) {

        total +=
            Date.now() -
            task.startedAt;

    }


    return total;

}


/* =========================================================
   LIVE TIMER
   ========================================================= */

function updateRunningTimers() {

    document
        .querySelectorAll(
            ".task-time"
        )
        .forEach(
            function (element) {

                const task =
                    findTask(
                        element.dataset.taskId
                    );


                if (!task) {
                    return;
                }


                element.textContent =
                    "Time: " +
                    formatDuration(
                        getCurrentElapsed(
                            task
                        )
                    );

            }
        );

}


/* =========================================================
   PROGRESS
   ========================================================= */

function updateProgress() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            function (task) {

                return task.completed;

            }
        ).length;


    const active =
        total -
        completed;


    progressText.textContent =
        `${active} Active | ${completed} Completed`;

}


/* =========================================================
   FILTER
   ========================================================= */

function filterTasks(type) {

    activeFilter =
        type;

    renderTasks();

}


/* =========================================================
   ALARM SYSTEM
   ========================================================= */

function checkAlarms() {

    const now = Date.now();

    tasks.forEach(function (task) {

        /*
         * No alarm set
         */
        if (
            !task.alarmTime ||
            task.completed
        ) {
            return;
        }


        /*
         * PRE-REMINDER
         *
         * Uses ONLY the reminder selected
         * by the user.
         */
        if (
            task.reminderBefore > 0 &&
            !task.alarmReminderTriggered
        ) {

            const reminderTime =
                task.alarmTime -
                task.reminderBefore;


            if (
                now >= reminderTime &&
                now < task.alarmTime
            ) {

                task.alarmReminderTriggered =
                    true;

                saveTasks();

                triggerAlarm(
                    task,
                    "Reminder"
                );

            }

        }


        /*
         * FINAL ALARM
         *
         * Happens exactly at the
         * scheduled date/time.
         */
        if (
            !task.alarmFinalTriggered &&
            now >= task.alarmTime
        ) {

            task.alarmFinalTriggered =
                true;

            saveTasks();

            triggerAlarm(
                task,
                "Task time"
            );

        }

    });

}


/* =========================================================
   ALARM
   ========================================================= */

function triggerAlarm(
    task,
    message
) {

    enableAlarmAudio();

    playAlarmSound();

    showAlarmNotification(
        task,
        message
    );

    sendBrowserNotification(
        task,
        message
    );


    document.title =
        "ALARM - " +
        task.text;


    setTimeout(
        function () {

            if (
                !runningTaskId
            ) {

                document.title =
                    "Task Manager";

            }

        },
        8000
    );

}


/* =========================================================
   VISUAL NOTIFICATION
   ========================================================= */

function showAlarmNotification(
    task,
    message
) {

    const old =
        document.querySelector(
            ".alarm-notification"
        );


    if (old) {
        old.remove();
    }


    const box =
        document.createElement(
            "div"
        );

    box.className =
        "alarm-notification";


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "alarm-notification-title";

    title.textContent =
        message;


    const text =
        document.createElement(
            "div"
        );

    text.className =
        "alarm-notification-text";

    text.textContent =
        task.text;


    const dismiss =
        document.createElement(
            "button"
        );

    dismiss.textContent =
        "Dismiss";


    dismiss.onclick =
        function () {

            box.remove();

            document.title =
                "Task Manager";

        };


    box.appendChild(
        title
    );

    box.appendChild(
        text
    );

    box.appendChild(
        dismiss
    );


    document.body.appendChild(
        box
    );

}


/* =========================================================
   BROWSER NOTIFICATION
   ========================================================= */

function sendBrowserNotification(
    task,
    message
) {

    if (
        "Notification" in window &&
        Notification.permission ===
        "granted"
    ) {

        try {

            new Notification(
                message,
                {
                    body:
                        task.text
                }
            );

        }
        catch (error) {

            console.log(
                "Browser notification unavailable."
            );

        }

    }

}


/* =========================================================
   AUDIO
   ========================================================= */

function enableAlarmAudio() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();

        }


        if (
            "Notification" in window &&
            Notification.permission ===
            "default"
        ) {

            Notification.requestPermission();

        }

    }
    catch (error) {

        console.log(
            "Audio unavailable."
        );

    }

}


function playAlarmSound() {

    try {

        if (!audioContext) {

            enableAlarmAudio();

        }


        if (!audioContext) {
            return;
        }


        const now =
            audioContext.currentTime;


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const oscillator =
                audioContext
                    .createOscillator();


            const gain =
                audioContext
                    .createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.value =
                i % 2 === 0
                    ? 880
                    : 660;


            gain.gain.setValueAtTime(
                0.001,
                now +
                i *
                0.45
            );


            gain.gain.exponentialRampToValueAtTime(
                0.3,
                now +
                i *
                0.45 +
                0.04
            );


            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now +
                i *
                0.45 +
                0.35
            );


            oscillator.connect(
                gain
            );

            gain.connect(
                audioContext.destination
            );


            oscillator.start(
                now +
                i *
                0.45
            );


            oscillator.stop(
                now +
                i *
                0.45 +
                0.4
            );

        }

    }
    catch (error) {

        console.log(
            "Alarm sound unavailable."
        );

    }

}


/* =========================================================
   GLOBAL CLOCK
   ========================================================= */

function updateGlobalClock() {

    const timezone =
        timezoneSelect.value;


    const now =
        new Date();


    const timeFormatter =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    timezone,

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true
            }
        );


    const dateFormatter =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    timezone,

                weekday:
                    "long",

                day:
                    "2-digit",

                month:
                    "long",

                year:
                    "numeric"
            }
        );


    globalTime.textContent =
        timeFormatter.format(
            now
        );


    globalDate.textContent =
        dateFormatter.format(
            now
        );

}


/* =========================================================
   TIMEZONE
   ========================================================= */

timezoneSelect.addEventListener(
    "change",
    function () {

        localStorage.setItem(
            "taskTimezone",
            timezoneSelect.value
        );

        updateGlobalClock();

    }
);


function loadTimezone() {

    const saved =
        localStorage.getItem(
            "taskTimezone"
        );


    if (saved) {

        timezoneSelect.value =
            saved;

    }

}


/* =========================================================
   STORAGE
   ========================================================= */

function saveTasks() {

    localStorage.setItem(
        "tasks",
        JSON.stringify(
            tasks
        )
    );

}


function loadTasks() {

    const saved =
        JSON.parse(
            localStorage.getItem(
                "tasks"
            )
        ) || [];


    tasks =
        saved.map(
            function (task) {

                return {

                    id:
                        task.id ||
                        Date.now().toString(),

                    text:
                        task.text ||
                        "Untitled Task",

                    completed:
                        Boolean(
                            task.completed
                        ),

                    alarmTime:
                        task.alarmTime ||
                        null,

                    reminderBefore:
                        typeof task.reminderBefore === "number"
                            ? task.reminderBefore
                            : 5,

                    alarmReminderTriggered:
                        Boolean(
                            task.alarmReminderTriggered
                        ),

                    alarmFinalTriggered:
                        Boolean(
                            task.alarmFinalTriggered
                        ),

                    finishDuration:
                        task.finishDuration ||
                        0,

                    running:
                        false,

                    paused:
                        false,

                    startedAt:
                        null,

                    elapsedTime:
                        task.elapsedTime ||
                        0,

                    finishedTime:
                        task.finishedTime ||
                        null

                };

            }
        );


    runningTaskId =
        null;


    renderTasks();

}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatTaskDate(
    timestamp
) {

    return new Date(
        timestamp
    ).toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                true
        }
    );

}


function formatDuration(
    milliseconds
) {

    const seconds =
        Math.floor(
            milliseconds /
            1000
        );


    const hours =
        Math.floor(
            seconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                seconds %
                3600
            ) /
            60
        );


    const remainingSeconds =
        seconds %
        60;


    return (
        String(hours)
            .padStart(2, "0")
        +
        ":" +
        String(minutes)
            .padStart(2, "0")
        +
        ":" +
        String(remainingSeconds)
            .padStart(2, "0")
    );

}

function setDefaultAlarmDateTime() {

    const now =
        new Date();


    /*
     * Default alarm = 5 minutes
     * from the current time.
     */
    now.setMinutes(
        now.getMinutes() + 5
    );


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    alarmDate.value =
        `${year}-${month}-${day}`;


    alarmTime.value =
        `${hours}:${minutes}`;

}

function resetAlarmFields() {

    setDefaultAlarmDateTime();

    finishDuration.value = "0";

    reminderBefore.value = "5";

    customDuration.value = "";

    customReminder.value = "";

    customDurationBox
        .classList
        .add("hidden");

    customReminderBox
        .classList
        .add("hidden");

}