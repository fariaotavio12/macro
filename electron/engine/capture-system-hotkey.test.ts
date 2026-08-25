import { describe, expect, it, vi } from "vitest";
import type { CaptureConfig } from "../../shared/capture-types";
import { createCaptureSystemHotkey } from "./capture-system-hotkey";

const captureConfig = (hotkey: string | undefined, active = true): CaptureConfig => ({
	active,
	templates: [],
	excludeRegions: [],
	ballKey: "F1",
	clickAfterKey: false,
	maxTargets: 5,
	delayBeforeKeyMs: 40,
	delayBetweenTargetsMs: 120,
	rescanPasses: 3,
	rescanDelayMs: 700,
	targetCooldownMs: 5000,
	maxOverlap: 0.4,
	parking: "origem",
	requireGameFocus: true,
	mode: "once",
	loopIntervalMs: 500,
	hotkey,
});

describe("createCaptureSystemHotkey", () => {
	it("registers the configured accelerator and triggers the latest capture callback", () => {
		let registeredCallback: (() => void) | undefined;
		const shortcuts = {
			register: vi.fn((_accelerator: string, callback: () => void) => {
				registeredCallback = callback;
				return true;
			}),
			unregister: vi.fn(),
		};
		const registry = createCaptureSystemHotkey(shortcuts);
		const firstTrigger = vi.fn();
		const latestTrigger = vi.fn();

		expect(registry.sync(captureConfig("Ctrl+Alt+R"), firstTrigger)).toBe(true);
		expect(shortcuts.register).toHaveBeenCalledWith("Control+Alt+R", expect.any(Function));

		expect(registry.sync(captureConfig("Ctrl+Alt+R"), latestTrigger)).toBe(true);
		expect(shortcuts.register).toHaveBeenCalledTimes(1);
		registeredCallback?.();
		expect(firstTrigger).not.toHaveBeenCalled();
		expect(latestTrigger).toHaveBeenCalledTimes(1);
	});

	it("releases the old accelerator when the hotkey changes or captures are disabled", () => {
		const shortcuts = { register: vi.fn(() => true), unregister: vi.fn() };
		const registry = createCaptureSystemHotkey(shortcuts);

		registry.sync(captureConfig("R"), vi.fn());
		registry.sync(captureConfig("F8"), vi.fn());
		registry.sync(captureConfig("F8", false), vi.fn());

		expect(shortcuts.unregister).toHaveBeenNthCalledWith(1, "R");
		expect(shortcuts.unregister).toHaveBeenNthCalledWith(2, "F8");
	});

	it("returns false and leaves no registration when Windows rejects the accelerator", () => {
		const shortcuts = { register: vi.fn(() => false), unregister: vi.fn() };
		const registry = createCaptureSystemHotkey(shortcuts);

		expect(registry.sync(captureConfig("R"), vi.fn())).toBe(false);
		registry.release();
		expect(shortcuts.unregister).not.toHaveBeenCalled();
	});

	it("returns false when the shortcut API throws during registration", () => {
		const shortcuts = { register: vi.fn(() => { throw new Error("invalid accelerator"); }), unregister: vi.fn() };
		const registry = createCaptureSystemHotkey(shortcuts);

		expect(registry.sync(captureConfig("Invalid+R"), vi.fn())).toBe(false);
		expect(shortcuts.unregister).not.toHaveBeenCalled();
	});
});
