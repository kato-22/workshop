export async function fetchSettings() {
    const response = await fetch("/api/settings");

    if (!response.ok) {
        throw new Error("Failed to fetch settings.");
    }

    const data = await response.json();

    return {
        workSec: data.work_sec,
        shortBreakSec: data.short_break_sec,
        longBreakSec: data.long_break_sec,
        longBreakEvery: data.long_break_every,
    };
}

export async function fetchTodayStats() {
    const response = await fetch("/api/stats/today");

    if (!response.ok) {
        throw new Error("Failed to fetch today stats.");
    }

    return response.json();
}

export async function createCompletedSession(session) {
    const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(session),
    });

    if (!response.ok) {
        throw new Error("Failed to create session.");
    }

    return response.json();
}