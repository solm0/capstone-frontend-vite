import Breadcrumb from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import LogoutButton from "./LogoutButton";

export default function HomeDashboard() {
  return (
    <div className="relative w-full h-full">
      <LogoutButton />
      <Breadcrumb />
      <Desk />
    </div>
  )
}