import { TIMER_MODES } from "./state.js";

const MODE_LABELS = {
    [TIMER_MODES.WORK]: "作業中",
    [TIMER_MODES.SHORT_BREAK]: "短い休憩",
    [TIMER_MODES.LONG_BREAK]: "長い休憩",
};

export function createUI(documentRef = document) {
    const elements = {
        modeLabel: documentRef.querySelector("#timer-mode-label"),
        timerValue: documentRef.querySelector("#timer-value"),
        timerRing: documentRef.querySelector("#timer-ring"),
        startButton: documentRef.querySelector("#start-button"),
        resetButton: documentRef.querySelector("#reset-button"),
        completedSessionsValue: documentRef.querySelector("#completed-sessions-value"),
        focusMinutesValue: documentRef.querySelector("#focus-minutes-value"),
    };

    return {
        elements,
        render(state) {
            renderTimerState(elements, state);
        },
        renderStats(stats) {
            renderStats(elements, stats);
        },
    };
}

export function renderTimerState(elements, state) {
    elements.modeLabel.textContent = MODE_LABELS[state.mode] ?? "作業中";
    elements.timerValue.textContent = formatSeconds(state.remainingSec);
    elements.startButton.textContent = getStartButtonLabel(state);
    elements.startButton.setAttribute("aria-pressed", String(state.isRunning));

    const isInitialState = !state.isRunning && state.remainingSec === state.durationSec;
    elements.resetButton.disabled = isInitialState;

    const progressRatio = getProgressRatio(state);
    const progressDeg = `${Math.max(0, Math.min(360, progressRatio * 360))}deg`;
    elements.timerRing.style.setProperty("--progress-deg", progressDeg);
    elements.timerRing.classList.toggle("is-break", state.mode !== TIMER_MODES.WORK);
}

export function formatSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${seconds}`;
}

export function renderStats(elements, stats) {
    elements.completedSessionsValue.textContent = String(stats.completed_sessions ?? 0);
    elements.focusMinutesValue.textContent = formatFocusMinutes(stats.focus_minutes ?? 0);
}

export function formatFocusMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}分`;
    }

    if (minutes === 0) {
        return `${hours}時間`;
    }

    return `${hours}時間${minutes}分`;
}

function getStartButtonLabel(state) {
    if (state.isRunning) {
        return "一時停止";
    }

    if (state.remainingSec < state.durationSec) {
        return "再開";
    }

    return "開始";
}

function getProgressRatio(state) {
    if (state.durationSec === 0) {
        return 0;
    }

    return (state.durationSec - state.remainingSec) / state.durationSec;
}