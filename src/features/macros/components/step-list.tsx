import { EmptyState } from "@/components";
import type { Step } from "@shared/macro-types";
import { IfStepRow } from "./if-step-row";
import { StepRow } from "./step-row";

type StepListProps = {
	steps: Step[];
	onChange: (steps: Step[]) => void;
	emptyMessage?: string;
};

export const StepList = ({ steps, onChange, emptyMessage = "Adicione o primeiro passo." }: StepListProps) => {
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
