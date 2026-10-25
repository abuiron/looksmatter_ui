import shield from '../../assests/icon.png';

interface LogoProps {
  // "light" renders the wordmark in white with the shield on a light tile, for dark backgrounds.
  tone?: 'dark' | 'light';
  compact?: boolean;
  className?: string;
}

export default function Logo({ tone = 'dark', compact = false, className = '' }: LogoProps) {
  const light = tone === 'light';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {light ? (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream-100">
          <img src={shield} alt="" className="h-7 w-auto" />
        </span>
      ) : (
        <img src={shield} alt="" className={compact ? 'h-8 w-auto' : 'h-9 w-auto sm:h-10'} />
      )}
      <span
        className={`font-display font-semibold tracking-[0.06em] ${compact ? 'text-lg' : 'text-lg sm:text-xl'} ${
          light ? 'text-white' : 'text-stone-950'
        }`}
      >
        LOOKSMATTER
      </span>
    </span>
  );
}
