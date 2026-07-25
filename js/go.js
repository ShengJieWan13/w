/**
 * 围棋游戏 - Go（增强版）
 * 功能：残局练习、AI 对战（Monte Carlo）、胜率显示、AI 提示、双人对弈
 */

// ==================== 围棋教程体系（3章9课27题） ====================
const GO_CHAPTERS = [
{ id:'capture', title:'第一章：吃子基础', icon:'🎯', lessons:[
{ id:'atari', title:'1.1 气与提子', teaching:'<strong>气</strong>是围棋的生命线。每个棋子相邻的空交叉点叫"气"。一方棋子所有的气都被对方堵住后，这些棋子就被<strong>提掉</strong>（从棋盘上拿走）。<br><br>📌 <strong>要点：</strong>下棋前先数气，气少要逃跑，没气就被吃。',
 problems:[
  {name:'练习1：数气',desc:'黑先，堵住白棋最后一口气将其提掉',cat:'一步题',size:9,color:1,setup:{black:[[3,1],[4,2],[4,4]],white:[[3,2],[3,3],[4,3]]},answer:[3,4],explanation:'白△三子只剩(3,4)一口气，黑1直接紧气即可提掉白棋。下棋前先看气，这是最基本的战术意识。'},
  {name:'练习2：逃跑',desc:'黑先，延长己方棋子的气避免被吃',cat:'一步题',size:9,color:1,setup:{black:[[3,3],[4,2]],white:[[2,3],[3,2],[4,3],[5,3]]},answer:[3,4],explanation:'黑两子即将被包围，黑1向外逃跑是最直接的应对。逃出后与更多棋子连通，气数大增。'},
  {name:'练习3：紧气',desc:'黑先，连续紧气吃白',cat:'多步题',size:9,color:1,setup:{black:[[2,2],[3,1],[4,2]],white:[[2,3],[3,2],[3,3]]},answer:[2,3],sequence:[[2,3],[3,2]],explanation:'黑1打吃(2,3)，白2只能提，黑棋通过紧气成功迫使白棋进入绝境。'}
]},
{ id:'connect', title:'1.2 连接与切断', teaching:'<strong>连接</strong>：把自己的棋子连成一体，气数共享，不易被吃。<strong>切断</strong>：把对方的棋子分开，各个击破。围棋格言："棋逢断处生"，切断是进攻的第一步。<br><br>📌 <strong>要点：</strong>自己的棋子要及时连接，对方的棋子要果断切断。',
 problems:[
  {name:'练习4：虎口连接',desc:'黑先，用虎口的方式间接连接两块黑棋',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,5],[3,3],[3,5],[4,2],[4,4]],white:[[2,3],[2,4],[3,2],[3,4],[4,3]]},answer:[3,4],explanation:'黑1落于(3,4)形成"虎口"——虽然相邻有空点，但白棋不敢放入（放进去就被提）。虎口是最有效的间接连接方式。'},
  {name:'练习5：切断进攻',desc:'黑先，切断白棋的连接分而治之',cat:'一步题',size:9,color:1,setup:{black:[[3,2],[3,4],[4,1],[4,5],[5,3]],white:[[2,3],[3,3],[4,2],[4,4]]},answer:[4,3],explanation:'黑1断(4,3)将白棋分为左右两块，白棋左右不能兼顾，必然有一块被吃。切断是进攻的起点！'},
  {name:'练习6：补断',desc:'黑先，补上自己的断点防止被切断',cat:'一步题',size:9,color:1,setup:{black:[[2,3],[3,2],[3,4],[4,1],[4,5]],white:[[2,2],[2,4],[3,1],[3,5],[4,3]]},answer:[3,3],explanation:'黑1补在(3,3)将上下两块黑棋牢牢连接。白棋想切断也无从下手。围棋中"补棋"与进攻同样重要。'}
]},
{ id:'double-atari', title:'1.3 双打吃', teaching:'<strong>双打吃</strong>：一子落下同时打吃对方两块棋，对方无法同时救回两边。这是最基础的吃子手筋之一。<br><br>📌 <strong>要点：</strong>寻找对方有两块气紧的棋相邻的位置，一箭双雕。',
 problems:[
  {name:'练习7：基础双打吃',desc:'黑先，找到双打吃的位置',cat:'一步题',size:9,color:1,setup:{black:[[3,2],[3,4],[4,3],[5,2],[5,5]],white:[[3,3],[4,2],[4,5],[5,3],[5,4]]},answer:[4,4],explanation:'黑1(4,4)同时打吃上方(4,5)和左边(4,2)两块白棋，白方只能救一边，另一边必死。'},
  {name:'练习8：制造双打吃',desc:'黑先，先手准备然后双打吃',cat:'多步题',size:9,color:1,setup:{black:[[2,2],[2,4],[3,1],[4,2],[5,3]],white:[[2,3],[3,2],[3,3],[4,1],[4,3]]},answer:[3,3],sequence:[[3,3],[4,1]],explanation:'黑1先断打(3,3)，白2逃，黑棋形成双打吃的局面。有时双打吃需要先做好准备工作。'},
  {name:'练习9：实战双打吃',desc:'黑先，在复杂局面中找到双打吃',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[3,1],[3,4],[4,3],[5,2],[5,4]],white:[[2,3],[3,2],[3,3],[4,2],[4,4],[5,3]]},answer:[4,2],explanation:'黑1(4,2)同时打吃(3,2)和(4,4)两块白棋，在看似复杂的局面下一击制胜。'}
]}
]},
{ id:'life-death', title:'第二章：死活基础', icon:'💀', lessons:[
{ id:'eyes', title:'2.1 眼与活棋', teaching:'<strong>眼</strong>：被己方棋子围住的空点。一块棋至少需要<strong>两只真眼</strong>才能确保不死。单眼的棋最终会被对方填死。<br><br>📌 <strong>要点：</strong>真眼周围的棋子必须全部连通且牢固；假眼（对方可以破坏的眼）不算。',
 problems:[
  {name:'练习10：识别真眼',desc:'黑先，识别并保护自己的两只真眼',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,3],[3,2],[3,5],[4,3],[4,4],[5,4]],white:[[1,3],[2,1],[2,4],[3,1],[3,4],[4,2],[4,5]]},answer:[2,4],explanation:'黑1粘(2,4)确保左右各有一只真眼。两只真眼=活棋，这是围棋最基本的死活法则。'},
  {name:'练习11：假眼识别',desc:'黑先，指出白棋的假眼并破掉',cat:'一步题',size:9,color:1,setup:{black:[[1,3],[2,2],[2,4],[3,1],[3,5],[4,3]],white:[[2,3],[3,2],[3,3],[3,4]]},answer:[3,3],explanation:'白棋看起来有眼，但实际上(3,3)是假眼——黑1卡住要害，白棋的眼瞬间消失。假眼不能做活！'},
  {name:'练习12：最少两眼',desc:'黑先，用最少棋子做出两只眼',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,5],[3,2],[3,4],[3,5],[4,3]],white:[[1,2],[1,5],[2,1],[2,6],[3,1],[3,6],[4,2],[4,4],[4,5]]},answer:[2,3],explanation:'黑1(2,3)连通两边，在狭小空间内恰好做出两只眼。做眼的要点是找到"眼位要点"——往往在中心偏左或偏右的位置。'}
]},
{ id:'kill', title:'2.2 破眼杀棋', teaching:'要杀死对方的棋，关键是<strong>破坏对方的眼位</strong>。常见手段：扑（缩小眼位）、点（占据眼位要点）、卡（卡住眼角）。<br><br>📌 <strong>口诀：</strong>"敌之要点，我之要点"——对方想做眼的位置，就是你应该抢占的位置。',
 problems:[
  {name:'练习13：扑杀',desc:'黑先，用扑破坏白棋眼位',cat:'一步题',size:9,color:1,setup:{black:[[1,3],[2,1],[2,5],[3,2],[3,4],[4,3]],white:[[2,2],[2,3],[2,4],[3,3]]},answer:[1,2],explanation:'黑1扑(1,2)！白棋提掉后眼位反而缩小，这是"扑杀"的经典运用。'},
  {name:'练习14：点杀',desc:'黑先，找到白棋眼位的要点',cat:'一步题',size:9,color:1,setup:{black:[[1,3],[2,2],[2,6],[3,1],[3,7],[4,2],[4,6],[5,4]],white:[[2,3],[2,4],[2,5],[3,3],[3,4],[3,5],[4,3],[4,4]]},answer:[3,4],explanation:'黑1点入(3,4)正中白棋眼位的要点！白棋的空间被一分为二，无法做出两只眼。'},
  {name:'练习15：角部杀棋',desc:'黑先，在角上杀死白棋',cat:'多步题',size:9,color:1,setup:{black:[[0,2],[1,1],[1,3],[2,0],[2,4],[3,1]],white:[[0,0],[0,1],[1,0],[1,2],[2,1],[2,2],[2,3]]},answer:[0,0],sequence:[[0,0],[0,1]],explanation:'黑1扑(0,0)缩小眼位，白2提，黑3再点另一处。角部杀棋常常需要连续紧逼，不给白棋喘息机会。'}
]},
{ id:'live', title:'2.3 做活技巧', teaching:'被包围时要<strong>做活</strong>。做活需要：扩大眼位空间、占据眼位要点。角部做活空间虽小，但有特殊的棋形可以利用。<br><br>📌 <strong>要点：</strong>"左右同形走中间"——对称棋形中，中心点往往就是做活的要点。',
 problems:[
  {name:'练习16：角部做活',desc:'黑先，在角上做出两只眼',cat:'一步题',size:9,color:1,setup:{black:[[0,1],[1,0],[1,2],[2,1]],white:[[0,0],[0,2],[1,1],[2,0]]},answer:[2,2],explanation:'黑1占据(2,2)做活要点，在最小空间内做出两眼。角部二·2位置常常是死活的命门。'},
  {name:'练习17：扩大眼位',desc:'黑先，扩大眼位空间做活',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,3],[3,1],[3,4],[4,2],[4,3]],white:[[1,2],[1,3],[2,1],[2,4],[3,0],[3,5],[4,1],[4,4]]},answer:[3,2],explanation:'黑1(3,2)将眼位空间最大化，确保足够空间做出两只眼。空间越大越容易做活。'},
  {name:'练习18：左右同形',desc:'黑先，左右同形走中间做活',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,6],[3,3],[3,5],[4,2],[4,6],[5,3],[5,5]],white:[[2,3],[2,5],[3,2],[3,6],[4,3],[4,5],[5,2],[5,6],[6,3],[6,5]]},answer:[3,4],explanation:'黑1走(3,4)，左右对称棋形的正中位置，恰好将空间一分为二形成两眼。"左右同形走中间"是经典棋谚。'}
]}
]},
{ id:'semeai', title:'第三章：对杀与手筋', icon:'⚔️', lessons:[
{ id:'semeai-basics', title:'3.1 对杀气数', teaching:'<strong>对杀</strong>：双方棋子互相包围，都不能做活，比谁气长。对杀的核心是<strong>数气</strong>——准确算出双方的气数，气多者胜。<br><br>📌 <strong>口诀：</strong>"长气杀短气，有眼杀无眼"——气长者胜，有眼的一方通常更有利。',
 problems:[
  {name:'练习19：简单对杀',desc:'黑先，对杀中快一气取胜',cat:'一步题',size:9,color:1,setup:{black:[[2,1],[3,0],[3,2],[4,1]],white:[[2,0],[2,2],[3,1]]},answer:[1,1],explanation:'黑1紧气(1,1)，白棋三子只剩一口气而黑棋有两气，黑棋快一气取胜。对杀中谁先动手往往是关键。'},
  {name:'练习20：延气',desc:'黑先，延长己方气数然后对杀',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[3,1],[3,3],[4,2]],white:[[1,2],[2,1],[2,3],[3,2]]},answer:[2,2],explanation:'黑1先延气。在对杀中，有时需要先走一步延气（不是直接紧对方的气），再回头来收气。"长气"是对杀的进阶技巧。'},
  {name:'练习21：有眼杀无眼',desc:'黑先，利用眼位在对杀中获胜',cat:'多步题',size:9,color:1,setup:{black:[[2,2],[2,4],[3,1],[3,3],[3,5],[4,2],[4,4]],white:[[1,2],[1,4],[2,1],[2,5],[3,0],[3,6],[4,1],[4,5]]},answer:[3,2],sequence:[[3,2],[2,3]],explanation:'黑1做眼(3,2)，形成"有眼杀无眼"的局面。有眼的一方气数通常更多，在对杀中占有绝对优势。'}
]},
{ id:'tesuji', title:'3.2 经典手筋', teaching:'<strong>手筋</strong>：围棋中巧妙有效的局部手段。常见手筋包括：枷吃（罩住对方）、倒扑（送吃后反吃）、接不归（对方想接却接不回去）等。<br><br>📌 <strong>要点：</strong>手筋的关键在于"巧"而非"力"，用最小的代价达到最大的效果。',
 problems:[
  {name:'练习22：枷吃',desc:'黑先，用枷吃（虚枷）罩住白棋',cat:'一步题',size:9,color:1,setup:{black:[[3,1],[3,5],[4,3],[5,2],[5,4]],white:[[3,3],[4,2],[4,4]]},answer:[3,2],explanation:'黑1虚枷(3,2)，像撒网一样罩住白棋。白棋无论怎么冲都会撞到黑棋的包围网。枷吃的精髓在于"不直接打吃而让对方无处可逃"。'},
  {name:'练习23：倒扑',desc:'黑先，用倒扑（送吃后反吃）吃白',cat:'一步题',size:9,color:1,setup:{black:[[1,2],[2,1],[2,4],[3,3],[4,2]],white:[[2,2],[2,3],[3,2],[3,4],[4,3]]},answer:[1,3],explanation:'黑1送入虎口(1,3)！白棋提掉这枚黑子后，黑棋立刻在原位回提反吃更多白子。倒扑是先舍后得的精妙手筋。'},
  {name:'练习24：接不归',desc:'黑先，利用接不归吃掉白棋尾巴',cat:'一步题',size:9,color:1,setup:{black:[[2,2],[2,4],[3,1],[3,3],[4,2]],white:[[2,3],[3,2],[4,1],[4,3]]},answer:[2,1],explanation:'黑1断打(2,1)，白棋右边几子处于被打吃状态且气不够，想接却接不回来。这就是"接不归"——看似能接，实则接不住。'}
]},
{ id:'ko', title:'3.3 劫争入门', teaching:'<strong>劫</strong>：双方可以反复提对方的棋形。围棋规则规定：一方提劫后，另一方不能立刻回提（必须在别处下一手才能回来提），这就是"打劫"。<br><br>📌 <strong>要点：</strong>打劫需要"劫材"（别处有价值的棋）来支撑。劫材多的一方在劫争中占优。',
 problems:[
  {name:'练习25：制造劫争',desc:'黑先，制造劫争吃掉白角',cat:'多步题',size:9,color:1,setup:{black:[[0,2],[1,1],[1,3],[2,0],[2,4],[3,1],[3,3]],white:[[1,0],[1,2],[2,1],[2,2],[2,3],[3,2]]},answer:[0,1],sequence:[[0,1],[0,0],[1,0]],explanation:'黑1扑(0,1)开劫！白2提劫，黑3需要找劫材后回提。制造劫争是扭转局势的重要手段，但需要计算劫材的多少。'},
  {name:'练习26：滚打包收',desc:'黑先，连续滚打收气吃白',cat:'多步题',size:9,color:1,setup:{black:[[2,2],[2,4],[3,1],[3,5],[4,3]],white:[[2,3],[3,2],[3,3],[3,4],[4,2],[4,4]]},answer:[4,1],sequence:[[4,1],[3,1],[4,0]],explanation:'黑1打吃(4,1)，白2粘(3,1)，黑3继续打……像滚雪球一样将白棋"包收"吃掉。滚打包收是最有气势的连续进攻手筋！'},
  {name:'练习27：金鸡独立',desc:'黑先，利用金鸡独立杀白',cat:'多步题',size:9,color:1,setup:{black:[[1,2],[2,1],[2,4],[3,3],[4,2]],white:[[1,3],[2,2],[2,3],[3,1],[3,2],[4,1]]},answer:[1,1],sequence:[[1,1],[1,0],[2,0]],explanation:'黑1立(1,1)形成"金鸡独立"！白棋两边都不能入子——左侧气紧、右侧被控。这是边角对杀中最精彩的杀招之一。'}
]}
]}
];

// ==================== 通用围棋棋盘类 ====================
class GoBoard {
    constructor(canvasId, size, cellSize, padding) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.size = size;
        this.cellSize = cellSize;
        this.padding = padding;
        this.board = Array(size).fill(null).map(() => Array(size).fill(0));
        this.lastMove = null;
        this.highlights = [];
        this.marks = [];
        this.territoryHints = [];
    }

    resizeCanvas() {
        const total = this.padding * 2 + (this.size - 1) * this.cellSize;
        this.canvas.width = total;
        this.canvas.height = total;
    }

    getIntersection(ex, ey) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        const x = (ex - rect.left) * scale;
        const y = (ey - rect.top) * scale;
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        return [row, col];
    }

    draw(extra = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 棋盘背景
        ctx.fillStyle = '#dcb468';
        ctx.fillRect(0, 0, w, h);

        // 网格线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.8;
        const p = this.padding;
        const end = p + (this.size - 1) * this.cellSize;
        for (let i = 0; i < this.size; i++) {
            const pos = p + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(p, pos);
            ctx.lineTo(end, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, p);
            ctx.lineTo(pos, end);
            ctx.stroke();
        }

        // 星位点
        const stars = this.getStarPoints();
        for (const [r, c] of stars) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(p + c * this.cellSize, p + r * this.cellSize, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 坐标标注
        ctx.fillStyle = '#555';
        ctx.font = `${Math.max(10, this.cellSize * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelOffset = this.cellSize * 0.35;
        const letters = this.size <= 13 ? 'ABCDEFGHIJKLMNOPQRS'.slice(0, this.size) : '';
        if (letters) {
            for (let i = 0; i < this.size; i++) {
                ctx.fillText(letters[i], p + i * this.cellSize, p - labelOffset);
                ctx.fillText(String(this.size - i), p - labelOffset, p + i * this.cellSize);
            }
        }

        // 领土提示（半透明色块）
        for (const [r, c, color] of this.territoryHints) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            ctx.fillStyle = color === 1 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)';
            ctx.fillRect(x - this.cellSize * 0.35, y - this.cellSize * 0.35,
                this.cellSize * 0.7, this.cellSize * 0.7);
        }

        // 高亮格子
        for (const [r, c, style] of this.highlights) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            ctx.fillStyle = style || 'rgba(255, 200, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, this.cellSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // 标记（三角、方块等）
        for (const [r, c, type] of this.marks) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            const s = this.cellSize * 0.2;
            ctx.fillStyle = '#c0392b';
            if (type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(x, y - s);
                ctx.lineTo(x - s, y + s * 0.8);
                ctx.lineTo(x + s, y + s * 0.8);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'square') {
                ctx.fillRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
            } else if (type === 'circle') {
                ctx.beginPath();
                ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 棋子
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) continue;
                const x = p + c * this.cellSize;
                const y = p + r * this.cellSize;
                const radius = this.cellSize * 0.44;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                if (this.board[r][c] === 1) {
                    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    grad.addColorStop(0, '#555');
                    grad.addColorStop(1, '#111');
                    ctx.fillStyle = grad;
                } else {
                    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    grad.addColorStop(0, '#fff');
                    grad.addColorStop(1, '#ccc');
                    ctx.fillStyle = grad;
                }
                ctx.fill();
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // 最后落子标记
        if (this.lastMove && extra.showLastMove !== false) {
            const [lr, lc] = this.lastMove;
            const x = p + lc * this.cellSize;
            const y = p + lr * this.cellSize;
            const markColor = this.board[lr][lc] === 1 ? '#fff' : '#333';
            ctx.fillStyle = markColor;
            ctx.beginPath();
            ctx.arc(x, y, this.cellSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getStarPoints() {
        if (this.size === 9) return [[2,2],[2,6],[4,4],[6,2],[6,6]];
        if (this.size === 13) return [[3,3],[3,9],[6,6],[9,3],[9,9]];
        if (this.size === 19) return [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];
        if (this.size <= 9) return [[Math.floor(this.size/2), Math.floor(this.size/2)]];
        const q = Math.floor(this.size / 4);
        const m = Math.floor(this.size / 2);
        return [[q,q],[q,this.size-1-q],[m,m],[this.size-1-q,q],[this.size-1-q,this.size-1-q]];
    }
}

// ==================== Go AI（轻量 Monte Carlo） ====================
class GoAI {
    constructor(boardObj) {
        this.boardObj = boardObj;
    }

    getNeighbors(board, row, col) {
        const n = [];
        const size = board.length;
        if (row > 0) n.push([row - 1, col]);
        if (row < size - 1) n.push([row + 1, col]);
        if (col > 0) n.push([row, col - 1]);
        if (col < size - 1) n.push([row, col + 1]);
        return n;
    }

    getGroup(board, row, col) {
        const color = board[row][col];
        if (color === 0) return [];
        const group = [];
        const visited = new Set();
        const stack = [[row, col]];
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = r + ',' + c;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([r, c]);
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === color && !visited.has(nr + ',' + nc)) stack.push([nr, nc]);
            }
        }
        return group;
    }

    countLiberties(board, group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === 0) liberties.add(nr + ',' + nc);
            }
        }
        return liberties.size;
    }

    isSuicide(board, row, col, color) {
        const opponent = color === 1 ? 2 : 1;
        for (const [nr, nc] of this.getNeighbors(board, row, col)) {
            if (board[nr][nc] === opponent) {
                if (this.countLiberties(board, this.getGroup(board, nr, nc)) === 0) return false;
            }
        }
        board[row][col] = color;
        const alive = this.countLiberties(board, this.getGroup(board, row, col)) > 0;
        board[row][col] = 0;
        return !alive;
    }

    hasNearby(board, row, col) {
        for (const [nr, nc] of this.getNeighbors(board, row, col)) {
            if (board[nr][nc] !== 0) return true;
            for (const [nr2, nc2] of this.getNeighbors(board, nr, nc)) {
                if (board[nr2][nc2] !== 0) return true;
            }
        }
        return false;
    }

    // 获取候选落子（只取附近有棋子的空位 + 随机采样）
    getCandidateMoves(board, color, koPoint, maxCandidates) {
        const size = board.length;
        const nearMoves = [];
        const farMoves = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] !== 0) continue;
                if (koPoint && koPoint[0] === r && koPoint[1] === c) continue;
                if (this.hasNearby(board, r, c)) {
                    nearMoves.push([r, c]);
                } else {
                    farMoves.push([r, c]);
                }
            }
        }
        // 洗牌
        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };
        shuffle(nearMoves);
        shuffle(farMoves);
        // 合并：附近棋子优先，限制总数
        let candidates = nearMoves.concat(farMoves);
        const limit = maxCandidates || (size <= 9 ? 30 : 20);
        if (candidates.length > limit) candidates = candidates.slice(0, limit);

        // 过滤自杀
        return candidates.filter(([r, c]) => !this.isSuicide(board, r, c, color));
    }

    // 快速模拟一局（限制步数）
    quickSim(board, startColor, koPoint, maxSteps) {
        const size = board.length;
        let simBoard = board.map(r => [...r]);
        let color = startColor;
        let ko = koPoint ? [koPoint[0], koPoint[1]] : null;
        let passes = 0;
        const steps = maxSteps || Math.min(50, size * 3);

        for (let s = 0; s < steps; s++) {
            // 简单取合法落子（不复制棋盘）
            const legals = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (simBoard[r][c] !== 0) continue;
                    if (ko && ko[0] === r && ko[1] === c) continue;
                    if (this.isSuicide(simBoard, r, c, color)) continue;
                    legals.push([r, c]);
                }
            }
            // 只在附近有棋子的位置中选
            const near = legals.filter(([r, c]) => this.hasNearby(simBoard, r, c));
            const picks = near.length > 0 ? near : legals;

            if (picks.length === 0) {
                passes++;
                if (passes >= 2) break;
                color = color === 1 ? 2 : 1;
                ko = null;
                continue;
            }
            passes = 0;
            const [r, c] = picks[Math.floor(Math.random() * picks.length)];

            // 执行落子 + 提子
            simBoard[r][c] = color;
            const opp = color === 1 ? 2 : 1;
            let newKo = null;
            for (const [nr, nc] of this.getNeighbors(simBoard, r, c)) {
                if (simBoard[nr][nc] === opp) {
                    const grp = this.getGroup(simBoard, nr, nc);
                    if (this.countLiberties(simBoard, grp) === 0) {
                        for (const [gr, gc] of grp) simBoard[gr][gc] = 0;
                        if (grp.length === 1) newKo = [grp[0][0], grp[0][1]];
                    }
                }
            }
            ko = newKo;
            color = opp;
        }

        // 快速计分：只数子
        let bs = 0, ws = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (simBoard[r][c] === 1) bs++;
                else if (simBoard[r][c] === 2) ws++;
            }
        }
        ws += 6.5;
        return bs > ws ? 1 : (ws > bs ? 2 : 0);
    }

    // 评估候选落子
    evaluateMoves(board, color, koPoint, numPlayouts) {
        const candidates = this.getCandidateMoves(board, color, koPoint, 25);
        if (candidates.length === 0) return [];

        const n = numPlayouts || 10;
        const results = [];
        const opponent = color === 1 ? 2 : 1;
        const maxSteps = Math.min(40, board.length * 2);

        for (const [r, c] of candidates) {
            // 应用落子
            const simStart = board.map(row => [...row]);
            simStart[r][c] = color;
            let newKo = null;
            for (const [nr, nc] of this.getNeighbors(simStart, r, c)) {
                if (simStart[nr][nc] === opponent) {
                    const grp = this.getGroup(simStart, nr, nc);
                    if (this.countLiberties(simStart, grp) === 0) {
                        for (const [gr, gc] of grp) simStart[gr][gc] = 0;
                        if (grp.length === 1) newKo = [grp[0][0], grp[0][1]];
                    }
                }
            }

            let wins = 0;
            for (let i = 0; i < n; i++) {
                if (this.quickSim(simStart, opponent, newKo, maxSteps) === color) wins++;
            }
            results.push({ row: r, col: c, winRate: wins / n });
        }
        results.sort((a, b) => b.winRate - a.winRate);
        return results;
    }

    getBestMove(board, color, koPoint, numPlayouts) {
        const ev = this.evaluateMoves(board, color, koPoint, numPlayouts);
        if (ev.length === 0) return null;
        return [ev[0].row, ev[0].col, ev[0].winRate];
    }

    estimateWinRate(board, koPoint, numPlayouts) {
        const n = numPlayouts || 8;
        let blackWins = 0;
        for (let i = 0; i < n; i++) {
            if (this.quickSim(board, 1, koPoint, 30) === 1) blackWins++;
        }
        return { blackRate: blackWins / n, whiteRate: 1 - blackWins / n };
    }
}

// ==================== 围棋教程练习模式 ====================
class GoPractice {
    constructor() {
        this.chapterIdx = 0;
        this.lessonIdx = 0;
        this.puzzleIdx = 0;
        this.board = new GoBoard('goPracticeBoard', 9, 60, 40);
        this.board.resizeCanvas();
        this.solved = false;
        this.completedLessons = this.loadProgress();

        // 绑定事件
        document.getElementById('goPrevPuzzle').addEventListener('click', () => this.navPuzzle(-1));
        document.getElementById('goNextPuzzle').addEventListener('click', () => this.navPuzzle(1));
        document.getElementById('goResetPuzzle').addEventListener('click', () => this.resetPuzzle());
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.renderChapters();
        this.renderLessons();
        this.loadPuzzle();
    }

    // 进度存储
    loadProgress() {
        try { return JSON.parse(localStorage.getItem('go_tutorial_progress') || '{}'); }
        catch(e) { return {}; }
    }
    saveProgress() {
        const key = `${this.chapterIdx}-${this.lessonIdx}`;
        this.completedLessons[key] = true;
        localStorage.setItem('go_tutorial_progress', JSON.stringify(this.completedLessons));
    }

    get chapter() { return GO_CHAPTERS[this.chapterIdx]; }
    get lesson() { return this.chapter.lessons[this.lessonIdx]; }
    get puzzle() { return this.lesson.problems[this.puzzleIdx]; }

    renderChapters() {
        const el = document.getElementById('chapterTabs');
        el.innerHTML = GO_CHAPTERS.map((ch, i) =>
            `<button class="btn btn-sm chapter-tab${i===this.chapterIdx?' active':''}" data-ci="${i}">${ch.icon} ${ch.title}</button>`
        ).join('');
        el.querySelectorAll('.chapter-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.chapterIdx = parseInt(btn.getAttribute('data-ci'));
                this.lessonIdx = 0;
                this.puzzleIdx = 0;
                this.renderChapters();
                this.renderLessons();
                this.loadPuzzle();
            });
        });
    }

    renderLessons() {
        const el = document.getElementById('lessonTabs');
        el.innerHTML = this.chapter.lessons.map((ls, i) => {
            const key = `${this.chapterIdx}-${i}`;
            const done = this.completedLessons[key] ? ' done' : '';
            return `<button class="btn btn-sm lesson-tab${i===this.lessonIdx?' active':''}${done}" data-li="${i}">${ls.title}</button>`;
        }).join('');
        el.querySelectorAll('.lesson-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.lessonIdx = parseInt(btn.getAttribute('data-li'));
                this.puzzleIdx = 0;
                this.renderLessons();
                this.loadPuzzle();
            });
        });
    }

    loadPuzzle() {
        this.solved = false;
        const p = this.puzzle;
        this.board.size = p.size;
        this.board.cellSize = 60;
        this.board.padding = 40;
        this.board.resizeCanvas();
        this.board.board = Array(p.size).fill(null).map(() => Array(p.size).fill(0));
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];
        this.board.territoryHints = [];
        for (const [r,c] of p.setup.black) this.board.board[r][c] = 1;
        for (const [r,c] of p.setup.white) this.board.board[r][c] = 2;
        this.board.marks = p.setup.white.slice(-2).map(([r,c])=>[r,c,'triangle']);

        // 更新 UI
        const total = this.lesson.problems.length;
        document.getElementById('practiceTitle').textContent = `【${p.cat || '练习题'}】${p.name} (${this.puzzleIdx+1}/${total})`;
        document.getElementById('practiceDesc').textContent = p.desc;
        document.getElementById('practiceProgress').textContent = `${this.puzzleIdx+1}/${total}`;
        document.getElementById('practiceResult').textContent = '';
        document.getElementById('practiceResult').className = 'practice-result';
        document.getElementById('practiceExplanation').style.display = 'none';

        // 教学文案
        const tb = document.getElementById('teachingBox');
        const tt = document.getElementById('teachingText');
        if (this.lesson.teaching) {
            tt.innerHTML = this.lesson.teaching;
            tb.style.display = 'block';
        } else {
            tb.style.display = 'none';
        }

        document.getElementById('goPrevPuzzle').disabled = this.puzzleIdx === 0;
        document.getElementById('goNextPuzzle').disabled = this.puzzleIdx >= total - 1;

        this.board.draw();
    }

    navPuzzle(dir) {
        const newIdx = this.puzzleIdx + dir;
        const total = this.lesson.problems.length;
        if (newIdx < 0 || newIdx >= total) return;
        this.puzzleIdx = newIdx;
        this.loadPuzzle();
    }

    resetPuzzle() { this.loadPuzzle(); }

    handleClick(e) {
        if (this.solved) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.board.board[row][col] !== 0) return;

        const p = this.puzzle;
        const [ar, ac] = p.answer;
        this.board.board[row][col] = p.color;
        this.board.lastMove = [row, col];
        this.board.draw();

        setTimeout(() => {
            if (row === ar && col === ac) {
                this.solved = true;
                document.getElementById('practiceResult').textContent = '✅ 正确！';
                document.getElementById('practiceResult').className = 'practice-result success';
                this.board.highlights = [[row, col, 'rgba(39,174,96,0.5)']];
                this.showExplanation(p);
                if (p.sequence && p.sequence.length > 0) this.demoSequence(p);
                // 标记课时完成
                if (this.puzzleIdx >= this.lesson.problems.length - 1) {
                    this.saveProgress();
                    this.renderLessons();
                }
            } else {
                document.getElementById('practiceResult').textContent = '❌ 不对，再试试！';
                document.getElementById('practiceResult').className = 'practice-result fail';
                this.board.board[row][col] = 0;
                this.board.lastMove = null;
                this.board.highlights = [[row, col, 'rgba(231,76,60,0.4)']];
                setTimeout(() => { this.board.highlights = []; this.board.draw(); }, 800);
            }
            this.board.draw();
        }, 200);
    }

    showExplanation(p) {
        const el = document.getElementById('practiceExplanation');
        if (p.explanation) {
            el.innerHTML = `<strong>📝 解析：</strong>${p.explanation}`;
            el.style.display = 'block';
        }
    }

    demoSequence(p) {
        const color = p.color, opp = color===1?2:1;
        let delay = 600;
        p.sequence.forEach(([r,c], i) => {
            setTimeout(() => {
                this.board.board[r][c] = i%2===0?opp:color;
                this.board.lastMove = [r,c];
                this.board.highlights = [[r,c,i%2===0?'rgba(255,255,255,0.7)':'rgba(39,174,96,0.5)']];
                this.board.draw();
            }, delay);
            delay += 600;
        });
        setTimeout(() => { this.board.highlights = []; this.board.draw(); }, delay);
    }
}

// ==================== AI 对战模式 ====================
class GoAIGame {
    constructor() {
        this.size = 13;
        this.playerColor = 2; // 玩家执白
        this.aiColor = 1;
        this.board = new GoBoard('goAIBoard', this.size, 44, 36);
        this.board.resizeCanvas();
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.koPoint = null;
        this.currentTurn = 1; // 黑先
        this.gameOver = false;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.ai = new GoAI(this.board);
        this.aiThinking = false;
        this.moveHistory = [];

        document.getElementById('goAINewGame').addEventListener('click', () => this.newGame());
        document.getElementById('goAIPass').addEventListener('click', () => this.pass());
        document.getElementById('goAIHint').addEventListener('click', () => this.showHint());
        document.getElementById('goBoardSize').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });
        document.getElementById('goAIColor').addEventListener('change', (e) => {
            this.playerColor = e.target.value === 'black' ? 1 : 2;
            this.aiColor = this.playerColor === 1 ? 2 : 1;
            this.newGame();
        });
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.newGame();
    }

    newGame() {
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.board.board = this.goBoardData;
        this.board.size = this.size;
        this.board.cellSize = this.size <= 9 ? 60 : (this.size <= 13 ? 44 : 30);
        this.board.padding = this.size <= 9 ? 40 : (this.size <= 13 ? 36 : 30);
        this.board.resizeCanvas();
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];
        this.board.territoryHints = [];
        this.koPoint = null;
        this.currentTurn = 1;
        this.gameOver = false;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.moveHistory = [];
        document.getElementById('goHintDisplay').style.display = 'none';
        document.getElementById('goAITurn').textContent = '⚫ AI 思考中...';
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.draw();

        // 如果 AI 执黑，自动下第一步
        if (this.aiColor === 1) {
            setTimeout(() => this.aiMove(), 300);
        }
    }

    handleClick(e) {
        if (this.gameOver) return;
        if (this.aiThinking) return;
        if (this.currentTurn !== this.playerColor) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.goBoardData[row][col] !== 0) return;
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) return;

        // 落子前检查自杀
        this.goBoardData[row][col] = this.playerColor;
        if (this.ai.isSuicide(this.goBoardData, row, col, this.playerColor)) {
            this.goBoardData[row][col] = 0;
            return;
        }

        // 执行提子
        const opponent = this.aiColor;
        let captured = false;
        for (const [nr, nc] of this.ai.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = this.ai.getGroup(this.goBoardData, nr, nc);
                if (this.ai.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.playerColor] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.currentTurn = this.aiColor;
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.board = this.goBoardData;
        this.board.draw();

        // AI 回应
        if (!this.gameOver) {
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 100);
        }
    }

    aiMove() {
        document.getElementById('goHintDisplay').style.display = 'none';

        // 首手天元
        if (this.moveHistory.length === 0 && this.goBoardData.every(r => r.every(c => c === 0))) {
            const center = Math.floor(this.size / 2);
            this.makeAIMove(center, center);
            return;
        }

        // 轻量 playouts：9×9=15, 13×13=10, 19×19=6
        const playouts = this.size <= 9 ? 15 : (this.size <= 13 ? 10 : 6);
        const result = this.ai.getBestMove(this.goBoardData, this.aiColor, this.koPoint, playouts);

        if (!result) {
            this.passes++;
            if (this.passes >= 2) { this.endGame(); }
            else {
                this.currentTurn = this.playerColor;
                document.getElementById('goAITurn').textContent = this.playerColor === 1 ? '⚫ 你的回合' : '⚪ 你的回合';
                this.aiThinking = false;
                this.koPoint = null;
                this.scheduleWinRateUpdate();
            }
            return;
        }

        const [row, col, winRate] = result;
        this.makeAIMove(row, col);
    }

    makeAIMove(row, col) {
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) {
            this.aiThinking = false;
            return;
        }
        if (this.ai.isSuicide(this.goBoardData, row, col, this.aiColor)) {
            this.aiThinking = false;
            return;
        }

        this.goBoardData[row][col] = this.aiColor;
        const opponent = this.playerColor;
        let captured = false;
        for (const [nr, nc] of this.ai.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = this.ai.getGroup(this.goBoardData, nr, nc);
                if (this.ai.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.aiColor] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.moveHistory.push([row, col]);
        this.currentTurn = this.playerColor;
        document.getElementById('goAITurn').textContent = this.playerColor === 1 ? '⚫ 你的回合' : '⚪ 你的回合';
        this.aiThinking = false;
        this.board.board = this.goBoardData;
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.draw();
    }

    showHint() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;

        document.getElementById('goHintDisplay').textContent = '💡 AI 正在分析...';
        document.getElementById('goHintDisplay').style.display = 'block';

        // 异步计算提示
        setTimeout(() => {
            const playouts = this.size <= 9 ? 12 : (this.size <= 13 ? 8 : 5);
            const ai = new GoAI(this.board);
            const evaluated = ai.evaluateMoves(this.goBoardData, this.playerColor, this.koPoint, playouts);

            if (evaluated.length === 0) {
                document.getElementById('goHintDisplay').textContent = '💡 暂无建议落子位置';
                return;
            }

            const top = evaluated.slice(0, 3);
            const letters = 'ABCDEFGHIJKLMNOPQRS';
            const hints = top.map((m, i) => {
                const letter = letters[m.col] || m.col;
                const num = this.size - m.row;
                return `${['🥇','🥈','🥉'][i]} ${letter}${num} (${Math.round(m.winRate * 100)}%)`;
            }).join('  ');

            document.getElementById('goHintDisplay').textContent = `💡 ${hints}`;
            this.board.highlights = top.map((m, i) =>
                [m.row, m.col, ['rgba(39,174,96,0.6)', 'rgba(52,152,219,0.5)', 'rgba(155,89,182,0.4)'][i]]
            );
            this.board.draw();
        }, 50);
    }

    pass() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
        } else {
            this.currentTurn = this.aiColor;
            this.koPoint = null;
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 150);
        }
    }

    scheduleWinRateUpdate() {
        // 延迟更新胜率，不阻塞 UI
        setTimeout(() => {
            if (this.aiThinking || this.gameOver) return;
            const ai = new GoAI(this.board);
            const rate = ai.estimateWinRate(this.goBoardData, this.koPoint, this.size <= 9 ? 10 : 6);
            const bp = Math.round(rate.blackRate * 100);
            const wp = Math.round(rate.whiteRate * 100);
            document.getElementById('wrBlack').textContent = bp + '%';
            document.getElementById('wrWhite').textContent = wp + '%';
            document.getElementById('wrBlackBar').style.width = bp + '%';
        }, 200);
    }

    pass() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
        } else {
            this.currentTurn = this.aiColor;
            this.koPoint = null;
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 100);
        }
    }

    endGame() {
        this.gameOver = true;
        this.aiThinking = false;
        const bs = this.captures[1];
        const ws = this.captures[2] + 6.5;
        const msg = bs > ws ? '🏆 黑方(AI)胜！' : ws > bs ? '🏆 白方(你)胜！' : '🤝 平局！';
        document.getElementById('goAITurn').textContent = msg;
        document.getElementById('goHintDisplay').style.display = 'none';
        setTimeout(() => alert(msg + '\n黑方提子: ' + this.captures[1] + '\n白方提子: ' + this.captures[2] + '\n白方贴目 6.5'), 100);
    }

    updateScore() {
        document.getElementById('goAIScore').textContent =
            `黑 ${this.captures[1]} : ${this.captures[2]} 白`;
    }
}

// ==================== 双人对弈模式 ====================
class GoPVPGame {
    constructor() {
        this.size = 9;
        this.board = new GoBoard('goPVPBoard', this.size, 60, 40);
        this.board.resizeCanvas();
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.koPoint = null;
        this.currentPlayer = 1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.gameOver = false;

        document.getElementById('goPVPNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('goPVPPass').addEventListener('click', () => this.pass());
        document.getElementById('goPVPSize').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.newGame();
    }

    newGame() {
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.board.board = this.goBoardData;
        this.board.size = this.size;
        this.board.cellSize = this.size <= 9 ? 60 : (this.size <= 13 ? 44 : 30);
        this.board.padding = this.size <= 9 ? 40 : (this.size <= 13 ? 36 : 30);
        this.board.resizeCanvas();
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];
        this.board.territoryHints = [];
        this.koPoint = null;
        this.currentPlayer = 1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.gameOver = false;
        this.updateUI();
        this.board.draw();
    }

    handleClick(e) {
        if (this.gameOver) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.goBoardData[row][col] !== 0) return;
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) return;

        const opponent = this.currentPlayer === 1 ? 2 : 1;
        this.goBoardData[row][col] = this.currentPlayer;

        // 检查自杀（使用共享 AI 类）
        const sharedAI = new GoAI(this.board);
        if (sharedAI.isSuicide(this.goBoardData, row, col, this.currentPlayer)) {
            this.goBoardData[row][col] = 0;
            return;
        }

        let captured = false;
        for (const [nr, nc] of sharedAI.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = sharedAI.getGroup(this.goBoardData, nr, nc);
                if (sharedAI.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.currentPlayer] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.currentPlayer = opponent;
        this.board.board = this.goBoardData;
        this.updateUI();
        this.board.draw();
    }

    pass() {
        if (this.gameOver) return;
        this.passes++;
        if (this.passes >= 2) {
            this.gameOver = true;
            const bs = this.captures[1];
            const ws = this.captures[2] + 6.5;
            const msg = bs > ws ? '🏆 黑方胜！' : ws > bs ? '🏆 白方胜！' : '🤝 平局！';
            setTimeout(() => alert(msg + '\n黑方提子: ' + this.captures[1] + '\n白方提子: ' + this.captures[2] + '\n白方贴目 6.5'), 100);
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.koPoint = null;
            this.updateUI();
            this.board.draw();
        }
    }

    updateUI() {
        document.getElementById('goPVPTurn').textContent =
            this.currentPlayer === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
        document.getElementById('goPVPScore').textContent =
            `黑 ${this.captures[1]} : ${this.captures[2]} 白`;
    }
}

// ==================== 主控制器 ====================
class GoGame {
    constructor() {
        this.mode = 'practice';
        this.practice = null;
        this.aiGame = null;
        this.pvpGame = null;

        // Tab 切换
        document.querySelectorAll('.go-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.getAttribute('data-gotab');
                this.switchMode(mode);
            });
        });

        this.switchMode('practice');
    }

    switchMode(mode) {
        this.mode = mode;

        document.querySelectorAll('.go-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-gotab') === mode);
        });
        document.querySelectorAll('.go-sub-panel').forEach(p => p.classList.remove('active'));

        switch (mode) {
            case 'practice':
                document.getElementById('goPanelPractice').classList.add('active');
                if (!this.practice) this.practice = new GoPractice();
                break;
            case 'ai':
                document.getElementById('goPanelAI').classList.add('active');
                if (!this.aiGame) this.aiGame = new GoAIGame();
                break;
            case 'pvp':
                document.getElementById('goPanelPVP').classList.add('active');
                if (!this.pvpGame) this.pvpGame = new GoPVPGame();
                break;
        }
    }
}
