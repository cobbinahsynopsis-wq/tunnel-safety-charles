import { motion } from "framer-motion";

export function TunnelBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Blueprint grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(210, 80%, 50%)" strokeWidth="0.5" />
          </pattern>
          <pattern id="gridLg" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="hsl(210, 80%, 50%)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#gridLg)" />
      </svg>

      {/* TSP Machine blueprint */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.08]"
        viewBox="0 0 1400 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ maxHeight: "55vh" }}
      >
        <defs>
          <linearGradient id="machineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(30, 100%, 50%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(210, 80%, 50%)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Track / rails */}
        <line x1="0" y1="340" x2="1400" y2="340" stroke="hsl(30, 100%, 50%)" strokeWidth="2" />
        <line x1="0" y1="345" x2="1400" y2="345" stroke="hsl(30, 100%, 50%)" strokeWidth="1" />
        {/* Rail ties */}
        {Array.from({ length: 50 }).map((_, i) => (
          <rect key={i} x={i * 30} y={337} width={4} height={12} fill="hsl(30, 100%, 50%)" opacity={0.3} />
        ))}

        {/* Moving machine group */}
        <motion.g
          initial={{ x: -500 }}
          animate={{ x: [-500, 1600] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {/* Cabin 1 */}
          <rect x={0} y={240} width={100} height={95} rx={4} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1.5" />
          <rect x={10} y={250} width={30} height={25} rx={2} fill="none" stroke="hsl(210, 80%, 50%)" strokeWidth="0.8" />
          <text x={50} y={300} textAnchor="middle" fill="hsl(30, 100%, 50%)" fontSize="8" fontFamily="monospace">CABIN</text>

          {/* Casing */}
          <rect x={100} y={270} width={60} height={65} rx={2} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1" />
          <text x={130} y={310} textAnchor="middle" fill="hsl(210, 80%, 50%)" fontSize="7" fontFamily="monospace">CASING</text>

          {/* Remorque / trailer frame */}
          <rect x={170} y={285} width={350} height={50} rx={3} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1.2" />
          <text x={345} y={315} textAnchor="middle" fill="hsl(210, 80%, 50%)" fontSize="7" fontFamily="monospace">REMORQUE</text>

          {/* Essieux (axles) */}
          {[200, 300, 400, 480].map((ax, i) => (
            <g key={i}>
              <line x1={ax} y1={335} x2={ax} y2={345} stroke="hsl(30, 100%, 50%)" strokeWidth="2" />
              <circle cx={ax} cy={340} r={10} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1.2" />
              <circle cx={ax} cy={340} r={3} fill="hsl(30, 100%, 50%)" opacity={0.4} />
            </g>
          ))}

          {/* Timon */}
          <rect x={520} y={290} width={40} height={15} rx={2} fill="none" stroke="hsl(210, 80%, 50%)" strokeWidth="1" />
          <text x={540} y={300} textAnchor="middle" fill="hsl(210, 80%, 50%)" fontSize="6" fontFamily="monospace">TIMON</text>

          {/* Segment support + segments */}
          {[0, 1, 2].map(si => (
            <g key={si}>
              {/* Support */}
              <rect x={580 + si * 110} y={265} width={80} height={70} rx={2} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="0.8" />
              {/* Segment arcs */}
              <path
                d={`M${590 + si * 110},260 Q${620 + si * 110},230 ${650 + si * 110},260`}
                fill="none" stroke="hsl(160, 70%, 45%)" strokeWidth="3" strokeLinecap="round"
              />
              <path
                d={`M${594 + si * 110},258 Q${620 + si * 110},235 ${646 + si * 110},258`}
                fill="none" stroke="hsl(160, 70%, 40%)" strokeWidth="2" strokeLinecap="round"
              />
              <text x={620 + si * 110} y={310} textAnchor="middle" fill="hsl(30, 100%, 50%)" fontSize="6" fontFamily="monospace">SEGMENT</text>
            </g>
          ))}

          {/* Axles for trailer */}
          {[620, 730, 840].map((ax, i) => (
            <g key={`t${i}`}>
              <circle cx={ax} cy={340} r={8} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1" />
              <circle cx={ax} cy={340} r={2.5} fill="hsl(30, 100%, 50%)" opacity={0.3} />
            </g>
          ))}

          {/* Rear cabin */}
          <rect x={900} y={260} width={80} height={75} rx={3} fill="none" stroke="hsl(30, 100%, 50%)" strokeWidth="1.2" />
          <rect x={950} y={268} width={22} height={18} rx={2} fill="none" stroke="hsl(210, 80%, 50%)" strokeWidth="0.8" />
          <text x={940} y={310} textAnchor="middle" fill="hsl(30, 100%, 50%)" fontSize="7" fontFamily="monospace">CABIN 2</text>
        </motion.g>

        {/* Labels */}
        <text x="700" y="380" textAnchor="middle" fill="hsl(30, 100%, 50%)" fontSize="10" fontFamily="monospace" opacity="0.5">
          TSP MOTEUR THERMIQUE — TUNNEL TRANSPORT VEHICLE
        </text>
      </svg>

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.03] blur-[100px]" />
    </div>
  );
}
