import gitPulseLogoUrl from '@/assets/branding/GitPulse_Logo.png'

export function GitPulseLogo() {
  return (
    <div className="flex items-center">
      <img
        src={gitPulseLogoUrl}
        alt="GitPulse"
        className="h-16 w-auto max-w-[380px] object-contain sm:h-20 sm:max-w-[460px]"
      />
      <span className="sr-only">Turn GitHub activity into sound.</span>
    </div>
  )
}
