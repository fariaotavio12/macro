import { toast } from "sonner";
import { Toast } from "./toast";

// overloads
type NotifyFn = {
	(message: string): void;
	(title: string, message: string): void;
};

const make =
	(type: "success" | "error" | "warning" | "info", defaultDuration = 4000): NotifyFn =>
	(...args: [string] | [string, string]) => {
		const hasTitle = args.length === 2;
		const title = hasTitle ? args[0] : undefined;
		const message = hasTitle ? args[1] : args[0]; // garante string sempre

		toast.custom((t) => <Toast title={title} message={message} type={type} onClose={() => toast.dismiss(t)} />, {
			duration: defaultDuration,
		});
	};

export const notify = {
	success: make("success", 4000),
	error: make("error", 6000),
	warning: make("warning", 5000),
	info: make("info", 4000),
};
