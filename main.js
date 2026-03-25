import { SINGLE_ATOMS } from './data.js';
import { ATOM_DEFS, PREBUILT_MOLECULES } from './data.js';
import { KNOWN_SUBSTANCES } from './data.js';
import { 
    setMenuDrag, 
    toggleSimulationPause, 
    resetCanvas, 
    setValenceVisibility, 
    setPolarityVisibility, 
    getMoleculeFromAtom,
    setMoleculeUpdateCallback,
    atoms,
    lastChangedAtom
} from './canvas.js';

// --- Menyhantering ---
window.toggleMenu = function(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('.icon');
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.innerText = '▼';
    } else {
        content.classList.add('collapsed');
        icon.innerText = '▶';
    }
}

// --- Starta drag från menyn ---
// Notera: Global funktion som anropas av HTML
window.startDragFromMenu = function(e, type, isMol = false) {
    // Förhindra att webbläsaren markerar text eller startar eget drag-beteende
    if (e.cancelable !== false) e.preventDefault();

    const evt = e.touches ? e.touches[0] : e;
    
    // Anropa canvas.js funktion istället för globala variabler
    setMenuDrag(type, isMol, evt.clientX, evt.clientY);
};

// --- App-specifika funktioner för knappar ---

window.togglePause = function() {
    const isPaused = toggleSimulationPause(); // Hämta ny status från canvas.js
    const btn = document.getElementById('pauseBtn');
    if (isPaused) { btn.innerText = "Spela ▶"; btn.classList.add('paused'); } 
    else { btn.innerText = "Pausa ⏸"; btn.classList.remove('paused'); }
}

window.clearCanvas = function() { 
    resetCanvas();
}

window.updateValence = function(cb) { setValenceVisibility(cb.checked); }
window.updatePolarity = function(cb) { setPolarityVisibility(cb.checked); }


// --- Logik för identifiering och visning av molekyler ---

function getChargeSuffix(charge) {
    if (charge === 0) return "";
    if (charge === 1) return "⁺";
    if (charge === -1) return "⁻";
    
    const superDigits = {"0":"⁰", "1":"¹", "2":"²", "3":"³", "4":"⁴", "5":"⁵", "6":"⁶", "7":"⁷", "8":"⁸", "9":"⁹"};
    let absStr = Math.abs(charge).toString();
    let superStr = "";
    for (let char of absStr) superStr += superDigits[char];
    return superStr + (charge > 0 ? "⁺" : "⁻");
}

function identifyMolecule(molAtoms) {
    let netCharge = 0;
    for (let a of molAtoms) netCharge += a.getChargeInfo().formalCharge;

    if (molAtoms.length === 1) {
        let symbol = molAtoms[0].type;
        let baseName = SINGLE_ATOMS[symbol] || symbol;
        if (netCharge > 0) return { formula: symbol + getChargeSuffix(netCharge), name: baseName + "jon (Katjon)" };
        if (netCharge < 0) return { formula: symbol + getChargeSuffix(netCharge), name: baseName + "jon (Anjon)" };
        return { formula: symbol, name: baseName + "atom" };
    }

    let counts = {};
    for(let a of molAtoms) counts[a.type] = (counts[a.type] || 0) + 1;

    for (let sub of KNOWN_SUBSTANCES) {
        let match = true;
        let subKeys = Object.keys(sub.counts);
        let countKeys = Object.keys(counts);

        if (subKeys.length !== countKeys.length) continue;
        
        let subCharge = sub.charge !== undefined ? sub.charge : 0;
        if (subCharge !== netCharge) continue;

        for (let k of subKeys) {
            if (counts[k] !== sub.counts[k]) { match = false; break; }
        }
        if (match) return { formula: sub.formula, name: sub.name };
    }

    let elements = Object.keys(counts);
    elements.sort((a, b) => {
        if (counts['C']) {
            if (a === 'C' && b !== 'C') return -1;
            if (b === 'C' && a !== 'C') return 1;
            if (a === 'H' && b !== 'H') return -1;
            if (b === 'H' && a !== 'H') return 1;
        }
        return a.localeCompare(b);
    });

    let formula = "";
    for(let el of elements) {
        formula += el;
        if(counts[el] > 1) formula += counts[el];
    }
    formula += getChargeSuffix(netCharge); 

    let isPureMetal = true; let metalType = null;
    for (let a of molAtoms) {
        if (!a.def.isMetal) { isPureMetal = false; break; }
        if (!metalType) metalType = a.def.symbol;
        else if (metalType !== a.def.symbol) { isPureMetal = false; break; }
    }

    let name = netCharge !== 0 ? "Okänd sammansatt jon" : "Okänd förening";
    if (isPureMetal && molAtoms.length > 1) name = ATOM_DEFS[metalType].name + "metall (Kluster)";
    else if (molAtoms.length > 1 && molAtoms.every(a => a.def.isMetal)) name = "Metallegering";

    return { formula: formula, name: name };
}

function updateMoleculeInfo() {
    const infoBox = document.getElementById('molecule-info');
    const formulaEl = document.getElementById('mol-formula');
    const nameEl = document.getElementById('mol-name');

    // Skapa en lokal referens istället för att försöka skriva över importen
    let currentAtom = lastChangedAtom;
    if (!currentAtom || !atoms.includes(currentAtom)) {
        if (atoms.length > 0) currentAtom = atoms[atoms.length - 1]; 
        else { infoBox.style.display = 'none'; return; }
    }
    
    const molAtoms = getMoleculeFromAtom(currentAtom);
    const identity = identifyMolecule(molAtoms);

    formulaEl.innerHTML = identity.formula.replace(/\d+/g, '<sub>$&</sub>');
    nameEl.innerText = identity.name;
    infoBox.style.display = 'flex';
}
setMoleculeUpdateCallback(updateMoleculeInfo);

// JavaScript-logiken för undermenyer har ersatts av CSS-hover för bättre stabilitet.
