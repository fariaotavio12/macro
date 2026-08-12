import { BrowserWindow, screen } from "electron";
import path from "node:path";
import type { DockPosition } from "../shared/macro-types";
import { getSettings } from "./engine/storage";

const WIDTH = 300;
const HEIGHT = 420;
const TAB_WIDTH = 28;
const MARGIN = 24;

let dockWindow: BrowserWindow | null = null;
let expanded = false;

function buildHtml(side: "left" | "right") {
	const isLeft = side === "left";
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
	html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
	.wrap { display: flex; height: 100%; width: 100%; flex-direction: ${isLeft ? "row-reverse" : "row"}; }
	.tab {
		width: 28px;
		flex-shrink: 0;
		height: 64px;
		align-self: center;
		background: #18181b;
		border-radius: ${isLeft ? "0 10px 10px 0" : "10px 0 0 10px"};
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: ${isLeft ? "4px" : "-4px"} 0 16px rgba(0,0,0,.35);
		color: #a1a1aa;
	}
	.tab:hover { background: #232326; color: #fff; }
	.tab svg { transition: transform .2s ease; }
	.panel {
		flex: 1;
		height: 100%;
		background: #18181b;
		box-shadow: ${isLeft ? "4px" : "-4px"} 0 16px rgba(0,0,0,.35);
		display: flex;
		flex-direction: column;
		color: #fff;
	}
	.panel-header {
		padding: 12px 10px 12px 16px;
		font-size: 13px;
		font-weight: 700;
		border-bottom: 1px solid rgba(255,255,255,.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.panel-tabs {
		display: flex;
		gap: 4px;
		padding: 8px 10px 0;
	}
	.panel-tab {
		flex: 1;
		border: none;
		background: transparent;
		color: #a1a1aa;
		font-size: 12px;
		font-weight: 600;
		padding: 6px 8px;
		border-radius: 8px;
		cursor: pointer;
	}
	.panel-tab:hover { color: #fff; }
	.panel-tab.active { background: rgba(255,255,255,.1); color: #fff; }
	.row-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
	.mini-btn {
		border: none;
		background: rgba(255,255,255,.08);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 6px;
		cursor: pointer;
	}
	.mini-btn:hover { background: rgba(255,255,255,.18); }
	.mini-btn:disabled { opacity: .5; cursor: default; }
	.row-result {
		font-size: 11px;
		color: #a1a1aa;
		padding: 0 8px 6px;
	}
	.close-btn {
		border: none;
		background: transparent;
		color: #a1a1aa;
		cursor: pointer;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.close-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
	.panel-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 8px;
		border-radius: 8px;
		background: rgba(255,255,255,.04);
	}
	.row-name {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.row-hotkey {
		font-size: 11px;
		color: #a1a1aa;
		flex-shrink: 0;
	}
	.empty {
		color: #a1a1aa;
		font-size: 12px;
		padding: 16px 8px;
		text-align: center;
	}
	.switch {
		flex-shrink: 0;
		width: 32px;
		height: 18px;
		border-radius: 999px;
		background: #3f3f46;
		position: relative;
		cursor: pointer;
		border: none;
		padding: 0;
	}
	.switch.on { background: #22c55e; }
	.switch::after {
		content: "";
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: #fff;
		transition: transform .15s ease;
	}
	.switch.on::after { transform: translateX(14px); }
	.panel-footer { padding: 10px; border-top: 1px solid rgba(255,255,255,.08); }
	.open-btn {
		width: 100%;
		border: none;
		background: rgba(255,255,255,.08);
		color: #fff;
		font-size: 12px;
		font-weight: 600;
		padding: 8px;
		border-radius: 8px;
		cursor: pointer;
	}
	.open-btn:hover { background: rgba(255,255,255,.16); }
</style>
</head>
<body>
	<div class="wrap">
		<div class="tab" id="tab" title="Expandir/recolher">
			<svg id="arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="${isLeft ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}"/>
			</svg>
		</div>
		<div class="panel">
			<div class="panel-header">
				<span>Macro App</span>
				<button class="close-btn" id="closeBtn" title="Recolher">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
			<div class="panel-tabs">
				<button class="panel-tab active" data-tab="macros">Macros</button>
				<button class="panel-tab" data-tab="capturas">Capturas</button>
			</div>
			<div class="panel-list" id="list"></div>
			<div class="panel-footer">
				<button class="open-btn" id="openBtn">Abrir app completo</button>
			</div>
		</div>
	</div>
	<script>
		let expanded = false;
		let activeTab = "macros";
		let macros = [];
		let profiles = [];
		// Resultado do último "Testar" por perfil — some quando a lista é recriada.
		const scanResults = {};

		const arrow = document.getElementById("arrow");
		const list = document.getElementById("list");

		function setExpanded(next) {
			expanded = next;
			arrow.style.transform = expanded ? "rotate(180deg)" : "rotate(0deg)";
			window.api.dock.toggle(expanded);
		}

		function escapeHtml(value) {
			return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
		}

		function renderMacros() {
			if (macros.length === 0) {
				list.innerHTML = '<div class="empty">Nenhuma macro cadastrada</div>';
				return;
			}
			list.innerHTML = macros
				.map(
					(m) => \`
					<div class="row">
						<span class="row-name" title="\${escapeHtml(m.name)}">\${escapeHtml(m.name)}</span>
						\${m.hotkey ? \`<span class="row-hotkey">\${escapeHtml(m.hotkey)}</span>\` : ""}
						<button class="switch \${m.active ? "on" : ""}" data-id="\${m.id}"></button>
					</div>
				\`,
				)
				.join("");
			list.querySelectorAll(".switch").forEach((el) => {
				el.addEventListener("click", async () => {
					const id = el.getAttribute("data-id");
					const macro = macros.find((m) => m.id === id);
					if (!macro) return;
					await window.api.macro.save({ ...macro, active: !macro.active });
				});
			});
		}

		function renderCaptures() {
			if (profiles.length === 0) {
				list.innerHTML = '<div class="empty">Nenhum perfil de captura</div>';
				return;
			}
			list.innerHTML = profiles
				.map(
					(p) => \`
					<div>
						<div class="row">
							<span class="row-name" title="\${escapeHtml(p.name)}">\${escapeHtml(p.name)}</span>
							\${p.hotkey ? \`<span class="row-hotkey">\${escapeHtml(p.hotkey)}</span>\` : ""}
							<div class="row-actions">
								<button class="mini-btn" data-run="\${p.id}" title="Executar uma varredura agora">▶</button>
								<button class="mini-btn" data-test="\${p.id}" title="Só detecta, não joga pokébola">Testar</button>
								<button class="switch \${p.active ? "on" : ""}" data-toggle="\${p.id}"></button>
							</div>
						</div>
						\${scanResults[p.id] ? \`<div class="row-result">\${escapeHtml(scanResults[p.id])}</div>\` : ""}
					</div>
				\`,
				)
				.join("");

			list.querySelectorAll("[data-toggle]").forEach((el) => {
				el.addEventListener("click", async () => {
					const id = el.getAttribute("data-toggle");
					const profile = profiles.find((p) => p.id === id);
					if (!profile) return;
					await window.api.capture.saveProfile({ ...profile, active: !profile.active });
				});
			});

			list.querySelectorAll("[data-run]").forEach((el) => {
				el.addEventListener("click", () => window.api.capture.runProfile(el.getAttribute("data-run")));
			});

			list.querySelectorAll("[data-test]").forEach((el) => {
				el.addEventListener("click", async () => {
					const id = el.getAttribute("data-test");
					el.disabled = true;
					el.textContent = "...";
					try {
						const preview = await window.api.capture.scanPreviewProfile(id);
						scanResults[id] = preview
							? \`\${preview.targets.length} alvo(s) · \${preview.scanMs} ms\`
							: "perfil não encontrado";
					} catch (error) {
						scanResults[id] = "falhou: " + (error && error.message ? error.message : error);
					}
					render();
				});
			});
		}

		function render() {
			document.querySelectorAll(".panel-tab").forEach((el) => {
				el.classList.toggle("active", el.getAttribute("data-tab") === activeTab);
			});
			if (activeTab === "macros") renderMacros();
			else renderCaptures();
		}

		async function refresh() {
			[macros, profiles] = await Promise.all([window.api.macro.list(), window.api.capture.listProfiles()]);
			render();
		}

		window.api.macro.onChanged((updated) => {
			macros = updated;
			render();
		});

		window.api.capture.onProfilesChanged((updated) => {
			profiles = updated;
			render();
		});

		document.querySelectorAll(".panel-tab").forEach((el) => {
			el.addEventListener("click", () => {
				activeTab = el.getAttribute("data-tab");
				render();
			});
		});

		document.getElementById("tab").addEventListener("click", () => setExpanded(!expanded));
		document.getElementById("closeBtn").addEventListener("click", () => setExpanded(false));

		document.getElementById("openBtn").addEventListener("click", () => {
			window.api.window.restoreMain();
		});

		refresh();
	</script>
</body>
</html>`;
}

function parsePosition(position: DockPosition): { side: "left" | "right"; vertical: "top" | "center" | "bottom" } {
	const [side, vertical] = position.split("-") as ["left" | "right", "top" | "center" | "bottom"];
	return { side, vertical };
}

function getBounds(isExpanded: boolean, position: DockPosition) {
	const { side, vertical } = parsePosition(position);
	const display = screen.getPrimaryDisplay();
	const width = WIDTH;
	const height = HEIGHT;

	const x =
		side === "right"
			? display.workArea.x + display.workArea.width - (isExpanded ? width : TAB_WIDTH)
			: display.workArea.x - (isExpanded ? 0 : width - TAB_WIDTH);

	const y =
		vertical === "top"
			? display.workArea.y + MARGIN
			: vertical === "bottom"
				? display.workArea.y + display.workArea.height - height - MARGIN
				: display.workArea.y + Math.round((display.workArea.height - height) / 2);

	return { x, y, width, height };
}

export function showDockWindow() {
	const settings = getSettings();
	if (!settings.dockEnabled) return;

	if (dockWindow && !dockWindow.isDestroyed()) {
		dockWindow.show();
		return;
	}

	expanded = false;
	const { side } = parsePosition(settings.dockPosition);
	dockWindow = new BrowserWindow({
		...getBounds(false, settings.dockPosition),
		frame: false,
		resizable: false,
		movable: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		skipTaskbar: true,
		transparent: true,
		alwaysOnTop: true,
		hasShadow: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});
	dockWindow.setAlwaysOnTop(true, "screen-saver");
	dockWindow.loadURL(`data:text/html,${encodeURIComponent(buildHtml(side))}`);
	dockWindow.on("closed", () => {
		dockWindow = null;
	});
}

export function isDockVisible() {
	return !!dockWindow && !dockWindow.isDestroyed() && dockWindow.isVisible();
}

export function hideDockWindow() {
	if (dockWindow && !dockWindow.isDestroyed()) {
		dockWindow.hide();
	}
	expanded = false;
}

export function toggleDockExpanded(nextExpanded: boolean) {
	if (!dockWindow || dockWindow.isDestroyed()) return;
	expanded = nextExpanded;
	dockWindow.setBounds(getBounds(expanded, getSettings().dockPosition), true);
}

/** Chamado depois que as configurações mudam: aplica on/off e reposiciona se já estiver aberto. */
export function refreshDockFromSettings() {
	const settings = getSettings();
	if (!settings.dockEnabled) {
		hideDockWindow();
		return;
	}
	if (!dockWindow || dockWindow.isDestroyed() || !dockWindow.isVisible()) return;
	// Posição/lado podem ter mudado — recria a janela para atualizar o HTML espelhado.
	dockWindow.close();
	dockWindow = null;
	showDockWindow();
}
