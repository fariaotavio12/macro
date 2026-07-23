import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClipBoard } from "./clip-board";

const meta = {
	title: "Components/ClipBoard",
	component: ClipBoard,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	args: {
		texto: "codigo-confirmacao-2026",
		"aria-label": "Copiar codigo",
	},
} satisfies Meta<typeof ClipBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
