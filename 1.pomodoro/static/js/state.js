export const TIMER_MODES = {
    WORK: "work",
    SHORT_BREAK: "short_break",
    LONG_BREAK: "long_break",
};

export const TIMER_ACTIONS = {
    START: "START",
    PAUSE: "PAUSE",
    RESET: "RESET",
    TICK: "TICK",
    COMPLETE: "COMPLETE",
    SET_SETTINGS: "SET_SETTINGS",
};

export const defaultSettings = {
    workSec: 1500,
    shortBreakSec: 300,
    longBreakSec: 900,
    longBreakEvery: 4,
};

export function getModeDuration(mode, settings = defaultSettings) {
    if (mode === TIMER_MODES.SHORT_BREAK) {
        return settings.shortBreakSec;
    }

    if (mode === TIMER_MODES.LONG_BREAK) {
        return settings.longBreakSec;
    }

    return settings.workSec;
}

export function createInitialState(settings = defaultSettings) {
    const durationSec = getModeDuration(TIMER_MODES.WORK, settings);

    return {
        mode: TIMER_MODES.WORK,
        isRunning: false,
        durationSec,
        remainingSec: durationSec,
        startedAt: null,
        cycleCount: 0,
        settings: normalizeSettings(settings),
    };
}

export const initialState = createInitialState();

export function normalizeSettings(settings = defaultSettings) {
    return {
        ...defaultSettings,
        ...settings,
    };
}

export function getNextMode(currentMode, cycleCount, settings = defaultSettings) {
    if (currentMode === TIMER_MODES.WORK) {
        return cycleCount % settings.longBreakEvery === 0
            ? TIMER_MODES.LONG_BREAK
            : TIMER_MODES.SHORT_BREAK;
    }

    return TIMER_MODES.WORK;
}

export function calculateRemainingSec(state, now) {
    if (!state.isRunning || state.startedAt === null) {
        return state.remainingSec;
    }

    const elapsedMs = Math.max(0, now - state.startedAt);
    const elapsedSec = Math.floor(elapsedMs / 1000);

    return Math.max(0, state.durationSec - elapsedSec);
}

export function reduceTimerState(state, action) {
    switch (action.type) {
        case TIMER_ACTIONS.START:
            return startTimer(state, action.now ?? Date.now());
        case TIMER_ACTIONS.PAUSE:
            return pauseTimer(state, action.now ?? Date.now());
        case TIMER_ACTIONS.RESET:
            return resetTimer(state);
        case TIMER_ACTIONS.TICK:
            return tickTimer(state, action.now ?? Date.now());
        case TIMER_ACTIONS.COMPLETE:
            return completeTimer(state);
        case TIMER_ACTIONS.SET_SETTINGS:
            return updateSettings(state, action.settings);
        default:
            return state;
    }
}

function startTimer(state, now) {
    if (state.isRunning) {
        return state;
    }

    const resumedStartedAt = now - (state.durationSec - state.remainingSec) * 1000;

    return {
        ...state,
        isRunning: true,
        startedAt: resumedStartedAt,
    };
}

function pauseTimer(state, now) {
    if (!state.isRunning) {
        return state;
    }

    return {
        ...state,
        isRunning: false,
        remainingSec: calculateRemainingSec(state, now),
        startedAt: null,
    };
}

function resetTimer(state) {
    const durationSec = getModeDuration(state.mode, state.settings);

    return {
        ...state,
        isRunning: false,
        durationSec,
        remainingSec: durationSec,
        startedAt: null,
    };
}

function tickTimer(state, now) {
    if (!state.isRunning) {
        return state;
    }

    const remainingSec = calculateRemainingSec(state, now);

    if (remainingSec === 0) {
        return completeTimer({
            ...state,
            remainingSec: 0,
            isRunning: false,
            startedAt: null,
        });
    }

    return {
        ...state,
        remainingSec,
    };
}

function completeTimer(state) {
    const completedCycleCount = state.mode === TIMER_MODES.WORK
        ? state.cycleCount + 1
        : state.cycleCount;
    const nextMode = getNextMode(state.mode, completedCycleCount, state.settings);
    const nextDurationSec = getModeDuration(nextMode, state.settings);

    return {
        ...state,
        mode: nextMode,
        isRunning: false,
        durationSec: nextDurationSec,
        remainingSec: nextDurationSec,
        startedAt: null,
        cycleCount: completedCycleCount,
    };
}

function updateSettings(state, settings) {
    const nextSettings = normalizeSettings(settings);
    const nextDurationSec = getModeDuration(state.mode, nextSettings);

    return {
        ...state,
        durationSec: nextDurationSec,
        remainingSec: state.isRunning ? state.remainingSec : nextDurationSec,
        startedAt: state.isRunning ? state.startedAt : null,
        settings: nextSettings,
    };
}