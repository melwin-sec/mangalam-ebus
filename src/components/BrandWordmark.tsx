import { BusFront } from 'lucide-react'

function BrandWordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-sm">
        <BusFront className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="leading-none">
        <div className="text-base font-semibold tracking-[-0.03em] text-foreground sm:text-lg">
          Mangalam eBus
        </div>
        <div className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-muted sm:text-[0.62rem]">
          Digital Bus Pass &amp; Transport
        </div>
      </div>
    </div>
  )
}

export default BrandWordmark
