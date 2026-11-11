import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "@/games/shared/useCountdown";
import { sound } from "@/lib/audio";

describe("countdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down and expires exactly once", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(3, true, "q1", onExpire));
    expect(result.current).toBe(3);
    act(() => vi.advanceTimersByTime(1100));
    expect(result.current).toBe(2);
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does not run while paused and resumes where it stopped", () => {
    const onExpire = vi.fn();
    const { result, rerender } = renderHook(({ running }) => useCountdown(5, running, "q", onExpire), { initialProps: { running: true } });
    act(() => vi.advanceTimersByTime(2050));
    expect(result.current).toBe(3);
    rerender({ running: false });
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current).toBe(3);
    expect(onExpire).not.toHaveBeenCalled();
    rerender({ running: true });
    act(() => vi.advanceTimersByTime(3100));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("restarts for a new question and can be disabled", () => {
    const onExpire = vi.fn();
    const { result, rerender } = renderHook(({ k }) => useCountdown(4, true, k, onExpire), { initialProps: { k: 1 } });
    act(() => vi.advanceTimersByTime(2100));
    rerender({ k: 2 });
    expect(result.current).toBe(4);
    const off = renderHook(() => useCountdown(0, true, 1, onExpire));
    expect(off.result.current).toBeNull();
  });
});

describe("sound engine", () => {
  it("creates no audio when muted and plays when unmuted", () => {
    const created: unknown[] = [];
    class FakeCtx {
      state = "running";
      currentTime = 0;
      sampleRate = 44100;
      destination = {};
      constructor() {
        created.push(this);
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (x: unknown) => x };
      }
      createOscillator() {
        return { type: "", frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (x: unknown) => x, start() {}, stop() {} };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(10) };
      }
      createBufferSource() {
        return { buffer: null, connect: (x: unknown) => x, start() {} };
      }
      createBiquadFilter() {
        return { type: "", frequency: { value: 0 }, connect: (x: unknown) => x };
      }
      resume() {}
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeCtx;
    sound.configure({ muted: true });
    sound.play("correct");
    expect(created).toHaveLength(0);
    expect(sound.isMuted).toBe(true);
    sound.configure({ muted: false, volume: 0.5 });
    for (const n of ["click", "correct", "wrong", "tick", "win", "timeup", "pop", "wheelTick", "engine", "whoosh", "levelUp"] as const) sound.play(n);
    expect(created).toHaveLength(1);
  });
});
