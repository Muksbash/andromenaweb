'use client'

import { useEffect, useRef, useState } from 'react'
import AndromenaIcon from '@/components/AndromenaIcon'
const Icon = AndromenaIcon as any

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MODULES = [
  { n:'01', name:'Ad Intelligence',    subs:['Live Ads','Creative Formats','Ad Frequency','Spend Signals','Targeting Regions','Platform Mix'] },
  { n:'02', name:'Influence Radar',    subs:['Creator Discovery','Sponsored Posts','Posting Frequency','Audience Overlap','Campaign Timing','Platform Breakdown'] },
  { n:'03', name:'Press & Perception', subs:['Coverage Volume','Sentiment Score','Share of Voice','Publication Reach','Arabic Coverage','Story Angle'] },
  { n:'04', name:'Search Dominance',   subs:['Keyword Rankings','Share of Search','Rising Terms','Category Gaps','Regional Shifts','Search Trend'] },
  { n:'05', name:'Digital Footprint',  subs:['Page Changes','Traffic Estimates','Backlink Growth','Keyword Moves','Tech Stack','New Launches'] },
  { n:'06', name:'Talent Signals',     subs:['Open Roles','Department Growth','Seniority Shifts','Location Expansion','Role Patterns','Hiring Velocity'] },
  { n:'07', name:'Price Watch',        subs:['Live Pricing','Price History','Discount Detection','Bundle Tracking','Regional Variance','Promo Timing'] },
  { n:'08', name:'Reputation Monitor', subs:['Sentiment Trend','Rating History','Review Volume','Crisis Signals','Platform Scores','Response Rate'] },
  { n:'09', name:'AI Analyst',         subs:['Daily Brief','Priority Signals','Module Summaries','Trend Detection','Action Recommendations','Weekly Digest'] },
  { n:'10', name:'Intelligence Reports',subs:['PDF Export','Visual Charts','AI Narrative','Scheduled Delivery','Board Format','Custom Branding'] },
]

const HERO_TEXT = "Andromena is a live AI dashboard that watches your competitors 24/7 — their ads, prices, hires, press, and more. Not summaries. Not reports. Raw intelligence, updated continuously, so you always know what they're doing before anyone else does."

// ─────────────────────────────────────────────
// MATH HELPERS
// ─────────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
const range = (p: number, s: number, e: number) => clamp((p - s) / (e - s))
const eio   = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const re    = (p: number, s: number, e: number) => eio(range(p,s,e))

// ─────────────────────────────────────────────
// VIRTUAL SCROLL ENGINE
// ─────────────────────────────────────────────
function useVirtualScroll() {
  const target   = useRef(0)
  const current  = useRef(0)
  const heroRef    = useRef(0)
  const modRef     = useRef(0)
  const pricingRef = useRef(0)

  useEffect(() => {
    const TOTAL   = 3.8
    const WSCALE  = 0.00022
    const TSCALE  = 0.00032

    const prevent = (e: Event) => e.preventDefault()
    window.addEventListener('wheel',    prevent, { passive: false })
    window.addEventListener('touchmove',prevent, { passive: false })
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    let ty = 0, tyActive = false
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; tyActive = true }
    const onTouchMove  = (e: TouchEvent) => {
      if (!tyActive) return
      const dy = ty - e.touches[0].clientY
      ty = e.touches[0].clientY
      target.current = clamp(target.current + dy * TSCALE, 0, TOTAL)
    }
    const onTouchEnd = () => { tyActive = false }
    const onKey = (e: KeyboardEvent) => {
      const s = 0.08
      if (e.key === 'ArrowDown' || e.key === 'PageDown') target.current = clamp(target.current + s, 0, TOTAL)
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   target.current = clamp(target.current - s, 0, TOTAL)
      if (e.key === 'Home') target.current = 0
      if (e.key === 'End')  target.current = TOTAL
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd)
    window.addEventListener('keydown',    onKey)

    // Single panel scroll accumulator
    let panelPos    = 0
    let panelTarget = 0
    let tyLerp      = 100  // starts fully off-screen bottom

    // Panel is visually at top when translateY = 0
    // Track this directly instead of relying on lerped pricingRef
    let panelAtTop = false

    // Single wheel handler that does everything — no swapping
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (panelAtTop) {
        const panel = document.getElementById('pricing-panel')
        const scrollH = panel ? panel.scrollHeight : 0
        const clientH = panel ? panel.clientHeight : 0
        const max = scrollH > clientH ? scrollH - clientH : 5000
        if (e.deltaY < 0 && panelTarget <= 0) {
          panelAtTop = false
          target.current = clamp(target.current + e.deltaY * WSCALE * 8, 0, TOTAL)
        } else {
          panelTarget = clamp(panelTarget + e.deltaY * 1.8, 0, max)
        }
      } else {
        target.current = clamp(target.current + e.deltaY * WSCALE, 0, TOTAL)
        if (e.deltaY < 0) { panelPos = 0; panelTarget = 0 }
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })

    let raf: number
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50) / (1000 / 60)
      last = now

      // Adaptive lerp — cinematic for hero/modules, fast for panel slide so no hang
      const LERP = target.current > 2.1 ? 0.08 : 0.022
      current.current += (target.current - current.current) * (1 - Math.pow(1 - LERP, dt))
      const raw = clamp(current.current, 0, TOTAL)

      heroRef.current    = clamp(raw, 0, 1)
      modRef.current     = clamp((raw - 0.85) / 1.35, 0, 1)
      pricingRef.current = clamp((raw - 2.2) / 0.5, 0, 1)

      // Panel slide animation — lerped so it rises smoothly like a camera move
      const panelEl = document.getElementById('pricing-panel')
      if (panelEl) {
        const tyTarget = (1 - eio(clamp(pricingRef.current / 0.25))) * 100
        tyLerp += (tyTarget - tyLerp) * 0.06  // smooth chase — same feel as globe zoom
        if (tyLerp <= 0.05) {
          panelEl.style.transform = 'translateY(0)'
          panelEl.style.visibility = 'visible'
          if (!panelAtTop) panelAtTop = true
        } else {
          panelEl.style.transform = `translateY(${tyLerp}vh)`
          panelEl.style.visibility = pricingRef.current > 0.005 ? 'visible' : 'hidden'
          panelAtTop = false
        }
      }

      // Panel content scroll — only when visually at top
      if (panelAtTop && panelEl) {
        panelPos += (panelTarget - panelPos) * (1 - Math.pow(1 - 0.09, dt))
        panelEl.scrollTop = panelPos
      } else if (!panelAtTop && panelEl && pricingRef.current < 0.1) {
        panelPos = 0; panelTarget = 0
        panelEl.scrollTop = 0
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel',      prevent)
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchmove',  prevent)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('keydown',    onKey)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  return { heroRef, modRef, pricingRef }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Home() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)
  const { heroRef, modRef, pricingRef } = useVirtualScroll()

  useEffect(() => { setTimeout(() => setHeroVisible(true), 120) }, [])

  // ── CSS-VAR DRIVER
  useEffect(() => {
    let raf: number
    let lastMod = -1
    // Smoothed float value — separate lerp to prevent shakiness
    let floatLerp = 145 // frac starts at 0 → floatTarget = (0-0.5)*-290 = +145 (below center)

    const tick = () => {
      const p  = heroRef.current
      const mp = modRef.current
      const r  = document.documentElement

      r.style.setProperty('--hero-op',    String(clamp(1 - re(p, 0.06, 0.18))))
      r.style.setProperty('--s1-op',      String(re(p,0.17,0.28) * (1 - re(p,0.38,0.48))))
      r.style.setProperty('--s2-op',      String(re(p,0.44,0.50) * (1 - re(p,0.74,0.84))))
      r.style.setProperty('--card-slide', String(re(p,0.58,0.72)))

      const featP = clamp((mp - 0.06) / 0.82)
      const rawM  = featP * 10
      const idx   = Math.min(9, Math.floor(rawM))
      const frac  = rawM - Math.floor(rawM)

      let fOp = (mp > 0.06 && mp < 0.90) ? Math.sin(clamp(frac) * Math.PI) : 0
      if (mp < 0.11) fOp *= range(mp, 0.06, 0.11)
      if (mp > 0.86) fOp *= 1 - range(mp, 0.86, 0.91)

      // Float: continuous upward motion — frac 0→1 maps bottom→top within each module
      // frac=0: entering from bottom (+145px), frac=0.5: center, frac=1: exiting top (-145px)
      // No lerp needed — virtual scroll lerp already makes this smooth
      const floatOffset = (0.5 - frac) * 290  // bottom(+145) → center(0) → top(-145)
      floatLerp = floatOffset

      r.style.setProperty('--mod-op',    String(fOp))
      r.style.setProperty('--mod-float', `${floatLerp}px`)
      r.style.setProperty('--cta-op',    String(clamp((mp - 0.94) / 0.06)))

      const pr = pricingRef.current
      const burstOut = eio(clamp(pr * 8))
      r.style.setProperty('--cta-burst-op',    String(1 - burstOut))
      r.style.setProperty('--cta-burst-scale', String(1 + burstOut * 0.18))

      // Module display — drive directly via DOM, zero React re-renders
      const numEl  = document.getElementById('mod-num')
      const nameEl = document.getElementById('mod-name')
      const subsEl = document.getElementById('mod-subs')
      const modEl  = document.getElementById('mod-display')
      const labelEl= document.getElementById('mod-dots-label')
      if (idx !== lastMod && numEl && nameEl && subsEl && modEl) {
        lastMod = idx
        const m = MODULES[idx]
        numEl.textContent  = m.n
        nameEl.textContent = m.name
        subsEl.innerHTML   = m.subs.map(s=>`<div style="display:flex;align-items:center;gap:10px"><span style="font-family:'Dothed',monospace;font-size:11px;color:rgba(255,255,255,0.65)">/</span><span style="font-family:var(--font-body);font-size:clamp(12px,1vw,14px);color:rgba(255,255,255,0.70);letter-spacing:0.03em">${s}</span></div>`).join('')
        if (labelEl) labelEl.textContent = `${m.n} / 10`
        // Side alternates — set instantly (opacity is 0 during switch)
        modEl.style.left  = idx%2===0 ? '6%' : 'auto'
        modEl.style.right = idx%2===1 ? '6%' : 'auto'
        // Update dots
        for (let i=0;i<10;i++) {
          const dot = document.getElementById(`mod-dot-${i}`)
          if (dot) {
            dot.style.width = i===idx ? '22px' : '4px'
            dot.style.background = i===idx ? 'rgba(255,255,255,0.85)' : i<idx ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.15)'
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [heroRef, modRef, pricingRef])

  // ── CANVAS
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    let W = 0, H = 0, cx = 0, cy = 0, R = 0
    let gps: any[] = [], stars: any[] = []
    let angle = 0
    let scaleLerp = 0  // smoothed globe scale — prevents jumpy zoom

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      cx = W*0.75; cy = H*0.52
      R = Math.min(W,H)*0.32
      buildGlobe(); buildStars()
    }

    const buildGlobe = () => {
      gps = []
      for (let i = 0; i < 26000; i++) {
        const phi = Math.acos(1-2*(i+0.5)/26000)
        const theta = Math.PI*(1+Math.sqrt(5))*i
        const rN = 0.5+Math.pow(Math.random(),0.3)*0.55
        const r = R*rN
        const x = r*Math.sin(phi)*Math.cos(theta)+(Math.random()-0.5)*R*0.04
        const y = r*Math.sin(phi)*Math.sin(theta)+(Math.random()-0.5)*R*0.04
        const z = r*Math.cos(phi)
        const sr = Math.random()
        const size = sr<0.60?0.10+Math.random()*0.20:sr<0.82?0.30+Math.random()*0.25:sr<0.94?0.50+Math.random()*0.30:0.85+Math.random()*0.40
        const zF = (z/R+1)*0.5
        gps.push({x,y,z,size,bright:0.06+rN*0.52+Math.random()*0.26,isGlow:sr>0.989,
          sx:W*0.5+(Math.random()-0.5)*W*(1.5+zF*0.8),sy:H*0.5+(Math.random()-0.5)*H*(1.3+zF*0.6)})
      }
    }

    const buildStars = () => {
      stars = []
      for (let i=0;i<1800;i++) stars.push({x:(Math.random()-0.5)*W*5,y:(Math.random()-0.5)*H*5,z:80+Math.random()*1600,size:0.2+Math.random()*0.5,bright:0.25+Math.random()*0.55})
      for (let i=0;i<400;i++)  stars.push({x:(Math.random()-0.5)*W*4,y:(Math.random()-0.5)*H*4,z:60+Math.random()*900,size:0.5+Math.random()*0.8,bright:0.4+Math.random()*0.5})
      for (let i=0;i<120;i++)  stars.push({x:(Math.random()-0.5)*W*3,y:(Math.random()-0.5)*H*3,z:40+Math.random()*400,size:0.8+Math.random()*1.2,bright:0.6+Math.random()*0.4})
    }

    const drawGlobe = (gcx:number,gcy:number,scale:number,alpha:number) => {
      const cA=Math.cos(angle),sA=Math.sin(angle),cT=Math.cos(0.15),sT=Math.sin(0.15)
      const proj=gps.map(gp=>{
        const rx=gp.x*cA-gp.z*sA,rz=gp.x*sA+gp.z*cA
        const fy=gp.y*cT-rz*sT,fz=gp.y*sT+rz*cT
        const zN=(fz+R)/(2*R)
        return{x:gcx+rx*scale,y:gcy+fy*scale,z:fz,a:Math.max(0,gp.bright*(0.28+zN*0.72)*alpha),size:gp.size*(0.5+zN*0.5),isGlow:gp.isGlow}
      })
      proj.sort((a,b)=>a.z-b.z)
      proj.forEach(p=>{
        if(p.a<0.008) return
        if(p.isGlow&&alpha>0.5){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*4);g.addColorStop(0,`rgba(255,255,255,${p.a*0.3})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*4,0,Math.PI*2);ctx.fill()}
        ctx.globalAlpha=p.a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(0.1,p.size),0,Math.PI*2);ctx.fill()
      })
      ctx.globalAlpha=1
    }

    const draw = () => {
      ctx.clearRect(0,0,W,H)
      angle+=0.003
      const p=heroRef.current,mp=modRef.current
      const burstP=eio(range(p,0.04,0.35)),spaceP=range(p,0.06,0.40)
      const rushP=eio(range(p,0.78,0.94)),starP=range(p,0.25,0.80),globeP=eio(range(p,0.80,1.00))

      if(spaceP>0){
        const speed=0.35+rushP*14
        stars.forEach(s=>{
          s.z-=speed
          if(s.z<=1){s.x=(Math.random()-0.5)*W*4;s.y=(Math.random()-0.5)*H*4;s.z=1800+Math.random()*400}
          const sc=500/s.z,px=W/2+s.x*sc,py=H/2+s.y*sc
          if(px<-60||px>W+60||py<-60||py>H+60) return
          const a=s.bright*spaceP*(1-globeP*0.85)*Math.min(1,sc*8)
          const radius=Math.min(1.8,Math.max(0.15,s.size*sc*0.9))
          const finalA=a*clamp(s.z/60)
          if(finalA<0.02) return
          if(rushP>0.2&&speed>3){const ps=500/(s.z+speed*4);ctx.globalAlpha=finalA*0.25;ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(0.3,Math.min(1.2,s.size*sc*0.6));ctx.beginPath();ctx.moveTo(W/2+s.x*ps,H/2+s.y*ps);ctx.lineTo(px,py);ctx.stroke()}
          ctx.globalAlpha=finalA;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill()
        })
        ctx.globalAlpha=1
      }

      if(burstP<1){
        const cA=Math.cos(angle),sA=Math.sin(angle),cT=Math.cos(0.15),sT=Math.sin(0.15)
        const proj=gps.map(gp=>{
          const rx=gp.x*cA-gp.z*sA,rz=gp.x*sA+gp.z*cA
          const fy=gp.y*cT-rz*sT,fz=gp.y*sT+rz*cT
          const zN=(fz+R)/(2*R)
          const gx=cx+rx,gy=cy+fy
          let a=gp.bright*(0.28+zN*0.72)
          if(burstP>0.65) a*=(1-(burstP-0.65)/0.35)
          return{x:gx+(gp.sx-gx)*burstP,y:gy+(gp.sy-gy)*burstP,z:fz,a:Math.max(0,a),size:gp.size*(0.5+zN*0.5),isGlow:gp.isGlow}
        })
        if(burstP<0.4) proj.sort((a,b)=>a.z-b.z)
        proj.forEach(gp=>{
          if(gp.a<0.008) return
          if(gp.isGlow&&burstP<0.5){const g=ctx.createRadialGradient(gp.x,gp.y,0,gp.x,gp.y,gp.size*4);g.addColorStop(0,`rgba(255,255,255,${gp.a*0.3})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(gp.x,gp.y,gp.size*4,0,Math.PI*2);ctx.fill()}
          ctx.globalAlpha=gp.a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(gp.x,gp.y,Math.max(0.1,gp.size),0,Math.PI*2);ctx.fill()
        })
        ctx.globalAlpha=1
      }

      if(starP>0&&globeP<1){
        const eased=eio(starP),size=0.35+eased*3.2,glow=6+eased*36
        const a=Math.min(0.9,0.12+eased*0.78)*(1-globeP)
        const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,glow)
        g.addColorStop(0,`rgba(255,255,255,${a*0.55})`);g.addColorStop(1,'rgba(255,255,255,0)')
        ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(W/2,H/2,glow,0,Math.PI*2);ctx.fill()
        ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(W/2,H/2,size,0,Math.PI*2);ctx.fill()
        ctx.globalAlpha=1
      }

      if(globeP>0){
        const minD=Math.min(W,H)
        const expE=eio(clamp((mp-0.85)/0.10))
        const scaleTarget=(minD*0.22/R+(minD*0.44/R-minD*0.22/R)*expE)*globeP
        // Smooth lerp — camera-like zoom, never jumps on fast scroll
        scaleLerp += (scaleTarget - scaleLerp) * 0.04
        ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip()
        drawGlobe(W/2,H/2,scaleLerp,globeP)
        ctx.restore()
      }

      ctx.globalAlpha=1
      animId=requestAnimationFrame(draw)
    }
    resize();draw()
    window.addEventListener('resize',resize)
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize)}
  },[heroRef,modRef])

  const cards = [
    {n:'01',title:'Live competitor feed',      desc:'Every ad, price change, job post, press mention and campaign — captured the moment it happens. Not daily. Not weekly. Now.'},
    {n:'02',title:'AI reads it for you',       desc:'Our AI monitors 10 intelligence streams simultaneously and surfaces what actually matters. No noise, no manual digging.'},
    {n:'03',title:'Your dashboard, always on', desc:'Log in any time and see exactly where each competitor stands across every signal. Your command center, live 24/7.'},
    {n:'04',title:'Move before they do',       desc:"When you know their next move before they announce it, you stop reacting. You start leading."},
  ]

  return (
    <div style={{position:'fixed',inset:0,background:'#080808',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>

      {/* Nav */}
      <nav className="site-nav" style={{position:'absolute',top:0,left:0,right:0,zIndex:100,padding:'28px 44px 0',display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:5}} className="nav-links">
          {['Features','How It Works','Intelligence'].map(l=>(
            <a key={l} href="#" style={{fontSize:14,color:'rgba(255,255,255,0.8)',letterSpacing:'0.02em',cursor:'pointer',textDecoration:'none',fontFamily:'var(--font-body)',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.target as HTMLElement).style.color='#fff'}
              onMouseLeave={e=>(e.target as HTMLElement).style.color='rgba(255,255,255,0.8)'}
            >{l}</a>
          ))}
        </div>
        <div style={{fontFamily:"'Grift',sans-serif",fontSize:20,fontWeight:700,letterSpacing:'0.14em',color:'rgba(255,255,255,0.82)',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
          <Icon size={42} />
          ANDROMENA
        </div>
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button style={{position:'relative',background:'transparent',border:'none',color:'rgba(255,255,255,0.75)',padding:'10px 20px',fontSize:11,fontFamily:'var(--font-body)',fontWeight:500,letterSpacing:'0.06em',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:10}}>
            {([{t:0,l:0,bt:'borderTop',bl:'borderLeft'},{t:0,r:0,bt:'borderTop',bl:'borderRight'},{b:0,l:0,bt:'borderBottom',bl:'borderLeft'},{b:0,r:0,bt:'borderBottom',bl:'borderRight'}] as any[]).map((pos,i)=>(
              <span key={i} style={{position:'absolute',...(pos.t!==undefined?{top:0}:{}),...(pos.b!==undefined?{bottom:0}:{}),...(pos.l!==undefined?{left:0}:{}),...(pos.r!==undefined?{right:0}:{}),width:10,height:10,[pos.bt]:'1px solid rgba(255,255,255,0.65)',[pos.bl]:'1px solid rgba(255,255,255,0.65)'}}/>
            ))}
            Request Access
            <span style={{width:18,height:18,border:'1px solid rgba(255,255,255,0.3)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,borderRadius:2}}>↗</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{position:'absolute',inset:0,zIndex:2,display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',padding:'80px 48px 0',opacity:'var(--hero-op)' as any}} className="hero-section">
        <div style={{paddingRight:40,opacity:heroVisible?1:0,transform:heroVisible?'translateY(0)':'translateY(28px)',transition:'opacity 1.4s cubic-bezier(0.16,1,0.3,1),transform 1.4s cubic-bezier(0.16,1,0.3,1)'}}>
          <h1 style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(28px,3.8vw,52px)',fontWeight:700,lineHeight:1.08,letterSpacing:'-0.035em',color:'rgba(255,255,255,0.82)',marginBottom:4,whiteSpace:'nowrap'}} className="hero-h1">Your competitors are live.</h1>
          <div style={{fontFamily:"'Dothed',monospace",fontSize:'clamp(26px,3.4vw,50px)',color:'rgba(255,255,255,0.78)',letterSpacing:'0.04em',marginBottom:24,lineHeight:1.1}} className="hero-sub">So is your intelligence.</div>
          <p style={{fontSize:'clamp(12px,1.2vw,15px)',color:'rgba(255,255,255,0.55)',lineHeight:1.8,maxWidth:420,marginBottom:36,fontFamily:'var(--font-body)'}}>A live AI dashboard tracking your competitors 24/7 — ads, pricing, hiring, press, search and more. Not a report. A radar that never turns off.</p>
          <div style={{display:'flex',gap:10,alignItems:'center'}} className="hero-btns">
            <button style={{background:'rgba(255,255,255,0.78)',color:'#080808',border:'none',padding:'11px 22px',fontSize:10,fontFamily:'var(--font-body)',fontWeight:600,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase',display:'inline-flex',alignItems:'center',gap:8}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'#080808',opacity:0.4}}/>Request Access
            </button>
            <button style={{background:'transparent',border:'1px solid rgba(255,255,255,0.18)',color:'rgba(255,255,255,0.82)',padding:'11px 22px',fontSize:10,fontFamily:'var(--font-body)',fontWeight:500,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase'}}>See How It Works <span style={{opacity:0.4}}>→</span></button>
          </div>
        </div>
        <div style={{position:'absolute',bottom:24,left:48,right:48,display:'flex',justifyContent:'space-between',alignItems:'center'}} className="hero-bottom">
          <span style={{fontSize:10,color:'rgba(255,255,255,0.50)',letterSpacing:'0.14em',fontFamily:'var(--font-body)'}}>LIVE AI INTELLIGENCE · GCC</span>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{width:4,height:4,borderRadius:'50%',background:'#fff',opacity:0.25,animation:'blink 2.8s ease-in-out infinite',display:'inline-block'}}/>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.50)',letterSpacing:'0.14em',fontFamily:'var(--font-body)'}}>LIVE · 24/7</span>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div style={{position:'absolute',inset:0,zIndex:3,display:'flex',alignItems:'center',padding:'120px 64px 80px',pointerEvents:'none',opacity:'var(--s1-op)' as any}} className="s1-section">
        <div style={{display:'flex',flexDirection:'column',gap:48}}>
          <h2 style={{margin:0,fontWeight:'normal',lineHeight:1.06}}>
            <span style={{display:'block',marginBottom:6,fontFamily:"'Grift',sans-serif",fontSize:'clamp(28px,3.8vw,52px)',fontWeight:700,letterSpacing:'-0.035em',color:'rgba(255,255,255,0.82)'}}>Your competitors move in real time.</span>
            <span style={{display:'block',fontFamily:"'Dothed',monospace",fontSize:'clamp(26px,3.4vw,50px)',letterSpacing:'0.04em',color:'rgba(255,255,255,0.78)'}}>Now you see every move.</span>
          </h2>
          <div style={{maxWidth:520}}>
            {["Most businesses find out what competitors did last week. Andromena shows you what they're doing right now.",
              "Prices changed at 2am. A new campaign launched. They just posted 6 jobs in your market.",
              "You know before the market does. That's not a report — that's an advantage."
            ].map((t,i)=>(
              <p key={i} style={{fontSize:'clamp(14px,1.4vw,16px)',color:'rgba(255,255,255,0.50)',lineHeight:1.85,marginBottom:i<2?18:0,fontFamily:'var(--font-body)'}}>{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div style={{position:'absolute',inset:0,zIndex:4,pointerEvents:'none',display:'flex',flexDirection:'column',justifyContent:'center',overflow:'hidden',opacity:'var(--s2-op)' as any}}>
        <p style={{fontSize:'clamp(22px,2.8vw,42px)',fontWeight:500,lineHeight:1.55,letterSpacing:'-0.02em',padding:'0 64px',margin:'0 0 48px 0',width:'100%',boxSizing:'border-box' as any,wordBreak:'break-word' as any,overflowWrap:'break-word' as any}} className="letter-reveal-p">
          <LetterReveal text={HERO_TEXT} heroRef={heroRef}/>
        </p>
        <div style={{flexShrink:0,width:'100%'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,width:'100%'}} className="cards-grid">
            {cards.map((card,i)=><CardItem key={i} card={card} index={i}/>)}
          </div>
        </div>
      </div>

      {/* Modules */}
      <ModuleDisplay/>
      <ModuleDots/>

      {/* CTA */}
      <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        opacity:'calc(var(--cta-op, 0) * var(--cta-burst-op, 1))' as any,
        transform:'scale(var(--cta-burst-scale, 1))' as any,transformOrigin:'center center'}}>
        <div style={{fontFamily:"'Dothed',monospace",fontSize:11,color:'rgba(255,255,255,0.50)',letterSpacing:'0.2em',marginBottom:20}}>// ANDROMENA · LIVE INTELLIGENCE</div>
        <h2 style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(28px,4vw,54px)',fontWeight:700,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.82)',lineHeight:1.0,textAlign:'center',marginBottom:16,maxWidth:640}}>Ten live signals.<br/>One AI. Always on.</h2>
        <p style={{fontFamily:'var(--font-body)',fontSize:'clamp(13px,1.1vw,15px)',color:'rgba(255,255,255,0.55)',textAlign:'center',maxWidth:440,lineHeight:1.8,marginBottom:44}}>Know what your competitors are doing right now — not tomorrow, not Friday. Now.</p>
        <button style={{background:'rgba(255,255,255,0.78)',color:'#080808',border:'none',padding:'13px 28px',fontSize:10,fontFamily:'var(--font-body)',fontWeight:600,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase',display:'inline-flex',alignItems:'center',gap:10,pointerEvents:'auto'}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#080808',opacity:0.4}}/>Request Access
        </button>
      </div>

      <PricingPanel pricingRef={pricingRef}/>

      <style>{`
        @keyframes blink{0%,100%{opacity:0.1}50%{opacity:0.5}}
        *{box-sizing:border-box}
        #pricing-panel::-webkit-scrollbar{display:none}
        :root{--hero-op:1;--s1-op:0;--s2-op:0;--card-slide:0;--mod-op:0;--mod-float:0px;--cta-op:0;--cta-burst-op:1;--cta-burst-scale:1}

        @media(max-width:768px){
          .site-nav{padding:18px 20px 0!important;grid-template-columns:auto 1fr!important}
          .nav-links{display:none!important}
          .nav-cta{font-size:9px!important;padding:8px 14px!important}
          .hero-section{grid-template-columns:1fr!important;padding:90px 24px 0!important;align-items:flex-start!important}
          .hero-h1{white-space:normal!important;font-size:clamp(28px,8vw,40px)!important}
          .hero-sub{font-size:clamp(20px,6vw,32px)!important}
          .hero-btns{flex-direction:column!important;align-items:flex-start!important}
          .hero-bottom{left:24px!important;right:24px!important}
          .s1-section{padding:80px 24px 40px!important}
          .letter-reveal-p{padding:0 24px!important;font-size:clamp(16px,4.5vw,26px)!important;margin-bottom:32px!important}
          .cards-grid{grid-template-columns:repeat(2,1fr)!important}
          #mod-display{left:10%!important;right:auto!important;width:80%!important}
          .pricing-grid{grid-template-columns:1fr!important;padding:0!important}
          .pricing-left{position:relative!important;height:auto!important;padding:80px 24px 40px!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.06)!important}
          .pricing-right{padding:40px 24px 80px!important}
          .plan-bullets{grid-template-columns:1fr!important}
          .footer-grid{grid-template-columns:1fr!important;gap:40px!important;margin-bottom:60px!important}
          .footer-bottom{flex-direction:column!important;gap:12px!important;align-items:center!important}
        }
      `}</style>
    </div>
  )
}

// ── LETTER REVEAL
function LetterReveal({text,heroRef}:{text:string;heroRef:React.MutableRefObject<number>}) {
  const letters=text.split(''),total=letters.length
  const spanRefs=useRef<(HTMLSpanElement|null)[]>([])
  useEffect(()=>{
    let raf:number
    const tick=()=>{
      const p=heroRef.current,head=range(p,0.44,0.72)*total
      spanRefs.current.forEach((span,i)=>{
        if(!span) return
        const dist=head-i
        let b=dist<0?0.07:dist<1?1.0:dist<5?0.78+0.22*Math.pow(1-(dist-1)/4,3):0.78
        span.style.color=`rgba(255,255,255,${b})`
      })
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf)
  },[total,heroRef])
  return <>{letters.map((ch,i)=><span key={i} ref={el=>{spanRefs.current[i]=el}} style={{fontFamily:"'Grift',sans-serif",fontWeight:500,color:'rgba(255,255,255,0.07)',display:'inline'}}>{ch}</span>)}</>
}

// ── CARD ITEM
function CardItem({card,index}:{card:{n:string,title:string,desc:string};index:number}) {
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    let raf:number
    const tick=()=>{
      const raw=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-slide')||'0')
      const delay=index*0.12,sl=clamp((raw-delay)/(1-delay)),e=eio(sl)
      if(ref.current){ref.current.style.transform=`translateX(${(1-e)*120}px)`;ref.current.style.opacity=String(e)}
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf)
  },[index])
  return (
    <div ref={ref} style={{opacity:0,background:'rgba(8,8,8,0.88)',backdropFilter:'blur(10px)',borderTop:'1px solid rgba(255,255,255,0.10)',borderRight:'1px solid rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.10)',borderLeft:index===0?'1px solid rgba(255,255,255,0.06)':'none',padding:'24px 28px 28px',minHeight:180}}>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.52)',letterSpacing:'0.12em',marginBottom:16,fontFamily:'var(--font-body)'}}>{card.n}</div>
      <div style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(16px,1.6vw,22px)',fontWeight:600,letterSpacing:'-0.02em',color:'rgba(255,255,255,0.82)',marginBottom:16,lineHeight:1.2}}>{card.title}</div>
      <p style={{fontSize:'clamp(12px,1.1vw,14px)',color:'rgba(255,255,255,0.60)',lineHeight:1.75,fontFamily:'var(--font-body)',margin:0}}>{card.desc}</p>
    </div>
  )
}

// ── MODULE DISPLAY
function ModuleDisplay() {
  const m = MODULES[0]
  return (
    <div id="mod-display" style={{position:'absolute',top:'50vh',zIndex:3,pointerEvents:'none',
      left:'6%',right:'auto',width:'30%',
      transform:'translateY(calc(-50% + var(--mod-float)))',
      opacity:'var(--mod-op)' as any}}>
      <div id="mod-num" style={{fontFamily:"'Dothed',monospace",fontSize:'clamp(56px,7vw,100px)',color:'rgba(255,255,255,0.55)',lineHeight:1,marginBottom:-4,letterSpacing:'0.04em',userSelect:'none'}}>{m.n}</div>
      <div id="mod-name" style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(28px,3.5vw,50px)',fontWeight:700,color:'rgba(255,255,255,0.82)',letterSpacing:'-0.035em',lineHeight:1.0,marginBottom:18}}>{m.name}</div>
      <div style={{width:28,height:1,background:'rgba(255,255,255,0.58)',marginBottom:18}}/>
      <div id="mod-subs" style={{display:'flex',flexDirection:'column',gap:8}}>
        {m.subs.map((sub,j)=>(
          <div key={j} style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:"'Dothed',monospace",fontSize:11,color:'rgba(255,255,255,0.65)'}}>/</span>
            <span style={{fontFamily:'var(--font-body)',fontSize:'clamp(12px,1vw,14px)',color:'rgba(255,255,255,0.70)',letterSpacing:'0.03em'}}>{sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModuleDots() {
  return (
    <div id="mod-dots-wrap" style={{position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',zIndex:4,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:10,opacity:'var(--mod-op)' as any}}>
      <div id="mod-dots-label" style={{fontFamily:"'Dothed',monospace",fontSize:11,color:'rgba(255,255,255,0.55)',letterSpacing:'0.16em'}}>{MODULES[0].n} / 10</div>
      <div style={{display:'flex',gap:5}}>
        {MODULES.map((_,i)=>(
          <div key={i} id={`mod-dot-${i}`} style={{height:2,width:i===0?22:4,background:i===0?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.15)',borderRadius:1,transition:'width 0.5s cubic-bezier(0.16,1,0.3,1)'}}/>
        ))}
      </div>
    </div>
  )
}

// ── PLANS & FAQS DATA
const PLANS = [
  {tag:'RADAR',sub:'3 competitors',tagline:'Your first unfair advantage.',featured:false,bullets:['3 competitors fully loaded into your AI','Ask anything, get answers instantly','All 10 live intelligence modules','Live dashboard, always current','Daily AI-generated highlights','GCC market coverage']},
  {tag:'SIGNAL',sub:'5 competitors',tagline:'For teams that move on data.',featured:true,bullets:["Everything in Radar","5 competitors in your AI's memory","Cross-competitor comparisons on demand",'"Who raised prices this week?" — just ask','Alert system for sudden moves','Weekly deep-dive digest','Priority analysis queue']},
  {tag:'COMMAND',sub:'Custom scale',tagline:'Your market, fully mapped.',featured:false,bullets:['Unlimited competitors loaded','AI trained on your entire market','Custom modules for your industry','Dedicated setup & onboarding','White-label dashboard option','Direct access to our team','API access included']},
  {tag:'API',sub:'For data teams',tagline:'Plug our intelligence into yours.',featured:false,bullets:['Direct access to all raw data feeds','All 10 modules via live endpoints','Real-time webhooks on any signal','JSON / CSV / streaming output','Build your own AI on top of ours','Full GCC + regional data coverage']},
]
const FAQS = [
  {q:'How quickly does the AI learn my competitors?',a:'Within 24 hours of setup. We ingest their full digital footprint across all 10 modules and your AI is ready to answer questions the same day.'},
  {q:'Is this real-time or does it update periodically?',a:'Real-time. The dashboard updates continuously — not daily, not hourly. The moment a competitor moves, you see it.'},
  {q:'What markets does Andromena cover?',a:'Built for the GCC — UAE, Saudi Arabia, Kuwait, Qatar, Bahrain and Oman. Arabic and English content both monitored.'},
  {q:'Can I talk to the AI in Arabic?',a:'Yes. Ask in Arabic, get answers in Arabic. The AI understands both languages natively.'},
  {q:'What counts as a competitor?',a:'Any brand, company or product you want to track. You tell us who, we load them in.'},
  {q:'Can I upgrade or change my plan?',a:'Yes, anytime. No contracts, no lock-in. Scale up when you need more, adjust anytime.'},
  {q:'Is my data private?',a:'Completely. Your competitor list, your conversations with the AI, your dashboard — none of it is shared or visible to anyone else.'},
]

// ── PRICING PANEL
function PricingPanel({pricingRef}:{pricingRef:React.MutableRefObject<number>}) {
  const panelRef=useRef<HTMLDivElement>(null)
  const [openFaq,setOpenFaq]=useState<number|null>(null)

  return (
    <div id="pricing-panel" ref={panelRef} style={{position:'fixed',top:0,left:0,right:0,bottom:0,width:'100vw',height:'100vh',zIndex:20,background:'#080808',overflowY:'scroll',transform:'translateY(100vh)',visibility:'hidden',willChange:'transform',outline:'none',scrollbarWidth:'none'} as any}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',alignItems:'start',padding:'0 0 0 64px'}} className="pricing-grid">

        {/* LEFT sticky */}
        <div style={{position:'sticky',top:0,height:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',paddingRight:80}} className="pricing-left">
          <div style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.65)',letterSpacing:'0.2em',marginBottom:32}}>// PLANS</div>
          <h2 style={{margin:'0 0 28px 0',lineHeight:1.05}}>
            <span style={{display:'block',fontFamily:"'Grift',sans-serif",fontSize:'clamp(32px,3.8vw,56px)',fontWeight:700,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.75)'}}>Not a dashboard</span>
            <span style={{display:'block',fontFamily:"'Dothed',monospace",fontSize:'clamp(24px,2.8vw,42px)',fontWeight:400,letterSpacing:'0.06em',color:'rgba(255,255,255,0.38)'}}>you read.</span>
            <span style={{display:'block',fontFamily:"'Grift',sans-serif",fontSize:'clamp(32px,3.8vw,56px)',fontWeight:700,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.75)'}}>An AI you</span>
            <span style={{display:'block',fontFamily:"'Dothed',monospace",fontSize:'clamp(24px,2.8vw,42px)',fontWeight:400,letterSpacing:'0.06em',color:'rgba(255,255,255,0.38)'}}>talk to.</span>
          </h2>
          <div style={{width:28,height:1,background:'rgba(255,255,255,0.30)',marginBottom:24}}/>
          <p style={{fontFamily:'var(--font-body)',fontSize:14,color:'rgba(255,255,255,0.70)',lineHeight:1.85,maxWidth:300,marginBottom:44}}>Every plan includes a private AI trained on your competitors' live data. Ask it anything — in English or Arabic. It already knows.</p>
          <button style={{background:'rgba(255,255,255,0.78)',color:'#080808',border:'none',padding:'12px 24px',fontSize:10,fontFamily:'var(--font-body)',fontWeight:600,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase',display:'inline-flex',alignItems:'center',gap:10,alignSelf:'flex-start'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#080808',opacity:0.4}}/>Request Access ↗
          </button>
        </div>

        {/* RIGHT scrollable */}
        <div style={{padding:'120px 64px 120px 64px'}} className="pricing-right">
          <div style={{display:'flex',flexDirection:'column',gap:1,marginBottom:100}}>
            {PLANS.map((plan,i)=>(
              <div key={i} style={{borderTop:i===0?'1px solid rgba(255,255,255,0.12)':'none',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'40px 0',position:'relative'}}>
                <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:14}}>
                    <span style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(28px,3vw,44px)',fontWeight:700,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.82)'}}>{plan.tag}</span>
                    <span style={{fontFamily:"'Dothed',monospace",fontSize:11,color:'rgba(255,255,255,0.75)',letterSpacing:'0.12em'}}>{plan.sub}</span>
                  </div>
                  {plan.featured&&<span style={{fontFamily:"'Dothed',monospace",fontSize:9,color:'rgba(255,255,255,0.78)',letterSpacing:'0.16em',border:'1px solid rgba(255,255,255,0.42)',padding:'4px 10px'}}>MOST POPULAR</span>}
                </div>
                <p style={{fontFamily:'var(--font-body)',fontSize:12,color:'rgba(255,255,255,0.55)',marginBottom:24,fontStyle:'italic'}}>"{plan.tagline}"</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 24px',marginBottom:28}} className="plan-bullets">
                  {plan.bullets.map((b,j)=>(
                    <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      <span style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.65)',marginTop:2,flexShrink:0}}>—</span>
                      <span style={{fontFamily:'var(--font-body)',fontSize:13,color:'rgba(255,255,255,0.80)',lineHeight:1.6}}>{b}</span>
                    </div>
                  ))}
                </div>
                <button style={{background:'transparent',border:'1px solid rgba(255,255,255,0.20)',color:'rgba(255,255,255,0.60)',padding:'9px 20px',fontSize:10,fontFamily:'var(--font-body)',fontWeight:500,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase',display:'inline-flex',alignItems:'center',gap:8,transition:'border-color 0.2s,color 0.2s'}}
                  onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor='rgba(255,255,255,0.60)';el.style.color='#fff'}}
                  onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor='rgba(255,255,255,0.20)';el.style.color='rgba(255,255,255,0.60)'}}
                >Request Access <span style={{opacity:0.5}}>↗</span></button>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div>
            <div style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.62)',letterSpacing:'0.2em',marginBottom:12}}>// FAQ</div>
            <h3 style={{margin:'0 0 48px 0'}}>
              <span style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(24px,2.8vw,40px)',fontWeight:700,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.82)'}}>Common </span>
              <span style={{fontFamily:"'Dothed',monospace",fontSize:'clamp(22px,2.6vw,38px)',fontWeight:400,color:'rgba(255,255,255,0.68)'}}>questions.</span>
            </h3>
            <div style={{display:'flex',flexDirection:'column'}}>
              {FAQS.map((faq,i)=>(
                <div key={i} style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',background:'none',border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'22px 0',gap:24,textAlign:'left'}}>
                    <span style={{fontFamily:"'Grift',sans-serif",fontSize:'clamp(13px,1.3vw,16px)',fontWeight:600,color:'rgba(255,255,255,0.90)',letterSpacing:'-0.01em',lineHeight:1.3}}>{faq.q}</span>
                    <span style={{fontFamily:"'Dothed',monospace",fontSize:18,color:'rgba(255,255,255,0.55)',flexShrink:0,transform:openFaq===i?'rotate(45deg)':'rotate(0deg)',transition:'transform 0.3s cubic-bezier(0.16,1,0.3,1)',display:'inline-block'}}>+</span>
                  </button>
                  <div style={{overflow:'hidden',maxHeight:openFaq===i?'200px':'0px',transition:'max-height 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
                    <p style={{fontFamily:'var(--font-body)',fontSize:13,color:'rgba(255,255,255,0.72)',lineHeight:1.85,paddingBottom:22,margin:0}}>{faq.a}</p>
                  </div>
                </div>
              ))}
              <div style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{background:'#080808',borderTop:'1px solid rgba(255,255,255,0.08)',padding:'72px 64px 0',overflow:'visible'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:48,marginBottom:80}} className="footer-grid">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <Icon size={38} />
              <div style={{fontFamily:"'Grift',sans-serif",fontSize:19,fontWeight:700,letterSpacing:'0.14em',color:'rgba(255,255,255,0.80)'}}>ANDROMENA</div>
            </div>
            <p style={{fontFamily:'var(--font-body)',fontSize:13,color:'rgba(255,255,255,0.62)',lineHeight:1.85,maxWidth:260}}>Live AI competitor intelligence for the GCC. Know what they're doing before they announce it.</p>
          </div>
          <div>
            <div style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.60)',letterSpacing:'0.16em',marginBottom:16}}>PRODUCT</div>
            {['Features','How It Works','Pricing','API Access'].map(l=>(
              <div key={l} style={{fontFamily:'var(--font-body)',fontSize:13,color:'rgba(255,255,255,0.68)',marginBottom:10,cursor:'pointer',transition:'color 0.2s'}}
                onMouseEnter={e=>(e.target as HTMLElement).style.color='rgba(255,255,255,0.85)'}
                onMouseLeave={e=>(e.target as HTMLElement).style.color='rgba(255,255,255,0.68)'}
              >{l}</div>
            ))}
          </div>
          <div>
            <div style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.60)',letterSpacing:'0.16em',marginBottom:16}}>INTELLIGENCE</div>
            {['Ad Intelligence','Price Watch','Talent Signals','AI Analyst'].map(l=>(
              <div key={l} style={{fontFamily:'var(--font-body)',fontSize:13,color:'rgba(255,255,255,0.68)',marginBottom:10,cursor:'pointer',transition:'color 0.2s'}}
                onMouseEnter={e=>(e.target as HTMLElement).style.color='rgba(255,255,255,0.85)'}
                onMouseLeave={e=>(e.target as HTMLElement).style.color='rgba(255,255,255,0.68)'}
              >{l}</div>
            ))}
          </div>
        </div>
        <WatermarkText/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0',borderTop:'1px solid rgba(255,255,255,0.06)'}} className="footer-bottom">
          <span style={{fontFamily:'var(--font-body)',fontSize:11,color:'rgba(255,255,255,0.18)',letterSpacing:'0.06em'}}>© 2026 ANDROMENA. ALL RIGHTS RESERVED.</span>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{width:4,height:4,borderRadius:'50%',background:'#fff',opacity:0.2,animation:'blink 2.8s ease-in-out infinite',display:'inline-block'}}/>
            <span style={{fontFamily:"'Dothed',monospace",fontSize:10,color:'rgba(255,255,255,0.60)',letterSpacing:'0.14em'}}>LIVE · 24/7</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── WATERMARK
function WatermarkText() {
  const ref=useRef<HTMLDivElement>(null)
  const innerRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    function fit(){
      if(!ref.current||!innerRef.current) return
      innerRef.current.style.transform='none'
      const textW=innerRef.current.offsetWidth,textH=innerRef.current.offsetHeight
      if(textW===0) return
      const scale=window.innerWidth/textW
      innerRef.current.style.transform=`scale(${scale})`
      innerRef.current.style.transformOrigin='left top'
      ref.current.style.height=`${textH*scale}px`
    }
    setTimeout(fit,60)
    window.addEventListener('resize',fit)
    return()=>window.removeEventListener('resize',fit)
  },[])
  return (
    <div ref={ref} style={{width:'100vw',marginLeft:'-64px',overflow:'hidden'}}>
      <div ref={innerRef} style={{fontFamily:"'Dothed',monospace",fontSize:'130px',fontWeight:400,color:'rgba(255,255,255,0.08)',letterSpacing:'0.02em',lineHeight:1,userSelect:'none',whiteSpace:'nowrap',display:'inline-block'}}>
        ANDROMENA
      </div>
    </div>
  )
}