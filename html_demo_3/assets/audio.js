'use strict';
/* 音效：沿用甲方學習護照的 BGM（cover/prologue/main/milestone）與合成點擊/成功音 */
const Snd=(()=>{
  let muted=DemoCore.readPreference('yk-muted','0')==='1',vol=.3,bgm=null,bgmName='',ctx=null,unlocked=false,want='';
  const MAP={patient:'cover',wishes:'prologue',quad:'prologue',passport:'main'};
  const ac=()=>{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx};
  function stop(){if(bgm){bgm.pause();bgm=null;bgmName=''}}
  function play(name,loop=true){
    if(muted||!unlocked){return}
    if(bgmName===name&&bgm)return;
    stop();bgm=new Audio(`assets/audio/${name}.mp3`);bgm.loop=loop;bgm.volume=vol;bgmName=name;bgm.play().catch(()=>{bgm=null;bgmName=''});
  }
  function tone(freqs,type,gap,dur,g){try{const c=ac(),t=c.currentTime;freqs.forEach((f,i)=>{const o=c.createOscillator(),n=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t+i*gap);n.gain.setValueAtTime(0,t+i*gap);n.gain.linearRampToValueAtTime(g,t+i*gap+.02);n.gain.exponentialRampToValueAtTime(.001,t+i*gap+dur);o.connect(n);n.connect(c.destination);o.start(t+i*gap);o.stop(t+i*gap+dur)})}catch(e){}}
  const api={
    view(v){want=MAP[v]||'';want?play(want):stop()},
    click(){if(!muted)tone([700],'sine',0,.1,.2)},
    success(){if(!muted)tone([523.25,659.25,783.99],'triangle',.07,.3,.25)},
    win(){this.success();if(muted||!unlocked)return;const a=new Audio('assets/audio/milestone.mp3');a.volume=vol;a.play().catch(()=>{});setTimeout(()=>{let v=a.volume;const t=setInterval(()=>{v-=.05;if(v<=0){a.pause();clearInterval(t)}else a.volume=v},120)},3500)},
    toggle(){muted=!muted;const saved=DemoCore.writePreference('yk-muted',muted?'1':'0');muted?stop():(want&&play(want));if(!saved)toast('音效已切換，但偏好設定未保存');return muted},
    isMuted:()=>muted
  };
  document.addEventListener('pointerdown',()=>{if(!unlocked){unlocked=true;if(!muted&&want)play(want)}},{capture:true});
  document.addEventListener('click',e=>{if(e.target.closest('button,[data-act]'))api.click()},true);
  return api;
})();
