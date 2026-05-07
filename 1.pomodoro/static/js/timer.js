import { createCompletedSession, fetchSettings, fetchTodayStats } from "./api.js";
import {
    TIMER_ACTIONS,
    TIMER_MODES,
    createInitialState,
    reduceTimerState,
} from "./state.js";
import { createUI } from "./ui.js";

export function createTimer({
    reducer = reduceTimerState,
    initialState = createInitialState(),
    now = () => Date.now(),
    intervalMs = 250,
    onStateChange = () => {},
    onSessionComplete = async () => {},
} = {}) {
    let state = initialState;
    let intervalId = null;

    const notify = () => {
        onStateChange(state);
    };

    const dispatch = (action) => {
        const previousState = state;
        state = reducer(state, action);

        if (state.isRunning) {
            ensureTicker();
        } else {
            clearTicker();
        }

        notify();
        void handleCompletion(previousState, state, now, onSessionComplete);
        return state;
    };

    const ensureTicker = () => {
        if (intervalId !== null) {
            return;
        }

        intervalId = window.setInterval(() => {
            dispatch({ type: TIMER_ACTIONS.TICK, now: now() });
        }, intervalMs);
    };

    const clearTicker = () => {
        if (intervalId === null) {
            return;
        }

        window.clearInterval(intervalId);
        intervalId = null;
    };

    notify();

    return {
        dispatch,
        getState() {
            return state;
        },
        start() {
            return dispatch({ type: TIMER_ACTIONS.START, now: now() });
        },
        pause() {
            return dispatch({ type: TIMER_ACTIONS.PAUSE, now: now() });
        },
        reset() {
            return dispatch({ type: TIMER_ACTIONS.RESET });
        },
        updateSettings(settings) {
            return dispatch({ type: TIMER_ACTIONS.SET_SETTINGS, settings });
        },
        destroy() {
            clearTicker();
        },
    };
}

async function handleCompletion(previousState, currentState, now, onSessionComplete) {
    if (!didSessionComplete(previousState, currentState)) {
        return;
    }

    try {
        await onSessionComplete({
            mode: previousState.mode,
            duration_sec: previousState.durationSec,
            completed_at: new Date(now()).toISOString(),
        });
    } catch (error) {
        console.error("Failed to process completed session", error);
    }
}

function didSessionComplete(previousState, currentState) {
    if (!previousState.isRunning || previousState.remainingSec <= 0) {
        return false;
    }

    if (currentState.isRunning) {
        return false;
    }

    if (previousState.mode !== currentState.mode) {
        return true;
    }

    return previousState.mode === TIMER_MODES.WORK
        && currentState.cycleCount > previousState.cycleCount;
}

function bootstrapTimerApp() {
    const ui = createUI();
    const timer = createTimer({
        onStateChange(state) {
            ui.render(state);
        },
        async onSessionComplete(session) {
            await createCompletedSession(session);
            const stats = await fetchTodayStats();
            ui.renderStats(stats);
        },
    });

    const { startButton, resetButton } = ui.elements;

    startButton.addEventListener("click", () => {
        if (timer.getState().isRunning) {
            timer.pause();
            return;
        }

        timer.start();
    });

    resetButton.addEventListener("click", () => {
        timer.reset();
    });

    fetchSettings()
        .then((settings) => {
            timer.updateSettings(settings);
        })
        .catch(() => {
            timer.reset();
        });

    fetchTodayStats()
        .then((stats) => {
            ui.renderStats(stats);
        })
        .catch((error) => {
            console.error("Failed to fetch today stats", error);
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapTimerApp, { once: true });
} else {
    bootstrapTimerApp();
}