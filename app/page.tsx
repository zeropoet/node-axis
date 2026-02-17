import DesktopShell from "@/components/DesktopShell"
import { DEFAULT_CENTER_DISPLAY_CLUSTER_ID } from "@/lib/appRegistry"

export default function Home() {
  return <DesktopShell clusterId={DEFAULT_CENTER_DISPLAY_CLUSTER_ID} />
}
