const ATOM_DEFS = {
    'H':  { symbol: 'H', name: 'Väte', color: '#e0e0e0', textColor: '#111', en: 2.10, max: 2, startFree: 1, startPairs: 0, innerShells: [], isMetal: false },
    'C':  { symbol: 'C', name: 'Kol', color: '#555555', textColor: '#fff', en: 2.55, max: 8, startFree: 4, startPairs: 0, innerShells: [2], isMetal: false },
    'N':  { symbol: 'N', name: 'Kväve', color: '#3366FF', textColor: '#fff', en: 3.04, max: 8, startFree: 3, startPairs: 1, innerShells: [2], isMetal: false },
    'O':  { symbol: 'O', name: 'Syre', color: '#FF3333', textColor: '#fff', en: 3.44, max: 8, startFree: 2, startPairs: 2, innerShells: [2], isMetal: false },
    'P':  { symbol: 'P', name: 'Fosfor', color: '#ff9900', textColor: '#fff', en: 2.19, max: 8, startFree: 3, startPairs: 1, innerShells: [2, 8], isMetal: false },
    'S':  { symbol: 'S', name: 'Svavel', color: '#e6e600', textColor: '#111', en: 2.58, max: 8, startFree: 2, startPairs: 2, innerShells: [2, 8], isMetal: false },
    'Cl': { symbol: 'Cl', name: 'Klor', color: '#33cc33', textColor: '#fff', en: 3.16, max: 8, startFree: 1, startPairs: 3, innerShells: [2, 8], isMetal: false },
    'Br': { symbol: 'Br', name: 'Brom', color: '#8B0000', textColor: '#fff', en: 2.96, max: 8, startFree: 1, startPairs: 3, innerShells: [2, 8, 18], isMetal: false },
    'Li': { symbol: 'Li', name: 'Litium', color: '#D843D8', textColor: '#fff', en: 0.98, max: 8, startFree: 1, startPairs: 0, innerShells: [2], isMetal: true },
    'Na': { symbol: 'Na', name: 'Natrium', color: '#FF9933', textColor: '#fff', en: 0.93, max: 8, startFree: 1, startPairs: 0, innerShells: [2, 8], isMetal: true },
    'K': { symbol: 'K', name: 'Kalium', color: '#8F00FF', textColor: '#fff', en: 0.82, max: 8, startFree: 1, startPairs: 0, innerShells: [2, 8, 8], isMetal: true },
    'Mg': { symbol: 'Mg', name: 'Magnesium', color: '#b3b3cc', textColor: '#111', en: 1.31, max: 8, startFree: 2, startPairs: 0, innerShells: [2, 8], isMetal: true },
    'Al': { symbol: 'Al', name: 'Aluminium', color: '#cccccc', textColor: '#111', en: 1.61, max: 8, startFree: 3, startPairs: 0, innerShells: [2, 8], isMetal: true },
    'Ca': { symbol: 'Ca', name: 'Kalcium', color: '#ffb366', textColor: '#111', en: 1.00, max: 8, startFree: 2, startPairs: 0, innerShells: [2, 8, 8], isMetal: true }
};

const SINGLE_ATOMS = {
    "H": "Väte", "C": "Kol", "N": "Kväve", "O": "Syre", "P": "Fosfor", "S": "Svavel", "Cl": "Klor", "Br": "Brom",
    "Li": "Litium", "Na": "Natrium", "K": "Kalium", "Mg": "Magnesium", "Al": "Aluminium", "Ca": "Kalcium"
};

const PREBUILT_MOLECULES = {
    'H2O': {
        atoms: [
            { id: 'o1', type: 'O', x: 0, y: 0 },
            { id: 'h1', type: 'H', x: -30, y: 30 },
            { id: 'h2', type: 'H', x: 30, y: 30 }
        ],
        bonds: [ { a1: 'o1', a2: 'h1', pairs: 1 }, { a1: 'o1', a2: 'h2', pairs: 1 } ]
    },
    'CO2': {
        atoms: [
            { id: 'c1', type: 'C', x: 0, y: 0 },
            { id: 'o1', type: 'O', x: -45, y: 0 },
            { id: 'o2', type: 'O', x: 45, y: 0 }
        ],
        bonds: [ { a1: 'c1', a2: 'o1', pairs: 2 }, { a1: 'c1', a2: 'o2', pairs: 2 } ]
    },
    'O2': {
        atoms: [ { id: 'o1', type: 'O', x: -20, y: 0 }, { id: 'o2', type: 'O', x: 20, y: 0 } ],
        bonds: [ { a1: 'o1', a2: 'o2', pairs: 2 } ]
    },
    'N2': {
        atoms: [ { id: 'n1', type: 'N', x: -20, y: 0 }, { id: 'n2', type: 'N', x: 20, y: 0 } ],
        bonds: [ { a1: 'n1', a2: 'n2', pairs: 3 } ]
    },
    'H2O2': {
        atoms: [
            { id: 'o1', type: 'O', x: -15, y: 0 }, { id: 'o2', type: 'O', x: 15, y: 0 },
            { id: 'h1', type: 'H', x: -40, y: -25 }, { id: 'h2', type: 'H', x: 40, y: 25 }
        ],
        bonds: [ { a1: 'o1', a2: 'o2', pairs: 1 }, { a1: 'o1', a2: 'h1', pairs: 1 }, { a1: 'o2', a2: 'h2', pairs: 1 } ]
    },
    'CH4': {
        atoms: [
            { id: 'c1', type: 'C', x: 0, y: 0 },
            { id: 'h1', type: 'H', x: 0, y: -35 }, { id: 'h2', type: 'H', x: 35, y: 10 },
            { id: 'h3', type: 'H', x: -35, y: 10 }, { id: 'h4', type: 'H', x: 0, y: 35 }
        ],
        bonds: [
            { a1: 'c1', a2: 'h1', pairs: 1 }, { a1: 'c1', a2: 'h2', pairs: 1 },
            { a1: 'c1', a2: 'h3', pairs: 1 }, { a1: 'c1', a2: 'h4', pairs: 1 }
        ]
    },
    'C2H6': {
        atoms: [
            { id: 'c1', type: 'C', x: -15, y: 0 }, { id: 'c2', type: 'C', x: 15, y: 0 },
            { id: 'h1', type: 'H', x: -35, y: -25 }, { id: 'h2', type: 'H', x: -35, y: 25 }, { id: 'h3', type: 'H', x: -15, y: -35 },
            { id: 'h4', type: 'H', x: 35, y: -25 }, { id: 'h5', type: 'H', x: 35, y: 25 }, { id: 'h6', type: 'H', x: 15, y: -35 }
        ],
        bonds: [
            { a1: 'c1', a2: 'c2', pairs: 1 },
            { a1: 'c1', a2: 'h1', pairs: 1 }, { a1: 'c1', a2: 'h2', pairs: 1 }, { a1: 'c1', a2: 'h3', pairs: 1 },
            { a1: 'c2', a2: 'h4', pairs: 1 }, { a1: 'c2', a2: 'h5', pairs: 1 }, { a1: 'c2', a2: 'h6', pairs: 1 }
        ]
    },
    'C2H4': {
        atoms: [
            { id: 'c1', type: 'C', x: -20, y: 0 }, { id: 'c2', type: 'C', x: 20, y: 0 },
            { id: 'h1', type: 'H', x: -40, y: -25 }, { id: 'h2', type: 'H', x: -40, y: 25 },
            { id: 'h3', type: 'H', x: 40, y: -25 }, { id: 'h4', type: 'H', x: 40, y: 25 }
        ],
        bonds: [
            { a1: 'c1', a2: 'c2', pairs: 2 },
            { a1: 'c1', a2: 'h1', pairs: 1 }, { a1: 'c1', a2: 'h2', pairs: 1 },
            { a1: 'c2', a2: 'h3', pairs: 1 }, { a1: 'c2', a2: 'h4', pairs: 1 }
        ]
    },
    'C2H2': {
        atoms: [
            { id: 'c1', type: 'C', x: -15, y: 0 }, { id: 'c2', type: 'C', x: 15, y: 0 },
            { id: 'h1', type: 'H', x: -45, y: 0 }, { id: 'h2', type: 'H', x: 45, y: 0 }
        ],
        bonds: [
            { a1: 'c1', a2: 'c2', pairs: 3 },
            { a1: 'c1', a2: 'h1', pairs: 1 }, { a1: 'c2', a2: 'h2', pairs: 1 }
        ]
    },
    'NH3': {
        atoms: [
            { id: 'n1', type: 'N', x: 0, y: 0 },
            { id: 'h1', type: 'H', x: 0, y: -30 }, { id: 'h2', type: 'H', x: 25, y: 20 }, { id: 'h3', type: 'H', x: -25, y: 20 }
        ],
        bonds: [
            { a1: 'n1', a2: 'h1', pairs: 1 }, { a1: 'n1', a2: 'h2', pairs: 1 }, { a1: 'n1', a2: 'h3', pairs: 1 }
        ]
    },
    'HCl': {
        atoms: [ { id: 'h1', type: 'H', x: -20, y: 0 }, { id: 'cl1', type: 'Cl', x: 20, y: 0 } ],
        transfers: [{ from: 'h1', to: 'cl1' }],
        bonds: [{ a1: 'cl1', a2: 'h1', pairs: 1, dative: true, donor: 'cl1' }]
    },
    'HBr': {
        atoms: [{ id: 'h1', type: 'H', x: -25, y: 0 }, { id: 'br1', type: 'Br', x: 25, y: 0 }],
        transfers: [{ from: 'h1', to: 'br1' }],
        bonds: [{ a1: 'br1', a2: 'h1', pairs: 1, dative: true, donor: 'br1' }]
    },
    'H2S': {
        atoms: [ { id: 's1', type: 'S', x: 0, y: 0 }, { id: 'h1', type: 'H', x: -25, y: 25 }, { id: 'h2', type: 'H', x: 25, y: 25 } ],
        transfers: [{ from: 'h1', to: 's1' }],
        bonds: [{ a1: 's1', a2: 'h1', pairs: 1, dative: true, donor: 's1' }, { a1: 's1', a2: 'h2', pairs: 1 }]
    },
    'HCN': {
        atoms: [ { id: 'h1', type: 'H', x: -35, y: 0 }, { id: 'c1', type: 'C', x: 0, y: 0 }, { id: 'n1', type: 'N', x: 35, y: 0 } ],
        transfers: [{ from: 'h1', to: 'c1' }],
        bonds: [{ a1: 'c1', a2: 'h1', pairs: 1, dative: true, donor: 'c1' }, { a1: 'c1', a2: 'n1', pairs: 3 }]
    },
    'HNO3': {
        atoms: [
            { id: 'n1', type: 'N', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -35, y: 10 }, { id: 'h1', type: 'H', x: -60, y: 20 },
            { id: 'o2', type: 'O', x: 35, y: 10 }, { id: 'o3', type: 'O', x: 0, y: -40 }
        ],
        transfers: [{ from: 'h1', to: 'o1' }],
        bonds: [
            { a1: 'n1', a2: 'o1', pairs: 1 }, { a1: 'o1', a2: 'h1', pairs: 1, dative: true, donor: 'o1' }, { a1: 'n1', a2: 'o2', pairs: 2 },
            { a1: 'n1', a2: 'o3', pairs: 1, dative: true, donor: 'n1', acceptorPaired: true }
        ]
    },
    'H2SO4': {
        atoms: [
            { id: 's1', type: 'S', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -35, y: 0 }, { id: 'h1', type: 'H', x: -60, y: 15 },
            { id: 'o2', type: 'O', x: 35, y: 0 }, { id: 'h2', type: 'H', x: 60, y: -15 },
            { id: 'o3', type: 'O', x: 0, y: -40 }, { id: 'o4', type: 'O', x: 0, y: 40 }
        ],
        transfers: [{ from: 'h1', to: 'o1' }, { from: 'h2', to: 'o2' }],
        bonds: [
            { a1: 's1', a2: 'o1', pairs: 1 }, { a1: 'o1', a2: 'h1', pairs: 1, dative: true, donor: 'o1' }, 
            { a1: 's1', a2: 'o2', pairs: 1 }, { a1: 'o2', a2: 'h2', pairs: 1, dative: true, donor: 'o2' },
            { a1: 's1', a2: 'o3', pairs: 1, dative: true, donor: 's1', acceptorPaired: true }, { a1: 's1', a2: 'o4', pairs: 1, dative: true, donor: 's1', acceptorPaired: true }
        ]
    },
    'H2CO3': {
        atoms: [
            { id: 'c1', type: 'C', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -35, y: 15 }, { id: 'h1', type: 'H', x: -60, y: 15 },
            { id: 'o2', type: 'O', x: 35, y: 15 }, { id: 'h2', type: 'H', x: 60, y: 15 }, { id: 'o3', type: 'O', x: 0, y: -35 }
        ],
        transfers: [{ from: 'h1', to: 'o1' }],
        bonds: [ 
            { a1: 'c1', a2: 'o1', pairs: 1 }, { a1: 'o1', a2: 'h1', pairs: 1, dative: true, donor: 'o1' }, 
            { a1: 'c1', a2: 'o2', pairs: 1 }, { a1: 'o2', a2: 'h2', pairs: 1 }, 
            { a1: 'c1', a2: 'o3', pairs: 2 } 
        ]
    },
    'HCO3': {
        atoms: [
            { id: 'c1', type: 'C', x: 0, y: 0 },
            { id: 'o1', type: 'O', x: 0, y: -35 }, { id: 'o2', type: 'O', x: -35, y: 20 },
            { id: 'o3', type: 'O', x: 35, y: 20 }, { id: 'h1', type: 'H', x: -60, y: 35 }
        ],
        mods: [{ id: 'o3', type: 'add' }],
        bonds: [
            { a1: 'c1', a2: 'o1', pairs: 2 }, { a1: 'c1', a2: 'o2', pairs: 1 }, { a1: 'o2', a2: 'h1', pairs: 1 },
            { a1: 'c1', a2: 'o3', pairs: 1 }
        ]
    },
    'NO3': {
        atoms: [
            { id: 'n1', type: 'N', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -35, y: 10 },
            { id: 'o2', type: 'O', x: 35, y: 10 }, { id: 'o3', type: 'O', x: 0, y: -40 }
        ],
        mods: [{ id: 'o1', type: 'add' }],
        bonds: [
            { a1: 'n1', a2: 'o1', pairs: 1 }, { a1: 'n1', a2: 'o2', pairs: 2 },
            { a1: 'n1', a2: 'o3', pairs: 1, dative: true, donor: 'n1', acceptorPaired: true }
        ]
    },
    'SO4': {
        atoms: [
            { id: 's1', type: 'S', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -35, y: 0 },
            { id: 'o2', type: 'O', x: 35, y: 0 }, { id: 'o3', type: 'O', x: 0, y: -40 }, { id: 'o4', type: 'O', x: 0, y: 40 }
        ],
        mods: [{ id: 'o1', type: 'add' }, { id: 'o2', type: 'add' }],
        bonds: [
            { a1: 's1', a2: 'o1', pairs: 1 }, { a1: 's1', a2: 'o2', pairs: 1 },
            { a1: 's1', a2: 'o3', pairs: 1, dative: true, donor: 's1', acceptorPaired: true }, 
            { a1: 's1', a2: 'o4', pairs: 1, dative: true, donor: 's1', acceptorPaired: true }
        ]
    },
    'PO4': {
        atoms: [ 
            { id: 'p1', type: 'P', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -30, y: 10 }, 
            { id: 'o2', type: 'O', x: 30, y: 10 }, { id: 'o3', type: 'O', x: 0, y: 35 }, { id: 'o4', type: 'O', x: 0, y: -35 } 
        ],
        mods: [{ id: 'o1', type: 'add' }, { id: 'o2', type: 'add' }, { id: 'o3', type: 'add' }],
        bonds: [ 
            { a1: 'p1', a2: 'o1', pairs: 1 }, { a1: 'p1', a2: 'o2', pairs: 1 }, { a1: 'p1', a2: 'o3', pairs: 1 },
            { a1: 'p1', a2: 'o4', pairs: 1, dative: true, donor: 'p1', acceptorPaired: true } 
        ]
    },
    'OH': {
        atoms: [{ id: 'o1', type: 'O', x: 0, y: 0 }, { id: 'h1', type: 'H', x: 30, y: 0 }],
        mods: [{ id: 'o1', type: 'add' }],
        bonds: [{ a1: 'o1', a2: 'h1', pairs: 1 }]
    },
    'H3PO4': {
        atoms: [ { id: 'p1', type: 'P', x: 0, y: 0 }, { id: 'o1', type: 'O', x: -30, y: 10 }, { id: 'h1', type: 'H', x: -55, y: 10 }, { id: 'o2', type: 'O', x: 30, y: 10 }, { id: 'h2', type: 'H', x: 55, y: 10 }, { id: 'o3', type: 'O', x: 0, y: 35 }, { id: 'h3', type: 'H', x: 0, y: 60 }, { id: 'o4', type: 'O', x: 0, y: -35 } ],
        transfers: [{ from: 'h1', to: 'o1' }],
        bonds: [ 
            { a1: 'p1', a2: 'o1', pairs: 1 }, { a1: 'o1', a2: 'h1', pairs: 1, dative: true, donor: 'o1' }, 
            { a1: 'p1', a2: 'o2', pairs: 1 }, { a1: 'o2', a2: 'h2', pairs: 1 }, 
            { a1: 'p1', a2: 'o3', pairs: 1 }, { a1: 'o3', a2: 'h3', pairs: 1 }, 
            { a1: 'p1', a2: 'o4', pairs: 1, dative: true, donor: 'p1', acceptorPaired: true } 
        ]
    },
    'NaOH': {
        atoms: [ { id: 'na1', type: 'Na', x: -30, y: 0 }, { id: 'o1', type: 'O', x: 10, y: 0 }, { id: 'h1', type: 'H', x: 35, y: 0 } ],
        transfers: [{ from: 'na1', to: 'o1' }],
        bonds: [ { a1: 'o1', a2: 'na1', pairs: 1, dative: true, donor: 'o1' }, { a1: 'o1', a2: 'h1', pairs: 1 } ]
    },
    'LiOH': {
        atoms: [{ id: 'li1', type: 'Li', x: -30, y: 0 }, { id: 'o1', type: 'O', x: 10, y: 0 }, { id: 'h1', type: 'H', x: 35, y: 0 }],
        transfers: [{ from: 'li1', to: 'o1' }],
        bonds: [{ a1: 'o1', a2: 'li1', pairs: 1, dative: true, donor: 'o1' }, { a1: 'o1', a2: 'h1', pairs: 1 }]
    },
    'KOH': {
        atoms: [{ id: 'k1', type: 'K', x: -30, y: 0 }, { id: 'o1', type: 'O', x: 10, y: 0 }, { id: 'h1', type: 'H', x: 35, y: 0 }],
        transfers: [{ from: 'k1', to: 'o1' }],
        bonds: [{ a1: 'o1', a2: 'k1', pairs: 1, dative: true, donor: 'o1' }, { a1: 'o1', a2: 'h1', pairs: 1 }]
    },
    'NaCl': {
        atoms: [ { id: 'na1', type: 'Na', x: -25, y: 0 }, { id: 'cl1', type: 'Cl', x: 25, y: 0 } ],
        transfers: [{ from: 'na1', to: 'cl1' }],
        bonds: [ { a1: 'cl1', a2: 'na1', pairs: 1, dative: true, donor: 'cl1' } ]
    },
    'MgCl2': {
        atoms: [ { id: 'mg1', type: 'Mg', x: 0, y: 0 }, { id: 'cl1', type: 'Cl', x: -40, y: 0 }, { id: 'cl2', type: 'Cl', x: 40, y: 0 } ],
        transfers: [{ from: 'mg1', to: 'cl1' }, { from: 'mg1', to: 'cl2' }],
        bonds: [ { a1: 'cl1', a2: 'mg1', pairs: 1, dative: true, donor: 'cl1' }, { a1: 'cl2', a2: 'mg1', pairs: 1, dative: true, donor: 'cl2' } ]
    },
    'CaCl2': {
        atoms: [ { id: 'ca1', type: 'Ca', x: 0, y: 0 }, { id: 'cl1', type: 'Cl', x: -40, y: 0 }, { id: 'cl2', type: 'Cl', x: 40, y: 0 } ],
        transfers: [{ from: 'ca1', to: 'cl1' }, { from: 'ca1', to: 'cl2' }],
        bonds: [ { a1: 'cl1', a2: 'ca1', pairs: 1, dative: true, donor: 'cl1' }, { a1: 'cl2', a2: 'ca1', pairs: 1, dative: true, donor: 'cl2' } ]
    }
};

const KNOWN_SUBSTANCES = [
    { name: "Vätgas", formula: "H2", counts: { H: 2 }, charge: 0 },
    { name: "Syrgas", formula: "O2", counts: { O: 2 }, charge: 0 },
    { name: "Kvävgas", formula: "N2", counts: { N: 2 }, charge: 0 },
    { name: "Klorgas", formula: "Cl2", counts: { Cl: 2 }, charge: 0 },
    { name: "Ozon", formula: "O3", counts: { O: 3 }, charge: 0 },
    { name: "Vatten", formula: "H2O", counts: { H: 2, O: 1 }, charge: 0 },
    { name: "Väteperoxid", formula: "H2O2", counts: { H: 2, O: 2 }, charge: 0 },
    { name: "Koldioxid", formula: "CO2", counts: { C: 1, O: 2 }, charge: 0 },
    { name: "Kolmonoxid", formula: "CO", counts: { C: 1, O: 1 }, charge: 0 },
    { name: "Ammoniak", formula: "NH3", counts: { N: 1, H: 3 }, charge: 0 },
    { name: "Metan", formula: "CH4", counts: { C: 1, H: 4 }, charge: 0 },
    { name: "Etan", formula: "C2H6", counts: { C: 2, H: 6 }, charge: 0 },
    { name: "Eten", formula: "C2H4", counts: { C: 2, H: 4 }, charge: 0 },
    { name: "Etyn", formula: "C2H2", counts: { C: 2, H: 2 }, charge: 0 },
    { name: "Etanol", formula: "C2H5OH", counts: { C: 2, H: 6, O: 1 }, charge: 0 },
    { name: "Metanol", formula: "CH3OH", counts: { C: 1, H: 4, O: 1 }, charge: 0 },
    { name: "Propan", formula: "C3H8", counts: { C: 3, H: 8 }, charge: 0 },
    { name: "Butan", formula: "C4H10", counts: { C: 4, H: 10 }, charge: 0 },
    { name: "Pentan", formula: "C5H12", counts: { C: 5, H: 12 }, charge: 0 },
    { name: "Hexan", formula: "C6H14", counts: { C: 6, H: 14 }, charge: 0 },
    { name: "Heptan", formula: "C7H16", counts: { C: 7, H: 16 }, charge: 0 },
    { name: "Propen", formula: "C3H6", counts: { C: 3, H: 6 }, charge: 0 },
    { name: "Buten", formula: "C4H8", counts: { C: 4, H: 8 }, charge: 0 },
    { name: "Penten", formula: "C5H10", counts: { C: 5, H: 10 }, charge: 0 },
    { name: "Propyn", formula: "C3H4", counts: { C: 3, H: 4 }, charge: 0 },
    { name: "Butyn", formula: "C4H6", counts: { C: 4, H: 6 }, charge: 0 },
    { name: "Myrsyra", formula: "CH2O2", counts: { C: 1, H: 2, O: 2 }, charge: 0 },
    { name: "Ättiksyra / Metylmetanoat", formula: "C2H4O2", counts: { C: 2, H: 4, O: 2 }, charge: 0 },
    { name: "Propansyra / Etylmetanoat", formula: "C3H6O2", counts: { C: 3, H: 6, O: 2 }, charge: 0 },
    { name: "Smörsyra / Etyletanoat", formula: "C4H8O2", counts: { C: 4, H: 8, O: 2 }, charge: 0 },
    { name: "Väteklorid (Saltsyra)", formula: "HCl", counts: { H: 1, Cl: 1 }, charge: 0 },
    { name: "Vätebromid", formula: "HBr", counts: { H: 1, Br: 1 }, charge: 0 },
    { name: "Svavelväte", formula: "H2S", counts: { H: 2, S: 1 }, charge: 0 },
    { name: "Salpetersyra", formula: "HNO3", counts: { H: 1, N: 1, O: 3 }, charge: 0 },
    { name: "Svavelsyra", formula: "H2SO4", counts: { H: 2, S: 1, O: 4 }, charge: 0 },
    { name: "Kolsyra", formula: "H2CO3", counts: { H: 2, C: 1, O: 3 }, charge: 0 },
    { name: "Fosforsyra", formula: "H3PO4", counts: { H: 3, P: 1, O: 4 }, charge: 0 },
    { name: "Vätecyanid", formula: "HCN", counts: { H: 1, C: 1, N: 1 }, charge: 0 },
    { name: "Natriumklorid", formula: "NaCl", counts: { Na: 1, Cl: 1 }, charge: 0 },
    { name: "Litiumklorid", formula: "LiCl", counts: { Li: 1, Cl: 1 }, charge: 0 },
    { name: "Kaliumklorid", formula: "KCl", counts: { K: 1, Cl: 1 }, charge: 0 },
    { name: "Natriumbromid", formula: "NaBr", counts: { Na: 1, Br: 1 }, charge: 0 },
    { name: "Natriumhydroxid", formula: "NaOH", counts: { Na: 1, O: 1, H: 1 }, charge: 0 },
    { name: "Litiumhydroxid", formula: "LiOH", counts: { Li: 1, O: 1, H: 1 }, charge: 0 },
    { name: "Litiumbromid", formula: "LiBr", counts: { Li: 1, Br: 1 }, charge: 0 },
    { name: "Kaliumhydroxid", formula: "KOH", counts: { K: 1, O: 1, H: 1 }, charge: 0 },
    { name: "Vätekarbonatjon", formula: "HCO3⁻", counts: { H: 1, C: 1, O: 3 }, charge: -1 },
    { name: "Magnesiumklorid", formula: "MgCl2", counts: { Mg: 1, Cl: 2 }, charge: 0 },
    { name: "Kalciumklorid", formula: "CaCl2", counts: { Ca: 1, Cl: 2 }, charge: 0 },
    { name: "Hydroxidjon", formula: "OH⁻", counts: { O: 1, H: 1 }, charge: -1 },
    { name: "Cyanidjon", formula: "CN⁻", counts: { C: 1, N: 1 }, charge: -1 },
    { name: "Nitratjon", formula: "NO3⁻", counts: { N: 1, O: 3 }, charge: -1 },
    { name: "Nitritjon", formula: "NO2⁻", counts: { N: 1, O: 2 }, charge: -1 },
    { name: "Karbonatjon", formula: "CO3²⁻", counts: { C: 1, O: 3 }, charge: -2 },
    { name: "Fosfatjon", formula: "PO4³⁻", counts: { P: 1, O: 4 }, charge: -3 },
    { name: "Sulfatjon", formula: "SO4²⁻", counts: { S: 1, O: 4 }, charge: -2 },
    { name: "Ammoniumjon", formula: "NH4⁺", counts: { N: 1, H: 4 }, charge: 1 },
    { name: "Oxoniumjon", formula: "H3O⁺", counts: { O: 1, H: 3 }, charge: 1 }
];
export { ATOM_DEFS, PREBUILT_MOLECULES };
export { KNOWN_SUBSTANCES, SINGLE_ATOMS };