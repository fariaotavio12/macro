import { EmptyState } from "@/components";
import type { Step } from "@shared/macro-types";
import { useState } from "react";
import { IfStepRow } from "./if-step-row";
import { StepRow } from "./step-row";

type StepListProps = {
	steps: Step[];
	onChange: (steps: Step[]) => void;
	emptyMessage?: string;
};

export const refreshStepIds = (step: Step): Step => {
	const fresh = { ...step, id: crypto.randomUUID() };
	if (fresh.type === "if") {
		return { ...fresh, then: fresh.then.map(refreshStepIds), else: fresh.else.map(refreshStepIds) };
	}
	return fresh;
};

export const StepList = ({ steps, onChange, emptyMessage = "Adicione o primeiro passo." }: StepListProps) => {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const updateStep = (index: number, step: Step) => {
		const next = [...steps];
		next[index] = step;
		onChange(next);
	};

	const removeStep = (index: number) => onChange(steps.filter((_, i) => i !== index));

	const moveStep = (index: number, direction: -1 | 1) => {
		const next = [...steps];
		const target = index + direction;
		[next[index], next[target]] = [next[target], next[index]];
		onChange(next);
	};

	const duplicateStep = (index: number) => {
		const next = [...steps];
		next.splice(index + 1, 0, refreshStepIds(steps[index]));
		onChange(next);
	};

	const reorder = (from: number, to: number) => {
		if (from === to) return;
		const next = [...steps];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		onChange(next);
	};

	const clearDrag = () => {
		setDragIndex(null);
		setOverIndex(null);
	};

	if (steps.length === 0) {
		return <EmptyState title="Nenhum passo ainda" message={emptyMessage} />;
	}

	return (
		<div className="flex flex-col gap-2">
			{steps.map((step, index) => {
				const rowProps = {
					index,
					total: steps.length,
					onChange: (next: Step) => updateStep(index, next),
					onRemove: () => removeStep(index),
					onMoveUp: () => moveStep(index, -1),
					onMoveDown: () => moveStep(index, 1),
					onDuplicate: () => duplicateStep(index),
					isDragging: dragIndex === index,
					isDragOver: overIndex === index && dragIndex !== null && dragIndex !== index,
					onDragStart: () => setDragIndex(index),
					onDragOver: () => setOverIndex(index),
					onDrop: () => {
						if (dragIndex !== null) reorder(dragIndex, index);
						clearDrag();
					},
					onDragEnd: clearDrag,
				};
				return step.type === "if" ? (
					<IfStepRow key={step.id} step={step} {...rowProps} />
				) : (
					<StepRow key={step.id} step={step} {...rowProps} />
				);
			})}
		</div>
	);
};
