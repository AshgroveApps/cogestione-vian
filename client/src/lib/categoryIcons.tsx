import {
  FlaskConical,
  Sigma,
  Languages,
  Cpu,
  Palette,
  Trophy,
  Compass,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Scienze: FlaskConical,
  Matematica: Sigma,
  Lingue: Languages,
  Tecnologia: Cpu,
  "Arte e cultura": Palette,
  Sport: Trophy,
  Orientamento: Compass,
  Altro: Sparkles,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Sparkles;
}
