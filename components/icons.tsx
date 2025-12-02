import React from 'react';
import {
  Mic,
  Square,
  Wand2,
  Loader2,
  AudioWaveform,
  LayoutDashboard,
  History,
  Map,
  BookOpen,
  Settings,
  Menu,
  X,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Download,
  Save,
  Send,
  Trash2,
  Edit2,
  Star,
  Plus,
  TrendingUp,
  Trophy,
  Target,
  Flag,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  ShieldCheck,
  Cloud,
  CloudUpload,
  HelpCircle,
  Key,
  Eye,
  EyeOff,
  User,
  Image,
  Presentation,
  Briefcase,
  Code,
  BookOpenText,
  GraduationCap,
  FileText,
  ScanEye,
  Scissors,
  Activity,
  Zap,
  Timer,
  PauseCircle,
  Layout,
  BookA,
  Languages,
  Smile,
  BarChart,
  PlayCircle,
  MessageCircleQuestion,
  Mic2,
  Users,
  Newspaper,
  ChevronRight,
  LogOut,
  Projector
} from 'lucide-react';

export type IconProps = {
  className?: string;
} & React.SVGProps<SVGSVGElement>;

// --- Core Icons ---

export const MicIcon = Mic;

export const StopIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <Square className={className} fill="currentColor" {...props} />
);

export const AnalyzeIcon = Wand2;

export const LoadingIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <Loader2 className={className} {...props} />
);

export const LogoIcon: React.FC<IconProps> = ({ className = 'w-8 h-8 text-indigo-400', ...props }) => (
    <AudioWaveform className={className} {...props} />
);

// --- Navigation & UI Icons ---

export const DashboardIcon = LayoutDashboard;
export const HistoryIcon = History;
export const JourneyIcon = Map;
export const BookOpenIcon = BookOpen;
export const SettingsIcon = Settings;
export const MenuIcon = Menu;
export const CloseIcon = X;
export const XIcon = X; // Alias for X
export const LogoutIcon = LogOut;

// --- Action Icons ---

// RecordIcon agora usa explicitamente o microfone, corrigindo o ícone anterior
export const RecordIcon = Mic;

export const PlayIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <Play className={className} fill="currentColor" {...props} />
);
export { PlayIcon as Play };

export const PauseIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <Pause className={className} fill="currentColor" {...props} />
);
export { PauseIcon as Pause };

export const StopCircleIcon = StopCircle;
export const RefreshCwIcon = RefreshCw; 
export { RefreshCw };

export const DownloadIcon = Download;
export { Download };

export const SaveIcon = Save; 
export { Save };

export const SendIcon = Send; 
export { Send };

export const TrashIcon = Trash2;
export const EditIcon = Edit2;

export const StarIcon: React.FC<{ className?: string, isFilled: boolean }> = ({ className = "w-5 h-5", isFilled }) => (
    <Star className={className} fill={isFilled ? 'currentColor' : 'none'} />
);

export const PlusIcon = Plus;

// --- Analysis & Report Icons ---

export const OptimizedTextIcon = Wand2; // Varinha mágica para otimização
export const EvolutionIcon = TrendingUp;
export const TrophyIcon = Trophy;
export const TargetIcon = Target;
export { TargetIcon as Target };

export const FlagIcon = Flag;
export const CheckSquareIcon = CheckSquare;
export { CheckSquare };

export const AlertCircleIcon = AlertCircle;
export const CheckCircle2Icon = CheckCircle2; 
export { CheckCircle2 };

export const SparklesIcon = Sparkles; 
export { Sparkles };

export const BrainCircuitIcon = BrainCircuit; 
export { BrainCircuit };

export const LightbulbIcon = Lightbulb; 
export { Lightbulb };

export const ShieldCheckIcon = ShieldCheck; 
export { ShieldCheck };

export const CloudIcon = Cloud;
export const CloudUploadIcon = CloudUpload;
export const HelpIcon = HelpCircle;
export const KeyIcon = Key;
export const EyeIcon = Eye;
export const EyeOffIcon = EyeOff;
export const UserIcon = User;
export const ImageIcon = Image; 
export { Image };

export const ProjectorIcon = Presentation; 
export { Projector };

// --- Category & Specialty Icons ---

export const SalesIcon = Briefcase;
export const TechIcon = Code;
export const StorytellerIcon = BookOpenText;
export const CoachIcon = GraduationCap;
export const TextFileIcon = FileText;

// --- Metrics Icons ---

export const ClarityIcon = ScanEye; 
export const FillerWordsIcon = Scissors; 
export const RhythmIcon = Activity; 
export const StrengthIcon = Zap; 
export const TranscriptIcon = FileText;
export const WpmIcon = Timer;
export const PitchIcon = AudioWaveform;
export const PausesIcon = PauseCircle;
export const StructureIcon = Layout;
export const VocabularyIcon = BookA;
export const JargonIcon = Languages;
export const SentimentIcon = Smile;
export const BenchmarkIcon = BarChart;
export const PlaybackIcon = PlayCircle;
export const QAIcon = MessageCircleQuestion;
export const QAIconStandalone = MessageCircleQuestion;
export const VocalToneIcon = Mic2;

// --- Personas Icons ---

export const InvestorIcon = Briefcase;
export const ClientIcon = Users;
export const JournalistIcon = Newspaper;

export const ChevronRightIcon = ChevronRight;