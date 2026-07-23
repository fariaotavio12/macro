import { HeaderDashboardDesktop, HeaderDashboardMobile } from "@/components/navbar/headerDashboard";
import { DialogSubscriptionError } from "@/components/overlays/subscriptionError";
import { DialogSubscriptionSucess } from "@/components/overlays/subscriptionSucess";
import { AppSidebar } from "@/components/sidebar/index";
import { SidebarInset } from "@/components/sidebar";
import { Outlet } from "react-router-dom";

export const LayoutDashboard = () => {
	return (
		<>
			<AppSidebar variant="sidebar" id="sideBarLayout" />
			<SidebarInset className="min-w-0 overflow-x-hidden">
				<HeaderDashboardDesktop />
				<HeaderDashboardMobile />
				<div className="flex flex-1 flex-col pb-18 lg:pb-0">
					<Outlet />
				</div>
				<DialogSubscriptionSucess />
				<DialogSubscriptionError />
			</SidebarInset>
		</>
	);
};
