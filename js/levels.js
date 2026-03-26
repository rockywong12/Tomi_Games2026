// levels.js - All 20 level definitions across 4 themed worlds
// v3: speeds ×1.25, lengths ×2, extended harder second halves

// ─── Obstacle shorthand helpers ─────────────────────────────────────────────
const sp   = (x)    => ({ t: 'sp',  x });
const sp2  = (x)    => ({ t: 'sp2', x });
const sp3  = (x)    => ({ t: 'sp3', x });
const bl   = (x)    => ({ t: 'bl',  x });
const blt  = (x)    => ({ t: 'blt', x });
const fbl  = (x, h) => ({ t: 'fbl', x, h: h || 80 });
const csp  = (x)    => ({ t: 'csp', x });
const csp2 = (x)    => ({ t: 'csp2',x });
const circ = (x, cy)=> ({ t: 'circ',x, cy: cy || 80 });

// ─── World definitions ───────────────────────────────────────────────────────
const WORLDS = [
  {
    id: 1,
    name: '🍬 Candy Kingdom',
    desc: 'Sweet and simple!',
    bgTop: '#FFD6EC',
    bgBottom: '#FFF0F8',
    groundColor: '#FF69B4',
    groundPattern: '#FF1493',
    obsColor: '#FF1493',
    blockColor: '#FF85C2',
    blockOutline: '#C7336E',
    decorColor: 'rgba(255,182,193,0.6)',
    locked: false,
  },
  {
    id: 2,
    name: '🚀 Space Adventure',
    desc: 'Blast through the stars!',
    bgTop: '#0A0E1A',
    bgBottom: '#1A2A4A',
    groundColor: '#1E3A5F',
    groundPattern: '#0D2040',
    obsColor: '#7B4FFF',
    blockColor: '#4DC3FF',
    blockOutline: '#1A8FCC',
    decorColor: 'rgba(255,255,255,0.5)',
    locked: true,
  },
  {
    id: 3,
    name: '🌊 Ocean Deep',
    desc: 'Dive into the depths!',
    bgTop: '#003D5B',
    bgBottom: '#006994',
    groundColor: '#00527A',
    groundPattern: '#003D5B',
    obsColor: '#FF6B9D',
    blockColor: '#40E0D0',
    blockOutline: '#007A6E',
    decorColor: 'rgba(64,224,208,0.3)',
    locked: true,
  },
  {
    id: 4,
    name: '🌋 Volcano Island',
    desc: 'Survive the inferno!',
    bgTop: '#1A0000',
    bgBottom: '#5C1500',
    groundColor: '#3D0A00',
    groundPattern: '#2A0500',
    obsColor: '#FF4500',
    blockColor: '#FF6B35',
    blockOutline: '#8B1A00',
    decorColor: 'rgba(255,69,0,0.3)',
    locked: true,
  }
];

function getWorld(id) {
  return WORLDS.find(w => w.id === id);
}

// ─── Level definitions ───────────────────────────────────────────────────────
// speeds = original × 1.25   |   lengths = original × 2
const LEVELS = [

  // ═══════════════════════════════════════════════════════
  // WORLD 1 – CANDY KINGDOM  (levels 1–5)
  // ═══════════════════════════════════════════════════════
  {
    id: 1, worldId: 1, name: 'Sweet Start',
    speed: 4.1, length: 8400,
    obstacles: [
      // first half (original)
      sp(500),  sp(850),
      fbl(1100,85), sp(1350),
      sp(1700),     sp2(2050),
      circ(2350,70),sp(2650),
      sp2(2950),    fbl(3200,90),
      sp(3480),     sp(3800),     sp2(4050),
      // second half (harder – more ceiling spikes and combos)
      sp2(4350),    csp(4620),
      fbl(4880,80), sp(5130),
      sp2(5380),    circ(5640,75),
      csp(5900),    sp3(6160),
      fbl(6430,90), sp2(6690),
      csp(6950),    sp(7200),
      sp3(7460),    fbl(7730,85),
      sp2(7990),    csp(8250),
    ]
  },
  {
    id: 2, worldId: 1, name: 'Gummy Way',
    speed: 4.1, length: 8800,
    obstacles: [
      // first half
      sp(480),      sp2(830),
      fbl(1100,80), sp(1360),
      sp2(1700),    circ(2000,75),
      bl(2280),     sp(2580),
      csp(2850),    sp2(3120),
      fbl(3400,100),sp(3700),
      sp2(3980),    sp(4260),
      // second half
      sp3(4560),    csp2(4820),
      fbl(5090,85), sp2(5350),
      circ(5620,80),csp(5880),
      sp3(6150),    fbl(6420,95),
      sp2(6680),    csp2(6950),
      circ(7220,70),sp3(7490),
      fbl(7760,90), sp2(8030),
      csp2(8290),   sp(8560),     sp2(8730),
    ]
  },
  {
    id: 3, worldId: 1, name: 'Lollipop Lane',
    speed: 4.4, length: 9600,
    obstacles: [
      // first half
      sp(480),      bl(800),      sp(1100),
      csp(1380),    sp2(1650),
      fbl(1940,90), sp(2200),
      sp2(2500),    circ(2780,80),
      bl(3060),     csp2(3320),
      sp3(3620),    sp(3950),
      fbl(4200,85), sp2(4480),
      // second half
      sp3(4980),    csp2(5250),
      fbl(5520,90), sp2(5790),
      circ(6060,80),csp(6330),
      sp3(6600),    fbl(6870,95),
      csp2(7140),   sp3(7410),
      circ(7680,85),fbl(7950,90),
      sp2(8220),    csp2(8490),
      sp3(8760),    fbl(9030,95),
      csp(9300),    sp2(9500),
    ]
  },
  {
    id: 4, worldId: 1, name: 'Caramel Crunch',
    speed: 4.6, length: 10400,
    obstacles: [
      // first half
      sp2(450),     sp(770),
      csp(1000),    sp2(1280),
      fbl(1560,95), sp3(1870),
      circ(2180,70),bl(2480),
      sp2(2780),    csp2(3060),
      sp3(3380),    fbl(3700,85),
      sp(4000),     sp2(4300),
      sp3(4620),    csp(4900),
      sp2(5100),
      // second half
      sp3(5380),    csp(5650),
      fbl(5920,95), sp2(6180),
      csp2(6450),   circ(6720,80),
      sp3(6990),    fbl(7260,90),
      csp(7530),    sp3(7800),
      csp2(8070),   fbl(8340,95),
      circ(8610,75),sp3(8880),
      csp(9150),    sp2(9420),
      csp2(9690),   sp3(9960),
      fbl(10200,90),csp(10340),
    ]
  },
  {
    id: 5, worldId: 1, name: 'Sugar Rush',
    speed: 5.0, length: 11200,
    obstacles: [
      // first half
      sp2(440),     csp(720),
      sp3(1020),    fbl(1320,90),
      circ(1640,85),sp2(1950),
      sp3(2270),    csp2(2580),
      fbl(2870,100),sp2(3180),
      sp3(3500),    circ(3810,75),
      csp(4110),    blt(4410),
      sp3(4720),    sp2(5020),
      sp3(5320),
      // second half
      sp3(5780),    csp2(6050),
      circ(6320,85),fbl(6590,90),
      sp3(6860),    csp(7130),
      fbl(7400,95), csp2(7670),
      sp3(7940),    circ(8210,80),
      fbl(8480,90), csp(8750),
      sp3(9020),    csp2(9290),
      fbl(9560,85), sp3(9830),
      circ(10100,80),csp(10380),
      sp3(10650),   csp2(10930),
    ]
  },

  // ═══════════════════════════════════════════════════════
  // WORLD 2 – SPACE ADVENTURE  (levels 6–10)
  // ═══════════════════════════════════════════════════════
  {
    id: 6, worldId: 2, name: 'Launchpad',
    speed: 5.5, length: 10400,
    obstacles: [
      // first half
      sp(450),      fbl(740,90),
      sp2(1060),    csp(1350),
      bl(1650),     sp3(1950),
      circ(2250,80),sp2(2580),
      csp2(2870),   blt(3180),
      sp3(3510),    fbl(3820,95),
      sp2(4150),    csp(4460),
      sp3(4780),    sp2(5050),
      // second half
      sp3(5380),    csp2(5640),
      fbl(5900,90), sp2(6150),
      csp(6400),    sp3(6650),
      circ(6900,85),fbl(7150,95),
      csp2(7400),   sp3(7650),
      csp(7900),    fbl(8150,90),
      sp3(8400),    csp2(8650),
      circ(8900,80),sp3(9150),
      fbl(9400,95), csp(9650),
      sp3(9900),    csp2(10150),
    ]
  },
  {
    id: 7, worldId: 2, name: 'Asteroid Belt',
    speed: 5.5, length: 10800,
    obstacles: [
      // first half
      sp2(440),     circ(760,90),
      sp3(1080),    csp(1400),
      fbl(1710,85), sp2(2020),
      csp2(2330),   sp3(2660),
      circ(2980,75),fbl(3300,100),
      sp2(3630),    csp(3940),
      sp3(4270),    circ(4590,80),
      sp2(4900),    sp3(5180),
      // second half
      sp3(5580),    csp2(5840),
      circ(6100,85),fbl(6360,95),
      sp3(6620),    csp(6880),
      sp2(7130),    csp2(7390),
      fbl(7650,90), circ(7920,80),
      sp3(8190),    csp(8450),
      fbl(8720,95), sp3(8990),
      csp2(9250),   circ(9520,85),
      sp3(9790),    fbl(10060,90),
      csp(10320),   sp3(10590),
    ]
  },
  {
    id: 8, worldId: 2, name: 'Nebula Run',
    speed: 6.3, length: 11200,
    obstacles: [
      // first half
      sp(440),      csp(720),
      fbl(1000,90), sp2(1320),
      sp3(1650),    csp2(1960),
      circ(2280,85),fbl(2600,95),
      sp3(2930),    sp2(3270),
      csp(3580),    sp3(3900),
      fbl(4230,80), circ(4560,90),
      sp2(4890),    sp3(5200),
      csp2(5480),
      // second half
      sp3(5780),    csp2(6040),
      fbl(6300,90), circ(6560,85),
      csp(6820),    sp3(7080),
      fbl(7340,95), csp2(7600),
      sp3(7860),    circ(8120,80),
      csp(8380),    fbl(8640,90),
      sp3(8900),    csp2(9160),
      circ(9420,85),fbl(9680,95),
      sp3(9940),    csp(10200),
      sp3(10460),   csp2(10720),
      sp2(11000),
    ]
  },
  {
    id: 9, worldId: 2, name: 'Galaxy Trail',
    speed: 6.3, length: 11600,
    obstacles: [
      // first half
      sp2(420),     fbl(730,95),
      csp(1040),    sp3(1360),
      circ(1680,80),sp2(2000),
      csp2(2320),   sp3(2660),
      fbl(2990,90), csp(3320),
      sp3(3660),    circ(3990,85),
      sp2(4330),    fbl(4660,100),
      csp2(4990),   sp3(5330),
      sp2(5600),
      // second half
      sp3(5980),    csp2(6240),
      circ(6500,90),fbl(6760,95),
      csp(7020),    sp3(7280),
      csp2(7540),   fbl(7800,90),
      circ(8060,85),sp3(8320),
      csp(8580),    fbl(8840,95),
      sp3(9100),    csp2(9360),
      circ(9620,80),sp3(9880),
      fbl(10140,90),csp(10400),
      sp3(10660),   csp2(10920),
      circ(11180,85),sp3(11400),
    ]
  },
  {
    id: 10, worldId: 2, name: 'Warp Speed',
    speed: 6.9, length: 12000,
    obstacles: [
      // first half
      sp3(400),     csp(700),
      fbl(980,90),  sp2(1290),
      csp2(1590),   sp3(1900),
      circ(2210,80),fbl(2520,95),
      sp3(2830),    csp(3150),
      sp2(3470),    sp3(3790),
      fbl(4110,85), csp2(4430),
      sp3(4750),    circ(5080,90),
      sp2(5400),    sp3(5720),
      // second half
      sp3(6190),    csp2(6440),
      circ(6690,90),fbl(6940,95),
      csp(7190),    sp3(7440),
      csp2(7690),   circ(7940,85),
      fbl(8190,90), sp3(8440),
      csp(8690),    fbl(8940,95),
      csp2(9190),   sp3(9440),
      circ(9690,80),csp(9940),
      sp3(10190),   fbl(10440,90),
      csp2(10690),  sp3(10940),
      circ(11190,85),csp(11440),
      sp3(11720),
    ]
  },

  // ═══════════════════════════════════════════════════════
  // WORLD 3 – OCEAN DEEP  (levels 11–15)
  // ═══════════════════════════════════════════════════════
  {
    id: 11, worldId: 3, name: 'Coral Coast',
    speed: 6.9, length: 11600,
    obstacles: [
      // first half
      sp2(420),     csp(720),
      fbl(1020,90), sp3(1340),
      circ(1660,80),sp2(1990),
      csp2(2310),   sp3(2650),
      fbl(2980,95), sp2(3310),
      csp(3640),    sp3(3980),
      circ(4310,85),fbl(4650,90),
      sp2(4990),    sp3(5330),
      csp2(5600),
      // second half
      sp3(5990),    csp2(6240),
      fbl(6490,95), circ(6740,85),
      csp(6990),    sp3(7240),
      csp2(7490),   fbl(7740,90),
      sp3(7990),    circ(8240,80),
      csp(8490),    sp3(8740),
      fbl(8990,95), csp2(9240),
      sp3(9490),    circ(9740,85),
      csp(9990),    fbl(10240,90),
      sp3(10490),   csp2(10740),
      sp3(10990),   csp(11240),
      sp3(11480),
    ]
  },
  {
    id: 12, worldId: 3, name: 'Kelp Forest',
    speed: 7.6, length: 12000,
    obstacles: [
      // first half
      sp3(420),     fbl(720,95),
      csp2(1030),   sp2(1360),
      sp3(1690),    circ(2020,85),
      fbl(2350,100),csp(2680),
      sp3(3020),    sp2(3360),
      csp2(3700),   fbl(4040,90),
      sp3(4390),    circ(4740,80),
      sp2(5090),    csp(5440),
      sp3(5760),
      // second half
      sp3(6190),    csp2(6440),
      circ(6690,85),fbl(6940,95),
      csp(7190),    sp3(7440),
      csp2(7690),   fbl(7940,90),
      circ(8190,85),sp3(8440),
      csp(8690),    csp2(8940),
      fbl(9190,95), sp3(9440),
      circ(9690,80),csp(9940),
      sp3(10190),   csp2(10440),
      fbl(10690,90),sp3(10940),
      csp(11190),   circ(11440,85),
      sp3(11720),
    ]
  },
  {
    id: 13, worldId: 3, name: 'Underwater Caves',
    speed: 7.6, length: 12400,
    obstacles: [
      // first half
      sp3(420),     csp2(720),
      fbl(1040,95), sp2(1380),
      sp3(1720),    circ(2060,90),
      csp(2400),    fbl(2740,100),
      sp3(3090),    sp2(3440),
      csp2(3790),   sp3(4150),
      fbl(4510,85), circ(4870,80),
      sp2(5230),    csp(5590),
      sp3(5940),
      // second half
      sp3(6400),    csp2(6650),
      fbl(6900,95), circ(7150,85),
      csp(7400),    sp3(7650),
      csp2(7900),   fbl(8150,90),
      sp3(8400),    circ(8650,80),
      csp(8900),    fbl(9150,95),
      sp3(9400),    csp2(9650),
      circ(9900,85),sp3(10150),
      csp(10400),   fbl(10650,90),
      csp2(10900),  sp3(11150),
      circ(11400,80),csp(11650),
      sp3(11900),   csp2(12200),
    ]
  },
  {
    id: 14, worldId: 3, name: 'Abyss',
    speed: 8.3, length: 12800,
    obstacles: [
      // first half
      sp2(400),     csp(700),
      fbl(1000,100),sp3(1340),
      csp2(1680),   circ(2020,90),
      sp2(2370),    fbl(2720,95),
      sp3(3070),    csp(3430),
      sp2(3790),    csp2(4150),
      sp3(4520),    fbl(4890,90),
      circ(5260,85),sp2(5630),
      sp3(5990),    csp(6250),
      // second half
      sp3(6590),    csp2(6840),
      circ(7090,90),fbl(7340,95),
      csp(7590),    sp3(7840),
      csp2(8090),   fbl(8340,90),
      sp3(8590),    circ(8840,85),
      csp(9090),    csp2(9340),
      fbl(9590,95), sp3(9840),
      circ(10090,80),csp(10340),
      sp3(10590),   csp2(10840),
      fbl(11090,90),sp3(11340),
      circ(11590,85),csp(11840),
      sp3(12090),   csp2(12350),
      sp3(12620),
    ]
  },
  {
    id: 15, worldId: 3, name: 'Tsunami',
    speed: 8.3, length: 13200,
    obstacles: [
      // first half
      sp3(400),     csp2(700),
      fbl(1000,90), sp2(1340),
      sp3(1680),    circ(2020,80),
      csp(2370),    fbl(2720,100),
      sp3(3070),    csp2(3430),
      sp2(3800),    fbl(4170,95),
      sp3(4550),    csp(4920),
      circ(5290,90),sp2(5670),
      sp3(6050),    csp2(6300),
      // second half
      sp3(6800),    csp2(7050),
      fbl(7300,90), circ(7550,85),
      csp(7800),    sp3(8050),
      csp2(8300),   fbl(8550,95),
      circ(8800,80),sp3(9050),
      csp(9300),    csp2(9550),
      sp3(9800),    fbl(10050,90),
      circ(10300,85),csp(10550),
      sp3(10800),   csp2(11050),
      fbl(11300,95),sp3(11550),
      circ(11800,80),csp(12050),
      sp3(12300),   csp2(12550),
      fbl(12800,90),sp3(13050),
    ]
  },

  // ═══════════════════════════════════════════════════════
  // WORLD 4 – VOLCANO ISLAND  (levels 16–20)
  // ═══════════════════════════════════════════════════════
  {
    id: 16, worldId: 4, name: 'Lava Fields',
    speed: 8.3, length: 12800,
    obstacles: [
      // first half
      sp3(400),     csp(700),
      fbl(1000,95), sp2(1350),
      csp2(1700),   sp3(2050),
      circ(2410,90),fbl(2770,100),
      sp3(3140),    csp(3510),
      sp2(3890),    sp3(4270),
      csp2(4650),   fbl(5030,85),
      sp3(5420),    circ(5810,80),
      sp2(6150),    sp3(6320),
      // second half
      sp3(6600),    csp2(6850),
      circ(7100,90),fbl(7350,95),
      csp(7600),    sp3(7850),
      csp2(8100),   fbl(8350,90),
      circ(8600,85),sp3(8850),
      csp(9100),    csp2(9350),
      sp3(9600),    fbl(9850,95),
      circ(10100,80),csp(10350),
      sp3(10600),   csp2(10850),
      fbl(11100,90),sp3(11350),
      circ(11600,85),csp(11850),
      sp3(12100),   csp2(12360),
      fbl(12620,95),sp3(12740),
    ]
  },
  {
    id: 17, worldId: 4, name: 'Magma Surge',
    speed: 9.0, length: 13200,
    obstacles: [
      // first half
      sp3(380),     csp2(680),
      fbl(980,100), sp2(1320),
      sp3(1660),    csp(2010),
      circ(2360,90),fbl(2710,95),
      sp3(3060),    csp2(3420),
      sp2(3790),    fbl(4160,85),
      sp3(4540),    csp(4920),
      circ(5300,80),sp2(5680),
      sp3(6070),    csp2(6350),
      // second half
      sp3(6800),    csp2(7050),
      circ(7300,90),fbl(7550,95),
      csp(7800),    sp3(8050),
      csp2(8300),   fbl(8550,90),
      sp3(8800),    circ(9050,85),
      csp(9300),    csp2(9550),
      fbl(9800,95), sp3(10050),
      circ(10300,80),csp(10550),
      sp3(10800),   csp2(11050),
      fbl(11300,90),sp3(11550),
      csp(11800),   circ(12050,85),
      csp2(12300),  sp3(12560),
      fbl(12820,95),csp(13050),
    ]
  },
  {
    id: 18, worldId: 4, name: 'Eruption',
    speed: 9.0, length: 13600,
    obstacles: [
      // first half
      sp3(380),     csp(680),
      fbl(980,95),  sp2(1320),
      csp2(1660),   sp3(2010),
      fbl(2370,100),circ(2730,85),
      sp3(3100),    csp(3470),
      sp2(3850),    csp2(4230),
      sp3(4620),    fbl(5010,90),
      circ(5400,80),sp2(5800),
      sp3(6200),    csp(6560),
      sp2(6720),
      // second half
      sp3(7000),    csp2(7250),
      circ(7500,90),fbl(7750,95),
      csp(8000),    sp3(8250),
      csp2(8500),   circ(8750,85),
      fbl(9000,90), sp3(9250),
      csp(9500),    csp2(9750),
      fbl(10000,95),sp3(10250),
      circ(10500,80),csp(10750),
      sp3(11000),   csp2(11250),
      fbl(11500,90),circ(11750,85),
      sp3(12000),   csp(12250),
      csp2(12500),  fbl(12750,95),
      sp3(13000),   csp(13250),
      sp3(13450),
    ]
  },
  {
    id: 19, worldId: 4, name: 'Inferno',
    speed: 9.6, length: 14000,
    obstacles: [
      // first half
      sp3(380),     csp2(680),
      fbl(980,100), sp2(1330),
      sp3(1680),    csp(2040),
      circ(2400,90),fbl(2760,95),
      sp3(3130),    csp2(3510),
      sp2(3900),    fbl(4290,85),
      sp3(4690),    csp(5090),
      circ(5500,80),sp2(5910),
      csp2(6330),   sp3(6760),
      // second half
      sp3(7200),    csp2(7440),
      circ(7680,90),fbl(7920,95),
      csp(8160),    sp3(8400),
      csp2(8640),   fbl(8880,90),
      circ(9120,85),sp3(9360),
      csp(9600),    csp2(9840),
      sp3(10080),   fbl(10320,95),
      circ(10560,80),csp(10800),
      sp3(11040),   csp2(11280),
      fbl(11520,90),sp3(11760),
      circ(12000,85),csp(12240),
      csp2(12480),  sp3(12720),
      fbl(12960,95),csp(13200),
      sp3(13440),   csp2(13680),
      sp3(13880),
    ]
  },
  {
    id: 20, worldId: 4, name: 'Final Flame',
    speed: 9.6, length: 15000,
    obstacles: [
      // first half
      sp3(380),     csp2(680),
      fbl(980,100), sp2(1330),
      sp3(1680),    csp(2040),
      fbl(2400,95), circ(2770,90),
      sp3(3150),    csp2(3540),
      sp2(3940),    fbl(4340,85),
      sp3(4750),    csp(5170),
      circ(5600,80),fbl(6040,100),
      sp2(6480),    csp2(6920),
      sp3(7390),
      // second half (maximum intensity)
      sp3(7700),    csp2(7950),
      circ(8200,90),fbl(8450,95),
      csp(8700),    sp3(8950),
      csp2(9200),   fbl(9450,90),
      circ(9700,85),sp3(9950),
      csp(10200),   csp2(10450),
      fbl(10700,95),sp3(10950),
      circ(11200,80),csp(11450),
      sp3(11700),   csp2(11950),
      fbl(12200,90),sp3(12450),
      circ(12700,85),csp(12950),
      csp2(13200),  sp3(13450),
      fbl(13700,95),csp(13950),
      sp3(14200),   csp2(14450),
      fbl(14700,95),sp3(14900),
    ]
  }
];

function getLevel(id) {
  return LEVELS.find(l => l.id === id);
}

function getLevelsForWorld(worldId) {
  return LEVELS.filter(l => l.worldId === worldId);
}
