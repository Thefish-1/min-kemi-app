import { ATOM_DEFS, PREBUILT_MOLECULES } from './data.js';

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

export let atoms = []; export let bonds = []; 
let draggedAtom = null; let dragOffsetX = 0; let dragOffsetY = 0;
// Globala variabler för drag från menyn (används av app.js och canvas.js)
let isMenuDrag = false; let menuDragType = null; let menuDragIsMol = false;
let menuStartX = 0; let menuStartY = 0;

export let lastChangedAtom = null; 
export let isPaused = false;
let showValence = false;
let showPolarity = false;

function resize() { 
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) {
        canvas.width = w; 
        canvas.height = h; 
    }
}
window.addEventListener('resize', resize); resize();

class Atom {
    constructor(type, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.def = ATOM_DEFS[type]; this.type = type;
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.freeUnpaired = this.def.startFree;
        this.freePairs = this.def.startPairs;
        this.inMetallicCluster = false;
    }

    addElectron() {
        if (this.inMetallicCluster) return; 
        if (this.getCurrentElectrons() >= this.def.max) return; 

        if (this.freeUnpaired > 0) {
            this.freeUnpaired--; this.freePairs++;
        } else {
            this.freeUnpaired++; 
        }
    }

    removeElectron() {
        if (this.inMetallicCluster) return;
        let currentFree = this.freeUnpaired + this.freePairs * 2;
        if (currentFree <= 0) return; 

        if (this.freePairs > 0) {
            this.freePairs--; this.freeUnpaired++;
        } else if (this.freeUnpaired > 0) {
            this.freeUnpaired--; 
        }
    }

    get isCation() {
        if (this.inMetallicCluster) return true;
        return this.getCurrentElectrons() === 0;
    }

    get radius() {
        const activeShells = this.def.innerShells.length + (this.isCation ? 0 : 1);
        return 18 + activeShells * 18;
    }

    getCurrentElectrons() {
        if (this.inMetallicCluster) return 0;
        let count = (this.freePairs * 2) + this.freeUnpaired;
        for (let b of bonds) {
            if (b.type === 'metallic') continue;
            if (b.atom1 === this || b.atom2 === this) {
                let other = b.atom1 === this ? b.atom2 : b.atom1;
                if (b.type === 'ionic') {
                    if (this.def.en > other.def.en) count += b.pairs * 2; 
                } else {
                    count += b.pairs * 2; 
                }
            }
        }
        return count;
    }

    isFullShell() {
        if (this.isCation) return true;
        return this.getCurrentElectrons() === this.def.max;
    }

    getChargeInfo() {
        if (this.inMetallicCluster) return { formalCharge: 0, polarShift: 0 }; 

        let valenceBase = this.def.startFree + (this.def.startPairs * 2);
        let currentAssigned = (this.freePairs * 2) + this.freeUnpaired;
        let formalCharge = 0; let polarShift = 0;

        for (let b of bonds) {
            if (b.type === 'metallic') continue;
            if (b.atom1 === this || b.atom2 === this) {
                let other = b.atom1 === this ? b.atom2 : b.atom1;
                let enDiff = this.def.en - other.def.en;
                
                if (b.type === 'ionic') {
                    if (enDiff > 0) currentAssigned += b.pairs * 2; 
                } else {
                    currentAssigned += b.pairs * 1; 
                    polarShift += enDiff * b.pairs;
                }
            }
        }
        formalCharge = valenceBase - currentAssigned;
        return { formalCharge, polarShift };
    }
}

let moleculeUpdateCallback = null;
export function setMoleculeUpdateCallback(fn) {
    moleculeUpdateCallback = fn;
}

// Logik för att "sparka igång" en ändring. 
// updateMoleculeInfo definieras i app.js men anropas härifrån.
function triggerChange(atom) {
    lastChangedAtom = atom; 
    if (moleculeUpdateCallback) moleculeUpdateCallback();
}

function removeAtom(atomToRemove) {
    bonds = bonds.filter(b => {
        if (b.atom1 === atomToRemove || b.atom2 === atomToRemove) {
            if (b.type !== 'metallic') {
                let other = b.atom1 === atomToRemove ? b.atom2 : b.atom1;
                if (b.dative) {
                    if (other === b.donor) {
                        other.freePairs++;
                        other.freeUnpaired += (b.pairs - 1); 
                    } else {
                        if (b.acceptorPaired && other.freePairs > 0) {
                            other.freePairs--;
                            other.freeUnpaired += 2;
                        }
                        other.freeUnpaired += (b.pairs - 1);
                    }
                } else {
                    other.freeUnpaired += b.pairs;
                }
            }
            return false; 
        }
        return true; 
    });
    atoms = atoms.filter(a => a !== atomToRemove);
    
    if (lastChangedAtom === atomToRemove) triggerChange(atoms.length > 0 ? atoms[atoms.length - 1] : null);
    else if (moleculeUpdateCallback) moleculeUpdateCallback();
}

export function getMoleculeFromAtom(startAtom) {
    if (!startAtom || !atoms.includes(startAtom)) return [];
    let molecule = []; let queue = [startAtom]; let visited = new Set(); visited.add(startAtom);

    while(queue.length > 0) {
        let curr = queue.shift(); molecule.push(curr);
        for(let b of bonds) {
            let neighbor = null;
            if(b.atom1 === curr) neighbor = b.atom2;
            if(b.atom2 === curr) neighbor = b.atom1;
            if(neighbor && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
        }
    }
    return molecule;
}

function removeMolecule(startAtom) {
    let molAtoms = getMoleculeFromAtom(startAtom);
    molAtoms.forEach(a => removeAtom(a));
}

// Skapar atomer och bindningar - motorn i simuleringen
function spawnMolecule(molKey, cx, cy) {
    const template = PREBUILT_MOLECULES[molKey];
    if (!template) return null;

    let createdAtoms = {};
    let rootAtom = null;

    for (let aDef of template.atoms) {
        let newAtom = new Atom(aDef.type, cx + aDef.x * 1.5, cy + aDef.y * 1.5);
        atoms.push(newAtom);
        createdAtoms[aDef.id] = newAtom;
        if (!rootAtom) rootAtom = newAtom; 
    }

    if (template.transfers) {
        for (let t of template.transfers) {
            let fromA = createdAtoms[t.from];
            let toA = createdAtoms[t.to];
            if (fromA && toA) {
                fromA.removeElectron(); toA.addElectron();
            }
        }
    }

    if (template.mods) {
        for (let m of template.mods) {
            let a = createdAtoms[m.id];
            if (a) {
                if (m.type === 'add') a.addElectron();
                if (m.type === 'remove') a.removeElectron();
            }
        }
    }

    for (let bDef of template.bonds) {
        let atom1 = createdAtoms[bDef.a1];
        let atom2 = createdAtoms[bDef.a2];
        let pairs = bDef.pairs;

        let bondType = Math.abs(atom1.def.en - atom2.def.en) >= 1.7 ? 'ionic' : 'covalent';
        if(atom1.def.isMetal && atom2.def.isMetal) bondType = 'metallic';

        let bondObj = { atom1: atom1, atom2: atom2, type: bondType, pairs: pairs };

        if (bDef.dative) {
            bondObj.dative = true;
            bondObj.donor = createdAtoms[bDef.donor];
            bondObj.acceptorPaired = bDef.acceptorPaired;
            if (bondObj.donor) bondObj.donor.freePairs--;
            let acceptor = (bondObj.donor === atom1) ? atom2 : atom1;
            if (bondObj.acceptorPaired) {
                acceptor.freeUnpaired -= 2; acceptor.freePairs++;
            }
        } else if (bondType !== 'metallic') {
            atom1.freeUnpaired -= pairs;
            atom2.freeUnpaired -= pairs;
        }
        
        bonds.push(bondObj);
    }

    triggerChange(rootAtom);
    return rootAtom;
}

function tryDativeBond(donor, acceptor) {
    if (donor.freePairs > 0 && acceptor.getCurrentElectrons() <= acceptor.def.max - 2) {
        if (donor.inMetallicCluster || acceptor.inMetallicCluster) return false;
        
        if (acceptor.freeUnpaired >= 2 || acceptor.freeUnpaired === 0) {
            let acceptorPaired = false;
            donor.freePairs--;
            
            if (acceptor.freeUnpaired >= 2) {
                acceptor.freeUnpaired -= 2;
                acceptor.freePairs++;
                acceptorPaired = true;
            }
            
            let bondType = Math.abs(donor.def.en - acceptor.def.en) >= 1.7 ? 'ionic' : 'covalent';
            bonds.push({ 
                atom1: donor, atom2: acceptor, 
                type: bondType, pairs: 1, 
                dative: true, donor: donor, acceptorPaired: acceptorPaired 
            });
            return true;
        }
    }
    return false;
}

function tryBonding(atomA) {
    let bonded = false;
    for (let atomB of atoms) {
        if (atomA === atomB) continue;
        const isMetalA = atomA.def.isMetal; const isMetalB = atomB.def.isMetal;
        const dist = Math.hypot(atomB.x - atomA.x, atomB.y - atomA.y);
        const minDistToBond = atomA.radius + atomB.radius + 45;

        if (dist < minDistToBond) {
            let existingBond = bonds.find(b => 
                (b.atom1 === atomA && b.atom2 === atomB) || (b.atom1 === atomB && b.atom2 === atomA)
            );

            if (isMetalA && isMetalB) {
                if (!existingBond) {
                    bonds.push({ atom1: atomA, atom2: atomB, type: 'metallic', pairs: 1 });
                    bonded = true; break;
                }
            } else {
                if (!existingBond && atomA.freeUnpaired > 0 && atomB.freeUnpaired > 0) {
                    atomA.freeUnpaired--; atomB.freeUnpaired--;
                    let bondType = Math.abs(atomA.def.en - atomB.def.en) >= 1.7 ? 'ionic' : 'covalent';
                    bonds.push({ atom1: atomA, atom2: atomB, type: bondType, pairs: 1 });
                    bonded = true; break; 
                }
                
                if (!existingBond && !bonded) {
                    if (tryDativeBond(atomA, atomB)) { bonded = true; break; }
                    if (tryDativeBond(atomB, atomA)) { bonded = true; break; }
                }
            }
        }
    }
    if (bonded) triggerChange(atomA);
}

// Musrörelse och drag-logik (för både canvas och menu-drag som droppas på canvas)
function handleGlobalMove(e) {
    const evt = e.touches ? e.touches[0] : e;

    if (isMenuDrag || draggedAtom) {
        if (e.cancelable !== false) e.preventDefault();
    }

    if (isMenuDrag && !draggedAtom) {
        if (Math.hypot(evt.clientX - menuStartX, evt.clientY - menuStartY) > 5) {
            const rect = canvas.getBoundingClientRect();
            // Clamp spawn-positionen så den hamnar innanför canvasen direkt
            const startX = Math.max(20, Math.min(canvas.width - 20, evt.clientX - rect.left));
            const startY = Math.max(20, Math.min(canvas.height - 20, evt.clientY - rect.top));

            if (menuDragIsMol) {
                draggedAtom = spawnMolecule(menuDragType, startX, startY);
            } else {
                let newAtom = new Atom(menuDragType, startX, startY);
                atoms.push(newAtom);
                draggedAtom = newAtom;
            }
            
            dragOffsetX = 0; dragOffsetY = 0;
            if (draggedAtom) triggerChange(draggedAtom);
        }
    } else if (draggedAtom) {
        const rect = canvas.getBoundingClientRect();
        draggedAtom.x = evt.clientX - rect.left + dragOffsetX;
        draggedAtom.y = evt.clientY - rect.top + dragOffsetY;
        tryBonding(draggedAtom);
    }
}

function handleGlobalEnd(e) {
    const evt = e.changedTouches ? e.changedTouches[0] : e;
    
    if (isMenuDrag && !draggedAtom) {
        const cx = canvas.width / 2 + (Math.random() * 40 - 20);
        const cy = canvas.height / 2 + (Math.random() * 40 - 20);
        if (menuDragIsMol) spawnMolecule(menuDragType, cx, cy);
        else {
            let newAtom = new Atom(menuDragType, cx, cy);
            atoms.push(newAtom); triggerChange(newAtom);
        }
    }
    else if (draggedAtom) {
        const rect = canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left; const y = evt.clientY - rect.top;
        
        // Tillåt att släppa objektet "utanför" (t.ex. på menyn) om det är en ny drag från menyn.
        // Annars tas atomen bort om man drar ut den från canvasen.
        if (!isMenuDrag && (x < 0 || x > canvas.width || y < 0 || y > canvas.height)) {
            removeMolecule(draggedAtom);
        }
        else triggerChange(draggedAtom); 
    }
    draggedAtom = null; isMenuDrag = false; menuDragType = null; menuDragIsMol = false;
}

// --- Funktioner för att styra canvas utifrån (från main.js) ---

export function setMenuDrag(type, isMol, startX, startY) {
    menuDragType = type;
    menuDragIsMol = isMol;
    menuStartX = startX;
    menuStartY = startY;
    isMenuDrag = true;
}

export function toggleSimulationPause() {
    isPaused = !isPaused;
    return isPaused;
}

export function resetCanvas() {
    atoms = [];
    bonds = [];
    triggerChange(null);
}

export function setValenceVisibility(visible) {
    showValence = visible;
}

export function setPolarityVisibility(visible) {
    showPolarity = visible;
}


window.addEventListener('mousemove', handleGlobalMove, {passive: false});
window.addEventListener('touchmove', handleGlobalMove, {passive: false});
window.addEventListener('mouseup', handleGlobalEnd);
window.addEventListener('touchend', handleGlobalEnd);

function getAtomAt(x, y) {
    for (let i = atoms.length - 1; i >= 0; i--) { 
        const a = atoms[i];
        if (Math.hypot(a.x - x, a.y - y) < a.radius + 22) return a; 
    }
    return null;
}

function handleCanvasMousedown(e) {
    const evt = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    let clickedAtom = getAtomAt(evt.clientX - rect.left, evt.clientY - rect.top);
    
    if (clickedAtom) {
        if ((e.ctrlKey || e.metaKey) && e.button === 0) {
            clickedAtom.addElectron(); triggerChange(clickedAtom);
            if (e.cancelable !== false && e.type === 'touchstart') e.preventDefault();
            return; 
        }

        if (e.cancelable !== false && e.type === 'touchstart') e.preventDefault();
        dragOffsetX = clickedAtom.x - (evt.clientX - rect.left); 
        dragOffsetY = clickedAtom.y - (evt.clientY - rect.top);
        clickedAtom.vx = 0; clickedAtom.vy = 0; draggedAtom = clickedAtom;
        triggerChange(clickedAtom); 
    }
}

canvas.addEventListener('mousedown', handleCanvasMousedown);
canvas.addEventListener('touchstart', handleCanvasMousedown, {passive: false});

canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    let clickedAtom = getAtomAt(e.clientX - rect.left, e.clientY - rect.top);
    if (clickedAtom) { removeAtom(clickedAtom); draggedAtom = null; }
});

function distToSegmentSquared(p, v, w) {
    let l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
    let t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
}

function getBondAt(x, y) {
    for (let b of bonds) {
        if (distToSegmentSquared({x, y}, b.atom1, b.atom2) < 500) return b;
    }
    return null;
}

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); 
    const rect = canvas.getBoundingClientRect();
    
    let clickedAtom = getAtomAt(e.clientX - rect.left, e.clientY - rect.top);
    if (clickedAtom && (e.ctrlKey || e.metaKey)) {
        clickedAtom.removeElectron(); triggerChange(clickedAtom); return;
    }

    let clickedBond = getBondAt(e.clientX - rect.left, e.clientY - rect.top);
    if (clickedBond) {
        const a = clickedBond.atom1; 
        if (clickedBond.type === 'metallic') {
            bonds = bonds.filter(b => b !== clickedBond);
        } else {
            const c = clickedBond.atom2;
            let canIncrease = clickedBond.pairs < 3 && a.freeUnpaired > 0 && c.freeUnpaired > 0;
            if (canIncrease) {
                clickedBond.pairs++; a.freeUnpaired--; c.freeUnpaired--;
            } else { // Bryt bindning
                if (clickedBond.dative) {
                    clickedBond.donor.freePairs++;
                    let acceptor = (clickedBond.atom1 === clickedBond.donor) ? clickedBond.atom2 : clickedBond.atom1;
                    if (clickedBond.acceptorPaired && acceptor.freePairs > 0) {
                        acceptor.freePairs--;
                        acceptor.freeUnpaired += 2;
                    }
                    let extraPairs = clickedBond.pairs - 1;
                    clickedBond.donor.freeUnpaired += extraPairs;
                    acceptor.freeUnpaired += extraPairs;
                } else {
                    a.freeUnpaired += clickedBond.pairs; c.freeUnpaired += clickedBond.pairs;
                }
                bonds = bonds.filter(b => b !== clickedBond);
            }
        }
        triggerChange(a); 
    }
});

function getMetalClusters() {
    let clusters = []; let visited = new Set();
    for (let a of atoms) {
        if (!a.def.isMetal || visited.has(a)) continue;
        let cluster = []; let queue = [a]; visited.add(a);
        while(queue.length > 0) {
            let curr = queue.shift(); cluster.push(curr);
            for (let b of bonds) {
                if (b.type === 'metallic') {
                    let neighbor = (b.atom1 === curr) ? b.atom2 : (b.atom2 === curr ? b.atom1 : null);
                    if (neighbor && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
                }
            }
        }
        if (cluster.length > 1) clusters.push(cluster);
    }
    return clusters;
}

function updatePhysics() {
    const bondSpringForce = 0.05; const damping = 0.85; 

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const a = atoms[i]; const b = atoms[j];
            const dx = a.x - b.x; const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy); const minIdealDist = a.radius + b.radius + 15;
            
            if (dist > 0 && dist < minIdealDist * 2) { 
                let force = dist < minIdealDist ? (minIdealDist - dist) * 0.1 : 450 / (dist * dist);
                const fx = (dx / dist) * force; const fy = (dy / dist) * force;
                if (a !== draggedAtom) { a.vx += fx; a.vy += fy; }
                if (b !== draggedAtom) { b.vx -= fx; b.vy -= fy; }
            }
        }
    }

    for (let b of bonds) {
        const a = b.atom1; const c = b.atom2;
        const dx = c.x - a.x; const dy = c.y - a.y; const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            let currentTarget;
            if (b.type === 'ionic') currentTarget = a.radius + c.radius + 60; 
            else if (b.type === 'metallic') currentTarget = a.radius + c.radius + 8; 
            else currentTarget = (a.radius + c.radius + 22) - (b.pairs * 9);
            
            const displacement = dist - currentTarget; const force = displacement * bondSpringForce;
            const fx = (dx / dist) * force; const fy = (dy / dist) * force;

            if (a !== draggedAtom) { a.vx += fx; a.vy += fy; }
            if (c !== draggedAtom) { c.vx -= fx; c.vy -= fy; }
        }
    }

    const angularSpringStrength = 0.005;
    for (let i = 0; i < atoms.length; i++) {
        const A = atoms[i]; let neighbors = [];
        for (let b of bonds) {
            if (b.type === 'metallic') continue;
            if (b.atom1 === A && !neighbors.includes(b.atom2)) neighbors.push(b.atom2);
            if (b.atom2 === A && !neighbors.includes(b.atom1)) neighbors.push(b.atom1);
        }

        if (neighbors.length < 2) continue;
        neighbors.sort((n1, n2) => Math.atan2(n1.y - A.y, n1.x - A.x) - Math.atan2(n2.y - A.y, n2.x - A.x));

        let targetAngle = (2 * Math.PI) / neighbors.length; let useWrapAround = true;

        if (A.freePairs > 0) {
            useWrapAround = false; let domains = neighbors.length + A.freePairs;
            if (domains === 4) {
                if (neighbors.length === 2) targetAngle = 104.5 * Math.PI / 180; 
                if (neighbors.length === 3) targetAngle = 107 * Math.PI / 180;   
            } else if (domains === 3) {
                if (neighbors.length === 2) targetAngle = 115 * Math.PI / 180;   
            }
        }

        let numConstraints = useWrapAround ? neighbors.length : neighbors.length - 1;

        for (let j = 0; j < numConstraints; j++) {
            let B = neighbors[j]; let C = neighbors[(j + 1) % neighbors.length];

            let dx1 = B.x - A.x; let dy1 = B.y - A.y; let a1 = Math.atan2(dy1, dx1);
            let dx2 = C.x - A.x; let dy2 = C.y - A.y; let a2 = Math.atan2(dy2, dx2);

            let diff = a2 - a1;
            while (diff < 0) diff += 2 * Math.PI; while (diff > 2 * Math.PI) diff -= 2 * Math.PI;
            if (Math.abs(diff - Math.PI) < 0.01 && targetAngle !== Math.PI) diff += 0.05;

            let deltaAngle = targetAngle - diff;
            let distC = Math.hypot(dx2, dy2); let txC = -dy2 / distC; let tyC = dx2 / distC;
            let distB = Math.hypot(dx1, dy1); let txB = dy1 / distB; let tyB = -dx1 / distB;

            let forceC = deltaAngle * angularSpringStrength * distC;
            let forceB = deltaAngle * angularSpringStrength * distB;

            if (C !== draggedAtom) { C.vx += txC * forceC; C.vy += tyC * forceC; }
            if (B !== draggedAtom) { B.vx += txB * forceB; B.vy += tyB * forceB; }
        }
    }

    for (let a of atoms) {
        if (a !== draggedAtom) {
            a.vx *= damping; a.vy *= damping; a.x += a.vx; a.y += a.vy;
            a.x = Math.max(a.radius + 20, Math.min(canvas.width - a.radius - 20, a.x));
            a.y = Math.max(a.radius + 20, Math.min(canvas.height - a.radius - 20, a.y));
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let metallicClusters = getMetalClusters();
    for (let a of atoms) a.inMetallicCluster = false;
    
    for (let cluster of metallicClusters) {
        let cx = 0, cy = 0; let totalFreeValence = 0;
        
        for (let a of cluster) {
            a.inMetallicCluster = true; cx += a.x; cy += a.y; totalFreeValence += a.freeUnpaired; 
        }
        cx /= cluster.length; cy /= cluster.length;

        let maxDist = 0;
        for (let a of cluster) {
            let d = Math.hypot(a.x - cx, a.y - cy);
            if (d + a.radius > maxDist) maxDist = d + a.radius;
        }

        let R = maxDist + 60; 
        let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        grad.addColorStop(0, 'rgba(100, 150, 255, 0.25)'); grad.addColorStop(1, 'rgba(100, 150, 255, 0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#ffff66'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffff66';
        let time = performance.now() * 0.001;
        
        for (let e = 0; e < totalFreeValence; e++) {
            let t = time + e * 13.37;
            let dist = (R - 30) * Math.abs(Math.sin(t * 0.7 + e));
            let angle = t * 1.2 + e * 2.1;
            let ex = cx + Math.cos(angle) * dist; let ey = cy + Math.sin(angle) * dist;
            ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    for (let b of bonds) {
        const a = b.atom1; const c = b.atom2;
        const dx = c.x - a.x; const dy = c.y - a.y;
        const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
        
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(angle);

        const lineStart = a.radius; const lineEnd = dist - c.radius;
        const lineLength = Math.max(0.01, lineEnd - lineStart);
        const enDiff = c.def.en - a.def.en;

        if (b.type === 'metallic') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(lineStart, 0); ctx.lineTo(Math.max(lineStart + 0.01, lineEnd), 0); ctx.stroke();

        } else if (b.type === 'ionic') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.moveTo(lineStart, 0); ctx.lineTo(Math.max(lineStart + 0.01, lineEnd), 0); ctx.stroke();
            ctx.setLineDash([]); 

            const anion = enDiff > 0 ? c : a;
            const anionCenter = enDiff > 0 ? {x: dist, y: 0} : {x: 0, y: 0};
            const r = anion.radius; const baseAngle = enDiff > 0 ? Math.PI : 0;
            
            ctx.fillStyle = '#ffff66'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffff66';
            const spreadAngle = 4.5 / r; 
            
            let pairAngles = [];
            if (b.pairs === 1) pairAngles = [0];
            if (b.pairs === 2) pairAngles = [-0.3, 0.3];
            if (b.pairs === 3) pairAngles = [-0.5, 0, 0.5];

            for (let pAngle of pairAngles) {
                let a1 = baseAngle + pAngle - spreadAngle; let a2 = baseAngle + pAngle + spreadAngle;
                let ex1 = anionCenter.x + Math.cos(a1) * r; let ey1 = anionCenter.y + Math.sin(a1) * r;
                let ex2 = anionCenter.x + Math.cos(a2) * r; let ey2 = anionCenter.y + Math.sin(a2) * r;

                ctx.beginPath(); ctx.arc(ex1, ey1, 4.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2, ey2, 4.5, 0, Math.PI*2); ctx.fill();
            }

        } else {
            const shiftPercent = Math.max(-0.45, Math.min(0.45, enDiff * 0.25)); 
            const bondMidX = lineStart + lineLength / 2 + (lineLength * shiftPercent);
            const spread = 8; let offsets = [];
            if (b.pairs === 1) offsets = [0];
            if (b.pairs === 2) offsets = [-spread/2, spread/2];
            if (b.pairs === 3) offsets = [-spread, 0, spread];

            const cloudWidth = Math.max(0.01, lineLength * 0.35);
            const cloudHeight = Math.max(0.01, (b.pairs * spread) + 12);
            
            ctx.beginPath(); ctx.ellipse(bondMidX, 0, cloudWidth, cloudHeight, 0, 0, Math.PI * 2);
            const cloudGrad = ctx.createRadialGradient(bondMidX, 0, 0, bondMidX, 0, cloudWidth);
            
            if (Math.abs(enDiff) > 0.4) {
                cloudGrad.addColorStop(0, 'rgba(255, 77, 77, 0.3)'); cloudGrad.addColorStop(1, 'rgba(255, 77, 77, 0)');
            } else {
                cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            }
            ctx.fillStyle = cloudGrad; ctx.fill();

            const lineGradient = ctx.createLinearGradient(lineStart, 0, Math.max(lineStart + 0.01, lineEnd), 0);
            if (enDiff > 0.4) {
                lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); lineGradient.addColorStop(1, 'rgba(255, 77, 77, 0.8)'); 
            } else if (enDiff < -0.4) {
                lineGradient.addColorStop(0, 'rgba(255, 77, 77, 0.8)'); lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            } else {
                lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)'); lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            }

            ctx.strokeStyle = lineGradient; ctx.lineWidth = 3;
            for (let off of offsets) {
                ctx.beginPath(); ctx.moveTo(lineStart, off); ctx.lineTo(Math.max(lineStart + 0.01, lineEnd), off); ctx.stroke();
            }

            if (b.dative && b.pairs === 1) {
                const dir = (b.donor === a) ? 1 : -1;
                ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
                ctx.beginPath();
                if (dir === 1) {
                    ctx.moveTo(bondMidX + 12, 0); 
                    ctx.lineTo(bondMidX - 12, 8); 
                    ctx.lineTo(bondMidX - 12, -8);
                } else {
                    ctx.moveTo(bondMidX - 12, 0); 
                    ctx.lineTo(bondMidX + 12, 8); 
                    ctx.lineTo(bondMidX + 12, -8);
                }
                ctx.fill();
            }

            ctx.fillStyle = '#fff'; ctx.shadowBlur = 8; ctx.shadowColor = Math.abs(enDiff) > 0.4 ? '#ff4d4d' : '#fff';
            for (let off of offsets) {
                ctx.beginPath(); ctx.arc(bondMidX - 6, off, 4.5, 0, Math.PI * 2); ctx.arc(bondMidX + 6, off, 4.5, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }

    for (let a of atoms) {
        ctx.save(); ctx.translate(a.x, a.y);

        const nucleusRadius = 18;
        ctx.beginPath(); ctx.arc(0, 0, nucleusRadius, 0, Math.PI * 2); ctx.fillStyle = a.def.color; ctx.fill();
        
        ctx.shadowBlur = 0; ctx.fillStyle = a.def.textColor; ctx.font = 'bold 16px "Segoe UI"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.def.symbol, 0, 0);

        const isCation = a.isCation;
        const shellSpacing = 18; let currentRadius = nucleusRadius + shellSpacing;

        for (let i = 0; i < a.def.innerShells.length; i++) {
            let numElectrons = a.def.innerShells[i];
            
            if (isCation && i === a.def.innerShells.length - 1) {
                ctx.strokeStyle = 'var(--success)'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = 'var(--success)';
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
            }

            ctx.beginPath(); ctx.arc(0, 0, currentRadius, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = '#aaa'; ctx.shadowBlur = 0;
            const numPairs = Math.floor(numElectrons / 2);
            const angleStep = (Math.PI * 2) / Math.max(1, numPairs);
            const spreadAngle = 4 / currentRadius; 

            for(let p = 0; p < numPairs; p++) {
                let baseAngle = p * angleStep - Math.PI / 2; let a1 = baseAngle - spreadAngle;
                ctx.beginPath(); ctx.arc(Math.cos(a1) * currentRadius, Math.sin(a1) * currentRadius, 4, 0, Math.PI*2); ctx.fill();
                let a2 = baseAngle + spreadAngle;
                ctx.beginPath(); ctx.arc(Math.cos(a2) * currentRadius, Math.sin(a2) * currentRadius, 4, 0, Math.PI*2); ctx.fill();
            }

            if (numElectrons % 2 !== 0) {
                let aOdd = numPairs * angleStep - Math.PI / 2;
                ctx.beginPath(); ctx.arc(Math.cos(aOdd) * currentRadius, Math.sin(aOdd) * currentRadius, 4, 0, Math.PI*2); ctx.fill();
            }
            currentRadius += shellSpacing;
        }

        if (!isCation) {
            if (a.isFullShell()) {
                ctx.strokeStyle = 'var(--success)'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = 'var(--success)';
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
            }
            ctx.beginPath(); ctx.arc(0, 0, a.radius, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0; drawFreeElectrons(a);
        }
        ctx.restore();

        if (showValence) {
            let displayE = a.getCurrentElectrons();
            if (isCation) displayE = a.def.innerShells.length > 0 ? a.def.innerShells[a.def.innerShells.length - 1] : 0; 
            
            ctx.fillStyle = a.isFullShell() ? '#4d79ff' : '#ff4d4d';
            ctx.font = '16px "Segoe UI"'; ctx.textAlign = 'center';
            ctx.fillText(`${displayE}/${a.def.max} e-`, a.x, a.y + a.radius + 27);
        }

        const chargeInfo = a.getChargeInfo();
        if (showPolarity && (chargeInfo.formalCharge !== 0 || Math.abs(chargeInfo.polarShift) > 0.45)) {
            
            let labelAngle = -Math.PI / 4; let bX = 0, bY = 0;
            let bCount = 0; let firstBondAngle = 0;

            for (let b of bonds) {
                if (b.type === 'metallic') continue;
                let neighbor = b.atom1 === a ? b.atom2 : (b.atom2 === a ? b.atom1 : null);
                if (neighbor) {
                    let ang = Math.atan2(neighbor.y - a.y, neighbor.x - a.x);
                    bX += Math.cos(ang); bY += Math.sin(ang);
                    if (bCount === 0) firstBondAngle = ang;
                    bCount++;
                }
            }

            if (bCount > 0) {
                if (Math.abs(bX) < 0.01 && Math.abs(bY) < 0.01) labelAngle = firstBondAngle + Math.PI / 2; 
                else labelAngle = Math.atan2(bY, bX) + Math.PI; 
            }

            const labelDist = a.radius + 36; 
            const labelX = a.x + Math.cos(labelAngle) * labelDist;
            const labelY = a.y + Math.sin(labelAngle) * labelDist;

            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

            if (chargeInfo.formalCharge !== 0) {
                const absCharge = Math.abs(chargeInfo.formalCharge);
                const sign = chargeInfo.formalCharge > 0 ? '+' : '-';
                const chargeText = absCharge === 1 ? sign : `${absCharge}${sign}`;
                
                ctx.shadowBlur = 15; ctx.shadowColor = chargeInfo.formalCharge > 0 ? '#4d79ff' : '#ff4d4d';
                ctx.fillStyle = chargeInfo.formalCharge > 0 ? '#4d79ff' : '#ff4d4d';
                ctx.font = `bold 24px "Segoe UI"`; ctx.fillText(chargeText, labelX, labelY); 
                ctx.shadowBlur = 0;
            } else if (Math.abs(chargeInfo.polarShift) > 0.45) {
                const intensity = Math.min(1.5, Math.abs(chargeInfo.polarShift));
                const fontSize = Math.floor(18 + (intensity * 9));
                ctx.shadowBlur = intensity * 10; ctx.shadowColor = chargeInfo.polarShift > 0 ? '#ff4d4d' : '#4d79ff';
                ctx.fillStyle = chargeInfo.polarShift > 0 ? '#ff4d4d' : '#4d79ff'; 
                ctx.font = `bold ${fontSize}px "Segoe UI"`;
                const sign = chargeInfo.polarShift > 0 ? '-' : '+';
                ctx.fillText(`δ${sign}`, labelX, labelY); ctx.shadowBlur = 0; 
            }
        }
    }
}

function drawFreeElectrons(atom) {
    if (atom.inMetallicCluster) return;

    let bondAngles = []; let neighborAtoms = new Set();
    for (let b of bonds) {
        if (b.type === 'metallic') continue;
        if (b.atom1 === atom && !neighborAtoms.has(b.atom2)) { bondAngles.push(Math.atan2(b.atom2.y - atom.y, b.atom2.x - atom.x)); neighborAtoms.add(b.atom2); }
        if (b.atom2 === atom && !neighborAtoms.has(b.atom1)) { bondAngles.push(Math.atan2(b.atom1.y - atom.y, b.atom1.x - atom.x)); neighborAtoms.add(b.atom1); }
    }

    const drawDist = atom.radius; 
    let totalThings = atom.freeUnpaired + atom.freePairs;
    if (totalThings === 0) return;

    if (bondAngles.length === 0) {
        let slots = [-Math.PI/2, 0, Math.PI/2, Math.PI]; let slotIdx = 0;
        for (let i = 0; i < atom.freeUnpaired; i++) {
            let angle = slots[slotIdx++]; ctx.save(); ctx.rotate(angle);
            ctx.beginPath(); ctx.arc(drawDist, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffff66'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffff66'; ctx.fill(); ctx.restore();
        }
        for (let i = 0; i < atom.freePairs; i++) {
            let angle = slots[slotIdx++]; ctx.save(); ctx.rotate(angle);
            ctx.fillStyle = '#ccc'; ctx.shadowBlur = 0; const spreadAngle = 6.5 / drawDist;
            ctx.beginPath(); ctx.arc(Math.cos(-spreadAngle) * drawDist, Math.sin(-spreadAngle) * drawDist, 4, 0, Math.PI*2);
            ctx.arc(Math.cos(spreadAngle) * drawDist, Math.sin(spreadAngle) * drawDist, 4, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        return;
    }

    let avgX = 0, avgY = 0;
    for (let a of bondAngles) { avgX += Math.cos(a); avgY += Math.sin(a); }
    let emptyAngle = (Math.abs(avgX) < 0.01 && Math.abs(avgY) < 0.01) ? bondAngles[0] + Math.PI / 2 : Math.atan2(avgY, avgX) + Math.PI;

    let startAngle = emptyAngle - (totalThings - 1) * 0.35; let currentThing = 0;

    for (let i = 0; i < atom.freePairs; i++) {
        let angle = startAngle + currentThing * 0.7; ctx.save(); ctx.rotate(angle);
        ctx.fillStyle = '#ccc'; ctx.shadowBlur = 0; const spreadAngle = 6.5 / drawDist;
        ctx.beginPath(); ctx.arc(Math.cos(-spreadAngle) * drawDist, Math.sin(-spreadAngle) * drawDist, 4, 0, Math.PI*2);
        ctx.arc(Math.cos(spreadAngle) * drawDist, Math.sin(spreadAngle) * drawDist, 4, 0, Math.PI*2); ctx.fill(); 
        ctx.restore(); currentThing++;
    }

    for (let i = 0; i < atom.freeUnpaired; i++) {
        let angle = startAngle + currentThing * 0.7; ctx.save(); ctx.rotate(angle);
        ctx.beginPath(); ctx.arc(drawDist, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff66'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffff66';
        ctx.fill(); ctx.restore(); currentThing++;
    }
}

function loop() {
    if (canvas.width === 0) resize(); // Säkerställ storlek om init misslyckades
    if (!isPaused) updatePhysics(); 
    draw(); requestAnimationFrame(loop);
}

// Starta loopen (canvas.js är laddad)
loop();
