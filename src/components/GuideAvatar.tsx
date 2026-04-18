import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface GuideAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  isGuide?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
  '2xl': 'h-20 w-20 lg:h-24 lg:w-24',
};

const badgeSizeMap = {
  sm: 'w-3 h-3 -bottom-0 -right-0',
  md: 'w-4 h-4 -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 -bottom-0.5 -right-0.5',
  xl: 'w-6 h-6 -bottom-0.5 -right-0.5',
  '2xl': 'w-7 h-7 -bottom-1 -right-1',
};

const iconSizeMap = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
};

/** Stylized fly hook + feather icon (gold) */
const FlyIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Hook curve */}
    <path
      d="M7 5v8a4 4 0 0 0 4 4h2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Hook eye */}
    <circle cx="7" cy="4" r="1.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Feather strands */}
    <path
      d="M13 17l3-2M13 17l3 0M13 17l2.5 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const GuideAvatar = ({
  src,
  alt,
  fallback,
  isGuide,
  size = 'md',
  showBadge = true,
  className,
}: GuideAvatarProps) => {
  const { t } = useTranslation();
  const avatar = (
    <Avatar
      className={cn(
        sizeMap[size],
        isGuide && 'ring-2 ring-[hsl(43,74%,55%)] ring-offset-2 ring-offset-background',
        className
      )}
    >
      <AvatarImage src={src || ''} alt={alt} />
      <AvatarFallback className="bg-muted text-muted-foreground">
        {(fallback || 'U')[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (!isGuide) return avatar;

  const badge = (
    <span
      className={cn(
        'absolute rounded-full bg-background flex items-center justify-center shadow-md ring-1 ring-[hsl(43,74%,55%)]',
        badgeSizeMap[size]
      )}
      style={{ color: 'hsl(43, 74%, 49%)' }}
    >
      <FlyIcon size={iconSizeMap[size]} />
    </span>
  );

  const wrapped = (
    <span className="relative inline-block shrink-0">
      {avatar}
      {showBadge && badge}
    </span>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
        <TooltipContent side="top">{t('guide.tooltip')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GuideAvatar;
