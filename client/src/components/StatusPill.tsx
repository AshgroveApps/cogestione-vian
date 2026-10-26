import type { CourseStatus } from "../lib/types";
import { STATUS_STYLES } from "../lib/types";

export default function StatusPill({ status }: { status: CourseStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`chip ${s.bg} ${s.text}`}>{s.label}</span>;
}
