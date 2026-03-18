import { motion } from "framer-motion";

function Segment({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.rect
      x={x}
      y={y}
      width={28}
      height={18}
      rx={2}
      fill="hsl(var(--primary) / 0.15)"
      stroke="hsl(var(--primary) / 0.3)"
      strokeWidth={0.5}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0.6, 0] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function TunnelBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <svg className="w-full h-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        {/* Tunnel walls */}
        <defs>
          <linearGradient id="tunnelGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(222, 47%, 11%)" stopOpacity="0.08" />
            <stop offset="50%" stopColor="hsl(222, 47%, 16%)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(222, 47%, 11%)" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="lightGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tunnel arch */}
        <path d="M0,700 L0,200 Q600,20 1200,200 L1200,700 Z" fill="url(#tunnelGrad)" />

        {/* Track lines */}
        <line x1="200" y1="520" x2="1000" y2="520" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="8 4" opacity="0.3" />
        <line x1="200" y1="540" x2="1000" y2="540" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="8 4" opacity="0.3" />

        {/* Moving TSP Machine */}
        <motion.g
          initial={{ x: -300 }}
          animate={{ x: [−300, 1400] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          {/* Machine body */}
          <rect x={0} y={480} width={180} height={45} rx={4} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary) / 0.4)" strokeWidth={1} />
          {/* Cabin */}
          <rect x={10} y={468} width={35} height={16} rx={3} fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary) / 0.5)" strokeWidth={0.8} />
          {/* Headlight */}
          <circle cx={185} cy={500} r={4} fill="hsl(45, 93%, 47%)" opacity={0.7} />
          <circle cx={185} cy={500} r={10} fill="url(#lightGlow)" />
          {/* Wheels */}
          {[20, 60, 120, 160].map((wx, i) => (
            <motion.circle
              key={i}
              cx={wx}
              cy={528}
              r={8}
              fill="hsl(var(--foreground) / 0.15)"
              stroke="hsl(var(--foreground) / 0.25)"
              strokeWidth={1}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          ))}
          {/* Segments on the machine */}
          {[0, 1, 2].map((si) => (
            <rect
              key={si}
              x={45 + si * 38}
              y={485}
              width={30}
              height={14}
              rx={2}
              fill="hsl(var(--accent) / 0.4)"
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeWidth={0.5}
            />
          ))}
        </motion.g>

        {/* Second machine going other way */}
        <motion.g
          initial={{ x: 1400 }}
          animate={{ x: [1400, -300] }}
          transition={{ duration: 22, delay: 5, repeat: Infinity, ease: "linear" }}
        >
          <rect x={0} y={555} width={140} height={35} rx={3} fill="hsl(var(--secondary) / 0.12)" stroke="hsl(var(--secondary) / 0.25)" strokeWidth={0.8} />
          <rect x={105} y={546} width={28} height={12} rx={2} fill="hsl(var(--secondary) / 0.2)" stroke="hsl(var(--secondary) / 0.35)" strokeWidth={0.6} />
          <circle cx={-5} cy={570} r={3} fill="hsl(45, 93%, 47%)" opacity={0.5} />
          {[15, 45, 95, 125].map((wx, i) => (
            <motion.circle
              key={i}
              cx={wx}
              cy={593}
              r={6}
              fill="hsl(var(--foreground) / 0.1)"
              stroke="hsl(var(--foreground) / 0.2)"
              strokeWidth={0.8}
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
          ))}
          {[0, 1].map((si) => (
            <rect key={si} x={20 + si * 35} y={559} width={25} height={10} rx={1.5} fill="hsl(var(--accent) / 0.3)" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth={0.4} />
          ))}
        </motion.g>

        {/* Installed segments on tunnel wall */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Segment key={i} x={100 + i * 130} y={180 + Math.sin(i * 0.8) * 30} delay={i * 0.5} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Segment key={`b${i}`} x={150 + i * 120} y={620 + Math.cos(i * 0.6) * 15} delay={i * 0.7 + 2} />
        ))}
      </svg>
    </div>
  );
}
