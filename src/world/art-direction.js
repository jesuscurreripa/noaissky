import * as THREE from 'three';

import {applyMoldedFinish} from './molded-material.js';

// Compatibility entry point used by ships, landmarks and surface props.
export function illustrateMaterial(material){return applyMoldedFinish(material);}

export const ART_PALETTES={
 verdant:{land:'#d38965',grass:'#c66280',vegetation:'#ef5d77',ocean:'#168d94',sky:'#247e9c',horizon:'#f2c8a2',ink:'#493c69',rock:'#a56374'},
 arid:{land:'#e5a06d',grass:'#b7a46a',vegetation:'#428e89',ocean:'#307e89',sky:'#536e9e',horizon:'#f4c59b',ink:'#55517d',rock:'#b66c67'},
 volcanic:{land:'#49354f',grass:'#66455b',vegetation:'#a44955',ocean:'#ff6428',sky:'#312f58',horizon:'#dd8579',ink:'#343955',rock:'#70506a'},
 toxic:{land:'#b5ad63',grass:'#bbc965',vegetation:'#e4d882',ocean:'#98b73d',sky:'#586b79',horizon:'#e6dfa2',ink:'#55516f',rock:'#918b74'},
 oceanic:{land:'#efc79a',grass:'#66bdb1',vegetation:'#f18c89',ocean:'#177fa8',sky:'#3579ac',horizon:'#e2d6c3',ink:'#415685',rock:'#929ab1'},
 crystalline:{land:'#8d6fa4',grass:'#b494bc',vegetation:'#84e3d4',ocean:'#5a69a6',sky:'#484d8a',horizon:'#e2b2c9',ink:'#454274',rock:'#a98ab5'},
 glacial:{land:'#cfdfdf',grass:'#a2bcd9',vegetation:'#b38ad1',ocean:'#487fac',sky:'#506997',horizon:'#efc9cd',ink:'#5a5285',rock:'#99a5c8'},
 gas:{land:'#e7ba8e',ocean:'#b07581',vegetation:'#f6dfb0',sky:'#bca0af',horizon:'#f4d6b7',ink:'#564c70',rock:'#b07581'},
 icegiant:{land:'#83d1cd',ocean:'#556fba',vegetation:'#cae7db',sky:'#6e93b6',horizon:'#d4c8df',ink:'#4c5088',rock:'#556fba'}
};
