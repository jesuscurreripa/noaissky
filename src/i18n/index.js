import {phrases} from './catalog.js';
const escapeRegex=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const dictionary=new Map(phrases.map(([es,en])=>[es.toLocaleLowerCase('es'),en]));
const alternatives=[...dictionary.keys()].sort((a,b)=>b.length-a.length).map(escapeRegex).join('|');
const matcher=new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternatives})(?![\\p{L}\\p{N}_])`,'giu');
let protectedMatcher=null;
export function protectNames(names){
 const unique=[...new Set(names.filter(Boolean))].sort((a,b)=>b.length-a.length);
 protectedMatcher=unique.length?new RegExp(`(?<![\\p{L}\\p{N}_])(?:${unique.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}_])`,'giu'):null;
}
function translateChunk(text){return text.replace(matcher,source=>{const result=dictionary.get(source.toLocaleLowerCase('es'));return source===source.toUpperCase()?result.toUpperCase():source===source.toLowerCase()?result.toLowerCase():result;});}
export function translateText(text,language){
 if(language!=='en'||!text.trim())return text;
 if(!protectedMatcher)return translateChunk(text);
 let result='',offset=0;for(const match of text.matchAll(protectedMatcher)){result+=translateChunk(text.slice(offset,match.index))+match[0];offset=match.index+match[0].length;}return result+translateChunk(text.slice(offset));
}
export function readLanguage(storage){try{return storage?.getItem('no-ai-sky:language')==='es'?'es':'en';}catch{return 'en';}}

// Localize only the presentation layer. Source strings stay in game data and saves.
// Keep each original text node so switching back is lossless, including open dialogs.
export function initLanguageSwitch(){
 let storage;try{storage=window.localStorage;}catch{}
 let language=readLanguage(storage);const originals=new WeakMap(),attributes=new WeakMap();
 const button=document.getElementById('language-switch');
 const excluded=node=>node.parentElement?.closest('script,style,textarea,[data-i18n-ignore]');
 function textNode(node){
  if(excluded(node))return;
  const previous=originals.get(node),current=node.nodeValue;
  const source=previous&&current===previous.output?previous.source:current;
  const output=translateText(source,language);originals.set(node,{source,output});if(current!==output)node.nodeValue=output;
 }
 function element(node){
  if(node.matches('script,style,textarea,[data-i18n-ignore]'))return;
  const values=attributes.get(node)||{};
  for(const name of ['aria-label','title','placeholder',...(node.matches('meta[name="description"]')?['content']:[])]){
   if(!node.hasAttribute(name))continue;const current=node.getAttribute(name),previous=values[name],source=previous&&current===previous.output?previous.source:current,output=translateText(source,language);
   values[name]={source,output};if(current!==output)node.setAttribute(name,output);
  }attributes.set(node,values);
 }
 function visit(node){
  if(node.nodeType===3){textNode(node);return;}
  if(node.nodeType!==1)return;element(node);
  if(node.matches('script,style,textarea,[data-i18n-ignore]'))return;
  for(const child of node.childNodes)visit(child);
 }
 function applyLanguage(){
  document.documentElement.lang=language;button.setAttribute('aria-label',language==='en'?'Cambiar a español':'Switch to English');button.title=language==='en'?'Cambiar a español':'Switch to English';button.dataset.language=language;button.setAttribute('aria-pressed',String(language==='en'));visit(document.documentElement);
 }
 const observer=new MutationObserver(records=>{
  const changed=new Set();for(const record of records){if(record.type==='childList'){for(const node of record.addedNodes)changed.add(node);}else changed.add(record.target);}
  for(const node of changed)if(node.isConnected){if(node.nodeType===3)textNode(node);else visit(node);}
 });
 applyLanguage();observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','content']});
 button.addEventListener('keydown',event=>event.stopPropagation());
 button.addEventListener('click',()=>{language=language==='en'?'es':'en';try{storage?.setItem('no-ai-sky:language',language);}catch{}applyLanguage();});
 return {get language(){return language;}};
}
