// ============================================================
// SPRITES — pixel art data and pre-render cache
// Format: { p: palette{char:hexColor}, px: [16 strings of 16 chars] }
// '.' = transparent
// ============================================================
const SPRITE_DATA = {
  // ── Avatars ──
  rex: {
    p:{H:'#2d5a1b',G:'#4a7c35',W:'#e8dcc8',E:'#1a1a3a',B:'#3d2b1f',R:'#8b1a1a',T:'#3a2800',S:'#c8a46e'},
    px:['....HHHHHHH.....','...HHHHHHHHHH...','...HSSSSSSSH....','...HSWWWWWSH....','...HSWEBEBSH....','...HSWWWWWSH....','...HSSSSSSSH....','..GGGGGGGGGGG...','GGGGGGGGGGGGG...','GGBGGGGGGGBGG...','..GGGGGGGGGGG...','...GGGBBBGGG....','...BB.....BB....','...BB.....BB....','...TT.....TT....','................']
  },
  sable: {
    p:{M:'#8899aa',D:'#556677',L:'#ccddee',R:'#ff3333',B:'#223344',Y:'#ffdd44',W:'#ddeeff',G:'#445566'},
    px:['....MMMMMMMM....','...MDDDDDDDDM...','...MWWWWWWWWM...','...MWRRWWRRWM...','...MWWWWWWWWM...','...MWWYYWWWWM...','...MMMMMMMMM....','..BBBBBBBBBBB...','BBBMBBBBBBBMBBB.','BBBMBBBBBBBMBBB.','.BBBBBBBBBBBB...','...BBBBBBBBB....','...BB.....BB....','...GG.....GG....','...LL.....LL....','................']
  },
  yara: {
    p:{C:'#4488cc',W:'#e8dcc8',E:'#88ffcc',H:'#2255aa',B:'#1a1a3a',L:'#99ccff',G:'#336699',T:'#5577aa',R:'#ffaa44'},
    px:['....CCCCCCCCC...','...CCHHHHHHHCC..','...CWWWWWWWWCW..','...CWWEEWWEWCW..','...CWWWWWWWWCW..','...CWWRRWWWWCW..','...CCCCCCCCCC...','..TTTTTTTTTTT...','TTCTTTTTTTTCTTT.','TTCTTTTTTTTCTTT.','..TTTTTTTTTTT...','...TTTLLLTT.....','...BB.....BB....','...BB.....BB....','...GG.....GG....','................']
  },
  gage: {
    p:{L:'#8b6914',W:'#e8dcc8',E:'#3a2a1a',B:'#1a1a3a',J:'#8b4513',R:'#cc3300',K:'#d4a843',G:'#5a3a1a',T:'#3a2800'},
    px:['....LLLLLLLL....','...LKKKKKKKKL...','...LWWWWWWWWL...','...LWWEEWWEWL...','...LWWWWWWWWL...','...LWWWWRRWWL...','...LLLLLLLLLL...','..JJJJJJJJJJJ..','JJRJJJJJJJRJJJ.','JJRJJJJJJJRJJJ.','..JJJJJJJJJJJ..','...JJJBBBBJJ....','...GG.....GG....','...GG.....GG....','...TT.....TT....','................']
  },

  // ── MC ── the protagonist everyone in the formation is protecting
  mc: {
    p:{H:'#3a2e26',S:'#e8c8a6',W:'#f4e0c4',E:'#1a1a2a',B:'#242424',G:'#f2f0e6',A:'#d4af6a',T:'#161616'},
    px:['....HHHHHHH.....','...HHHHHHHHHH...','...HSSSSSSSH....','...HSWWWWWSH....','...HSWEBEBSH....','...HSWWWWWSH....','...HSSSSSSSH....','..GGGGGGGGGGG...','GGGGGGGGGGGGG...','GGAGGGGGGGAGG...','..GGGGGGGGGGG...','...GGGAAAGGG....','...BB.....BB....','...BB.....BB....','...TT.....TT....','................']
  },

  // ── Enemies ──
  zombie: {
    p:{G:'#4a7a3a',D:'#2d4a22',W:'#cce0aa',E:'#cc2200',R:'#882200',T:'#3a5a28'},
    px:['................','....GGGGGGG.....','...GDDDDDDDG....','...GWWWWWWWG....','...GWEREWEG.....','...GWWWWWWWG....','...GRRRRRRRG....','..GGGGGGGGGG....','GGGGGGGGGGGGG...','GBGGGGGGGGGGG...','..GGGGGGGGGG....','....GGGGGGG.....','....GG...GG.....','....TT...GG.....','....TT...TT.....','................']
  },
  robot: {
    p:{M:'#778899',D:'#445566',L:'#aabbcc',R:'#ff2200',B:'#334455',Y:'#ffcc00',W:'#ccdde8',G:'#223344'},
    px:['................','....MMMMMMMM....','...MDDDDDDDDM...','...MWWWWWWWWM...','...MWRRWRRWWM...','...MWWWWWWWWM...','...MYYYYYYYYM...','..BBBBBBBBBBBB..','BBBBBBBBBBBBBBB.','BBBBBBBBBBBBBBB.','..BBBBBBBBBBBB..','....BBBBBBB.....','....BB...BB.....','....GG...GG.....','....LL...LL.....','................']
  },
  alien: {
    p:{P:'#7755cc',L:'#aa88ff',D:'#442288',E:'#00ffaa',W:'#ddeeff',B:'#221155',T:'#9966ee'},
    px:['................','.....PPPPPP.....','....PDDDDDDP....','....PWWWWWWP....','....PWEEWEWP....','....PWWWWWWP....','....PPPPPPPP....','...TTTTTTTTTT...','..TTTTTTTTTTT...','..TTTTTTTTTTT...','...TTTTTTTTTT...','.....TTTTTT.....','....TTT..TTT....','....LL....LL....','....LL....LL....','................']
  },
  demon: {
    p:{R:'#880000',D:'#440000',L:'#cc2200',E:'#ff8800',W:'#ffcc88',H:'#661100',Y:'#ffdd00',T:'#330000'},
    px:['....R.......R...','....RR.....RR...','....RRRRRRRR....','...RDDDDDDDDDR..','...RWWWWWWWWWR..','...RWYEWYEWYWR..','...RWWWWWWWWWR..','..HHHHHHHHHHHH..','HHHHHHHHHHHHHHHH','HHYHHHHHHHYHHHH.','..HHHHHHHHHHHH..','....HHHHHHHH....','....HH...HH.....','....TT...TT.....','....TT...TT.....','................']
  },
  mutant: {
    p:{G:'#556622',D:'#334411',L:'#88aa33',E:'#ffaa00',W:'#ccdd88',R:'#aa4400',T:'#443300',Y:'#aacc11'},
    px:['................','....GGGGGGGGG...','...GDDDDDDDDDG..','...GWWWWWWWWWG..','...GWEREEEEWWG..','...GWWWWWWWWWG..','...GRRRRRRRRGG..','..YGGGGGGGGGGYG.','YGGGGGGGGGGGYGG.','YGGGGGGGGGGGYGG.','..YGGGGGGGGGGG..','....GGGGGGGGG...','....GGG...GG....','....TTG...GT....','....TTT...TT....','................']
  },
  eldritch: {
    p:{P:'#553377',D:'#331155',L:'#8855bb',E:'#00ffff',W:'#ccaaff',T:'#6633aa',R:'#ff00aa'},
    px:['..P.........P...','..PP.PPPPP.PP...','...PPPDDDDPP....','...PDWWWWWWDP...','...PDWEEWEWDP...','...PDWWRWWWDP...','...PPPPPPPPP....','..TTTTTTTTTTT...','TTTTTTTTTTTTTTT.','TTTTTTTTTTTTTTT.','..TTTTTTTTTTT...','....TTTTTTT.....','..TT.TTT.TTT....','..TT.....TTT....','..TT......TT....','................']
  },
};

// Pre-rendered offscreen canvases — built once at startup
const SCACHE = {};

function buildSpriteCache() {
  const P = C.PIXEL;
  for (const [key, sprite] of Object.entries(SPRITE_DATA)) {
    const oc = document.createElement('canvas');
    oc.width = C.SPRITE_SIZE * P;
    oc.height = C.SPRITE_SIZE * P;
    const ctx = oc.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    sprite.px.forEach((row, y) => {
      for (let x = 0; x < C.SPRITE_SIZE; x++) {
        const ch = row[x];
        if (!ch || ch === '.' || ch === ' ') continue;
        const col = sprite.p[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * P, y * P, P, P);
      }
    });
    SCACHE[key] = oc;
  }
}
