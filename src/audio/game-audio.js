const effects=['laser','hit','explosion','scan','landing','takeoff','warp','engine','rocket'];
export function audioMix(mode,speed=0,progress=0){
 const flight=['space','surface','transit','descent','ascent','takeoff','landing'].includes(mode),active=mode!=='menu'&&mode!=='paused';
 const p=Math.min(1,Math.max(0,progress)),maneuver=['takeoff','landing','ascent','descent'].includes(mode);
 let rocket=0,cutoff=550;
 if(mode==='takeoff'||mode==='ascent'){rocket=.14+.40*Math.sin(p*Math.PI*.5);cutoff=700+2300*p;}
 else if(mode==='landing'){rocket=(.22+.25*Math.sin(p*Math.PI))*(1-.8*Math.max(0,(p-.82)/.18));cutoff=900+900*Math.sin(p*Math.PI);}
 else if(mode==='descent'){rocket=.14+.18*Math.sin(p*Math.PI);cutoff=1600;}
 return {music:active?(maneuver?.065:flight?.13:.18):0,engine:flight?(maneuver?.035:.08+Math.min(Math.max(speed,0)/1600,1)*.18):0,rate:.72+Math.min(Math.max(speed,0)/1600,1)*.65,rocket,cutoff,rumble:rocket*.18};
}
export function createGameAudio(){
 let context,master,musicGain,engineGain,engine,rocketGain,rocketFilter,rumbleGain,loading,enabled=true,currentMode='menu';
 const buffers=new Map(),voices=new Set();let music;
 try{enabled=localStorage.getItem('no-ai-sky:sound')!=='off';}catch{}
 function startMusic(){if(enabled&&music&&currentMode!=='menu'&&currentMode!=='paused')music.play().catch(()=>{});}
 function unlock(){
  if(!enabled)return;
  try{
   if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=.65;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=8;limiter.ratio.value=5;limiter.attack.value=.005;limiter.release.value=.2;master.connect(limiter);limiter.connect(context.destination);musicGain=context.createGain();musicGain.gain.value=0;musicGain.connect(master);engineGain=context.createGain();engineGain.gain.value=0;engineGain.connect(master);
    rocketGain=context.createGain();rocketGain.gain.value=0;rocketFilter=context.createBiquadFilter();rocketFilter.type='lowpass';rocketFilter.frequency.value=700;rocketFilter.Q.value=.55;rocketFilter.connect(rocketGain);rocketGain.connect(master);
    // Filtered low-frequency combustion texture, generated once; no extra download.
    const noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate),samples=noise.getChannelData(0);let brown=0;
    for(let i=0;i<samples.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.02;samples[i]=brown*3;}
    const rumble=context.createBufferSource();rumble.buffer=noise;rumble.loop=true;const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=180;rumbleGain=context.createGain();rumbleGain.gain.value=0;rumble.connect(low);low.connect(rumbleGain);rumbleGain.connect(master);rumble.start();
    music=new Audio('/audio/outer-space.mp3');music.preload='none';music.loop=true;const track=context.createMediaElementSource(music);track.connect(musicGain);
    loading=Promise.allSettled(effects.map(async name=>{const response=await fetch(`/audio/${name}.mp3`);if(!response.ok)throw Error('Audio unavailable');const data=await context.decodeAudioData(await response.arrayBuffer());buffers.set(name,data);})).then(()=>{if(buffers.has('engine')){engine=context.createBufferSource();engine.buffer=buffers.get('engine');engine.loop=true;engine.connect(engineGain);engine.start();}if(buffers.has('rocket')){const rocket=context.createBufferSource();rocket.buffer=buffers.get('rocket');rocket.loop=true;rocket.connect(rocketFilter);rocket.start();}startMusic();});
   }
   context.resume().then(startMusic).catch(()=>{});startMusic();
  }catch{/* Audio support or permissions must never prevent gameplay. */}
 }
 function setEnabled(value){enabled=value;try{localStorage.setItem('no-ai-sky:sound',enabled?'on':'off');}catch{}if(enabled)unlock();else{music?.pause();for(const voice of voices)try{voice.stop();}catch{}}if(master)master.gain.setTargetAtTime(enabled?.65:0,context.currentTime,.06);}
 function play(name){
  if(!enabled)return;unlock();const buffer=buffers.get(name);if(!buffer||voices.size>=12||context.state!=='running')return;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=name==='laser'?.96+Math.random()*.08:1;gain.gain.value={laser:.26,hit:.35,explosion:.42,scan:.18,landing:.48,takeoff:.38,warp:.28}[name]??.2;source.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start();
 }
 function update(mode,speed,progress=0){
  const changed=mode!==currentMode;currentMode=mode;if(!context)return;const mix=audioMix(mode,speed,progress),t=context.currentTime;
  rocketGain.gain.setTargetAtTime(enabled?mix.rocket:0,t,.12);rocketFilter.frequency.setTargetAtTime(mix.cutoff,t,.12);rumbleGain.gain.setTargetAtTime(enabled?mix.rumble:0,t,.12);
  engineGain.gain.setTargetAtTime(enabled?mix.engine:0,t,.25);musicGain.gain.setTargetAtTime(mix.music,t,.6);if(engine)engine.playbackRate.setTargetAtTime(mix.rate,t,.25);
  if(changed){if(mode==='paused'||mode==='menu'){music?.pause();for(const voice of voices)try{voice.stop();}catch{}}else startMusic();}
 }
 return {get enabled(){return enabled;},unlock,setEnabled,play,update};
}
