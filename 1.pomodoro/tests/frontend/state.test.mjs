import test from 'node:test';
import assert from 'node:assert/strict';

import {
    TIMER_ACTIONS,
    TIMER_MODES,
    createInitialState,
    reduceTimerState,
} from '../../static/js/state.js';


test('START and PAUSE preserve elapsed time', () => {
    let state = createInitialState();

    state = reduceTimerState(state, { type: TIMER_ACTIONS.START, now: 100000 });
    state = reduceTimerState(state, { type: TIMER_ACTIONS.TICK, now: 105000 });
    state = reduceTimerState(state, { type: TIMER_ACTIONS.PAUSE, now: 105000 });

    assert.equal(state.isRunning, false);
    assert.equal(state.remainingSec, 1495);
    assert.equal(state.startedAt, null);
});


test('COMPLETE moves work sessions to long break on fourth cycle', () => {
    const state = reduceTimerState(
        {
            ...createInitialState(),
            mode: TIMER_MODES.WORK,
            cycleCount: 3,
            durationSec: 1500,
            remainingSec: 0,
        },
        { type: TIMER_ACTIONS.COMPLETE },
    );

    assert.equal(state.mode, TIMER_MODES.LONG_BREAK);
    assert.equal(state.cycleCount, 4);
    assert.equal(state.remainingSec, 900);
});


test('COMPLETE returns break sessions to work mode', () => {
    const state = reduceTimerState(
        {
            ...createInitialState(),
            mode: TIMER_MODES.SHORT_BREAK,
            durationSec: 300,
            remainingSec: 0,
        },
        { type: TIMER_ACTIONS.COMPLETE },
    );

    assert.equal(state.mode, TIMER_MODES.WORK);
    assert.equal(state.remainingSec, 1500);
});