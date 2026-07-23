import { Button, mouse, keyboard, Point, straightTo } from "@nut-tree-fork/nut-js";
import type { Macro, MouseButton, MouseMode, Step } from "../../shared/macro-types";
import { CANONICAL_TO_NUT_KEY } from "./key-map-nut";
import type { CanonicalKey } from "../../shared/key-map";

const NUT_BUTTON: Record<MouseButton, Button> = {
	left: Button.LEFT,
	right: Button.RIGHT,
	middle: Button.MIDDLE,
};

function sleep(ms: number, isAborted: () => boolean): Promise<void> {
	return new Promise((resolve) => {
		if (ms <= 0) return resolve();
		const start = Date.now();
		const tick = () => {
			if (isAborted() || Date.now() - start >= ms) return resolve();
			setTimeout(tick, Math.min(20, ms));
		};
		tick();
	});
}

async function moveMouse(x: number, y: number, mouseMode: MouseMode) {
	if (mouseMode === "jump") {
		await mouse.setPosition(new Point(x, y));
	} else {
		await mouse.move(straightTo(new Point(x, y)));
	}
}

async function executeStep(step: Step, mouseMode: MouseMode, isAborted: () => boolean) {
	switch (step.type) {
		case "moveMouse":
			await moveMouse(step.x, step.y, mouseMode);
			return;
		case "click":
			await moveMouse(step.x, step.y, mouseMode);
			await mouse.click(NUT_BUTTON[step.button]);
			return;
		case "type":
			await keyboard.type(step.text);
			return;
		case "key": {
			const keys = step.keys.map((name) => CANONICAL_TO_NUT_KEY[name as CanonicalKey]).filter(Boolean);
			if (keys.length === 0) return;
			await keyboard.pressKey(...keys);
			await keyboard.releaseKey(...keys);
			return;
		}
		case "wait":
			await sleep(step.ms, isAborted);
			return;
	}
}

export async function playMacro(macro: Macro, isAborted: () => boolean, onIteration?: (count: number) => void) {
	let iteration = 0;
	do {
		for (const step of macro.steps) {
			if (isAborted()) return;
			await executeStep(step, macro.mouseMode, isAborted);
		}
		iteration += 1;
		onIteration?.(iteration);
		if (macro.repeat.mode === "once") return;
		if (macro.repeat.mode === "times" && iteration >= (macro.repeat.count ?? 1)) return;
	} while (!isAborted());
}
