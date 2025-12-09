/**
 * 🎨 Bibliothèque d'Icônes Centralisée
 * Utilise Lucide React pour des icônes modernes et cohérentes
 */

import {
  // Navigation
  Home,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  // Actions
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Check,
  // Contenu
  Image,
  Tag,
  FileText,
  Folder,
  Upload,
  Download,
  // Status
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Circle,
  // Difficulté & Étude
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  // UI
  Search,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  // Spécial
  Puzzle,
  Sparkles,
  RefreshCw,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'

// Type pour les tailles d'icônes
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const iconSizes: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
}

// Props communes pour toutes les icônes
export interface IconProps {
  size?: IconSize | number
  className?: string
  color?: string
}

// Helper pour obtenir la taille
const getSize = (size?: IconSize | number): number => {
  if (typeof size === 'number') return size
  return iconSizes[size || 'md']
}

/**
 * 🏠 Navigation Icons
 */
export const HomeIcon = ({ size, className, color }: IconProps) => (
  <Home size={getSize(size)} className={className} color={color} />
)

export const DecksIcon = ({ size, className, color }: IconProps) => (
  <BookOpen size={getSize(size)} className={className} color={color} />
)

export const StudyIcon = ({ size, className, color }: IconProps) => (
  <GraduationCap size={getSize(size)} className={className} color={color} />
)

export const StatsIcon = ({ size, className, color }: IconProps) => (
  <BarChart3 size={getSize(size)} className={className} color={color} />
)

export const SettingsIcon = ({ size, className, color }: IconProps) => (
  <Settings size={getSize(size)} className={className} color={color} />
)

/**
 * ⚡ Action Icons
 */
export const AddIcon = ({ size, className, color }: IconProps) => (
  <Plus size={getSize(size)} className={className} color={color} />
)

export const EditIcon = ({ size, className, color }: IconProps) => (
  <Edit3 size={getSize(size)} className={className} color={color} />
)

export const DeleteIcon = ({ size, className, color }: IconProps) => (
  <Trash2 size={getSize(size)} className={className} color={color} />
)

export const SaveIcon = ({ size, className, color }: IconProps) => (
  <Save size={getSize(size)} className={className} color={color} />
)

export const CancelIcon = ({ size, className, color }: IconProps) => (
  <X size={getSize(size)} className={className} color={color} />
)

export const CheckIcon = ({ size, className, color }: IconProps) => (
  <Check size={getSize(size)} className={className} color={color} />
)

/**
 * 📄 Content Icons
 */
export const ImageIcon = ({ size, className, color }: IconProps) => (
  <Image size={getSize(size)} className={className} color={color} />
)

export const TagIcon = ({ size, className, color }: IconProps) => (
  <Tag size={getSize(size)} className={className} color={color} />
)

export const FileIcon = ({ size, className, color }: IconProps) => (
  <FileText size={getSize(size)} className={className} color={color} />
)

export const FolderIcon = ({ size, className, color }: IconProps) => (
  <Folder size={getSize(size)} className={className} color={color} />
)

export const UploadIcon = ({ size, className, color }: IconProps) => (
  <Upload size={getSize(size)} className={className} color={color} />
)

export const DownloadIcon = ({ size, className, color }: IconProps) => (
  <Download size={getSize(size)} className={className} color={color} />
)

/**
 * ✅ Status Icons
 */
export const SuccessIcon = ({ size, className, color }: IconProps) => (
  <CheckCircle2 size={getSize(size)} className={className} color={color} />
)

export const ErrorIcon = ({ size, className, color }: IconProps) => (
  <XCircle size={getSize(size)} className={className} color={color} />
)

export const WarningIcon = ({ size, className, color }: IconProps) => (
  <AlertTriangle size={getSize(size)} className={className} color={color} />
)

export const InfoIcon = ({ size, className, color }: IconProps) => (
  <Info size={getSize(size)} className={className} color={color} />
)

/**
 * 🎯 Difficulty & Study Icons
 */
export const TargetIcon = ({ size, className, color }: IconProps) => (
  <Target size={getSize(size)} className={className} color={color} />
)

export const PuzzleIcon = ({ size, className, color }: IconProps) => (
  <Puzzle size={getSize(size)} className={className} color={color} />
)

export const ZapIcon = ({ size, className, color }: IconProps) => (
  <Zap size={getSize(size)} className={className} color={color} />
)

export const TrendUpIcon = ({ size, className, color }: IconProps) => (
  <TrendingUp size={getSize(size)} className={className} color={color} />
)

export const TrendDownIcon = ({ size, className, color }: IconProps) => (
  <TrendingDown size={getSize(size)} className={className} color={color} />
)

export const CalendarIcon = ({ size, className, color }: IconProps) => (
  <Calendar size={getSize(size)} className={className} color={color} />
)

export const ClockIcon = ({ size, className, color }: IconProps) => (
  <Clock size={getSize(size)} className={className} color={color} />
)

/**
 * 🎨 Difficulty Circle Icons with Colors
 */
export const EasyIcon = ({ size, className }: Omit<IconProps, 'color'>) => (
  <Circle size={getSize(size)} className={`${className} text-green-500 fill-green-500`} />
)

export const MediumIcon = ({ size, className }: Omit<IconProps, 'color'>) => (
  <Circle size={getSize(size)} className={`${className} text-yellow-500 fill-yellow-500`} />
)

export const HardIcon = ({ size, className }: Omit<IconProps, 'color'>) => (
  <Circle size={getSize(size)} className={`${className} text-red-500 fill-red-500`} />
)

/**
 * 🔍 UI Utility Icons
 */
export const SearchIcon = ({ size, className, color }: IconProps) => (
  <Search size={getSize(size)} className={className} color={color} />
)

export const FilterIcon = ({ size, className, color }: IconProps) => (
  <Filter size={getSize(size)} className={className} color={color} />
)

export const EyeIcon = ({ size, className, color }: IconProps) => (
  <Eye size={getSize(size)} className={className} color={color} />
)

export const EyeOffIcon = ({ size, className, color }: IconProps) => (
  <EyeOff size={getSize(size)} className={className} color={color} />
)

export const RefreshIcon = ({ size, className, color }: IconProps) => (
  <RefreshCw size={getSize(size)} className={className} color={color} />
)

export const SparklesIcon = ({ size, className, color }: IconProps) => (
  <Sparkles size={getSize(size)} className={className} color={color} />
)

export const ShareIcon = ({ size, className, color }: IconProps) => (
  <Share2 size={getSize(size)} className={className} color={color} />
)

export const CopyIcon = ({ size, className, color }: IconProps) => (
  <Copy size={getSize(size)} className={className} color={color} />
)

export const ExternalLinkIcon = ({ size, className, color }: IconProps) => (
  <ExternalLink size={getSize(size)} className={className} color={color} />
)

/**
 * 🎯 Chevron Icons
 */
export const ChevronDownIcon = ({ size, className, color }: IconProps) => (
  <ChevronDown size={getSize(size)} className={className} color={color} />
)

export const ChevronUpIcon = ({ size, className, color }: IconProps) => (
  <ChevronUp size={getSize(size)} className={className} color={color} />
)

export const ChevronLeftIcon = ({ size, className, color }: IconProps) => (
  <ChevronLeft size={getSize(size)} className={className} color={color} />
)

export const ChevronRightIcon = ({ size, className, color }: IconProps) => (
  <ChevronRight size={getSize(size)} className={className} color={color} />
)

export const MoreIcon = ({ size, className, color }: IconProps) => (
  <MoreVertical size={getSize(size)} className={className} color={color} />
)

/**
 * 🎨 Export all icons for convenience
 */
export const Icons = {
  // Navigation
  Home: HomeIcon,
  Decks: DecksIcon,
  Study: StudyIcon,
  Stats: StatsIcon,
  Settings: SettingsIcon,
  // Actions
  Add: AddIcon,
  Edit: EditIcon,
  Delete: DeleteIcon,
  Save: SaveIcon,
  Cancel: CancelIcon,
  Check: CheckIcon,
  // Content
  Image: ImageIcon,
  Tag: TagIcon,
  File: FileIcon,
  Folder: FolderIcon,
  Upload: UploadIcon,
  Download: DownloadIcon,
  // Status
  Success: SuccessIcon,
  Error: ErrorIcon,
  Warning: WarningIcon,
  Info: InfoIcon,
  // Difficulty
  Target: TargetIcon,
  Puzzle: PuzzleIcon,
  Zap: ZapIcon,
  Easy: EasyIcon,
  Medium: MediumIcon,
  Hard: HardIcon,
  TrendUp: TrendUpIcon,
  TrendDown: TrendDownIcon,
  Calendar: CalendarIcon,
  Clock: ClockIcon,
  // UI
  Search: SearchIcon,
  Filter: FilterIcon,
  Eye: EyeIcon,
  EyeOff: EyeOffIcon,
  Refresh: RefreshIcon,
  Sparkles: SparklesIcon,
  Share: ShareIcon,
  Copy: CopyIcon,
  ExternalLink: ExternalLinkIcon,
  ChevronDown: ChevronDownIcon,
  ChevronUp: ChevronUpIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  More: MoreIcon
}

export default Icons
