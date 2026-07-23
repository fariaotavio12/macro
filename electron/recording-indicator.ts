import { BrowserWindow, screen } from "electron";
import path from "node:path";

let indicatorWindow: BrowserWindow | null = null;

const WIDTH = 220;
const HEIGHT = 44;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
	html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; }
	.pill {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 100%;
		padding: 0 8px 0 14px;
		border-radius: 999px;
		background: #18181b;
		color: #fff;
		font: 600 13px system-ui, -apple-system, "Segoe UI", sans-serif;
		box-shadow: 0 8px 24px rgba(0,0,0,.35);
		user-select: none;
		-webkit-app-region: drag;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: #ef4444;
		box-shadow: 0 0 0 0 rgba(239,68,68,.6);
		animation: pulse 1.2s infinite;
		flex-shrink: 0;
	}
	.dot.paused { animation: none; background: #a1a1aa; }
	.label { flex: 1; white-space: nowrap; }
	@keyframes pulse {
		0% { box-shadow: 0 0 0 0 rgba(239,68,68,.6); }
		70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
		100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
	}
	button {
		-webkit-app-region: no-drag;
		border: none;
		background: rgba(255,255,255,.12);
		color: #fff;
		font: 600 12px system-ui, sans-serif;
		border-radius: 999px;
		padding: 6px 10px;
		cursor: pointer;
		flex-shrink: 0;
	}
	button:hover { background: rgba(255,255,255,.22); }
	button.stop { background: #ef4444; }
	button.stop:hover { background: #dc2626; }
</style>
</head>
<body>
	<div class="pill">
		<span class="dot" id="dot"></span>
		<span class="label" id="label">Gravando...</span>
		<button id="pauseBtn" type="button">Pausar</button>
		<button id="stopBtn" class="stop" type="button">Parar</button>
	</div>
	<script>
		const dot = document.getElementById("dot");
		const label = document.getElementById("label");
		const pauseBtn = document.getElementById("pauseBtn");

		pauseBtn.addEventListener("click", () => window.api.record.pauseToggle());
		document.getElementById("stopBtn").addEventListener("click", () => window.api.record.stop());

		window.api.record.onState((state) => {
			if (!state.recording) return;
			dot.classList.toggle("paused", state.paused);
			label.textContent = state.paused ? "Pausado" : "Gravando...";
			pauseBtn.textContent = state.paused ? "Retomar" : "Pausar";
		});
	</script>
</body>
</html>`;

export function showRecordingIndicator() {
	if (indicatorWindow) return;

	const display = screen.getPrimaryDisplay();
	indicatorWindow = new BrowserWindow({
		width: WIDTH,
		height: HEIGHT,
		x: display.workArea.x + display.workArea.width - WIDTH - 16,
		y: display.workArea.y + 16,
		frame: false,
		resizable: false,
		movable: true,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		skipTaskbar: true,
		transparent: true,
		alwaysOnTop: true,
		hasShadow: false,
		// focusable:false evita roubar o foco de teclado de quem está gravando, sem
		// depender de eventos de show que podem não disparar para conteúdo data:.
		focusable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});
	indicatorWindow.setAlwaysOnTop(true, "screen-saver");
	indicatorWindow.loadURL(`data:text/html,${encodeURIComponent(HTML)}`);
	indicatorWindow.on("closed", () => {
		indicatorWindow = null;
	});
}

export function hideRecordingIndicator() {
	if (indicatorWindow && !indicatorWindow.isDestroyed()) {
		indicatorWindow.close();
	}
	indicatorWindow = null;
}
