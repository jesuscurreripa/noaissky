import test from 'node:test';
import assert from 'node:assert/strict';
import {translateText,protectNames,readLanguage} from '../src/i18n/index.js';
import {createSystem} from '../src/world/procedural.js';
test('both languages preserve names, numbers and source metadata',()=>{const worlds=createSystem('SISTEMA');protectNames(['SISTEMA',...worlds.map(p=>p.name)]);assert.equal(translateText('ATLAS / SEMILLA SISTEMA','en'),'ATLAS / SEED SISTEMA');assert.equal(translateText('CASCO 120°C / RADIACIÓN SOLAR','en'),'HULL 120°C / SOLAR RADIATION');assert.equal(translateText('CASCO 120°C','es'),'CASCO 120°C');for(const p of worlds){assert.notEqual(translateText(p.type,'en'),p.type);assert.equal(translateText(p.name,'en'),p.name);}});
test('language storage is independent and tolerates blocked storage',()=>{assert.equal(readLanguage({getItem:()=> 'es'}),'es');assert.equal(readLanguage({getItem(){throw Error();}}),'en');assert.equal(readLanguage(null),'en');});
