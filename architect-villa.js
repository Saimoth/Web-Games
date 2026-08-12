import {createArchitectScene} from "./architect-core.js?v=3";

const root=document.documentElement;
const experience=document.getElementById("experience");
const modelEl=document.getElementById("model");
const host=document.getElementById("threeHost");
const referenceRender=document.getElementById("referenceRender");
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smoothstep=t=>{t=clamp(t);return t*t*(3-2*t)};
const sseg=(p,a,b)=>smoothstep(clamp((p-a)/(b-a)));
const lerp=(a,b,t)=>a+(b-a)*t;
function opacity(id,v){const e=$(id);if(e)e.style.opacity=clamp(v)}
function transform(id,v){const e=$(id);if(e)e.style.transform=v}
function windowFade(p,a,b,c,d){return sseg(p,a,b)*(1-sseg(p,c,d))}
function floatPanel(id,p,a,b,c,d,x=0,y=28){const t=windowFade(p,a,b,c,d),en=sseg(p,a,b),ex=sseg(p,c,d);opacity(id,t);transform(id,`translate(${x*(1-en+ex)}px,${y*(1-en+ex)}px)`);return t}
function editorial(id,p,a,b,c,d){const t=windowFade(p,a,b,c,d);opacity(id,t);transform(id,`scale(${.985+t*.015})`);return t}
function designTimeFromScroll(p){const s=[{pa:0,pb:.18,ta:0,tb:8.8},{pa:.24,pb:.465,ta:8.8,tb:18.4},{pa:.545,pb:.785,ta:18.4,tb:27.6},{pa:.865,pb:1,ta:27.6,tb:36.5}];if(p<=0)return 0;for(let i=0;i<s.length;i++){const q=s[i];if(p>=q.pa&&p<=q.pb)return lerp(q.ta,q.tb,sseg(p,q.pa,q.pb));if(i<s.length-1&&p>q.pb&&p<s[i+1].pa)return q.tb}return 36.5}

const phases=[[0,"01 / Site geometry","Begin with place.","A flat triangulated field becomes topography and establishes the site."],[.09,"02 / Formation","Create the datum.","The centre of the terrain is controlled and prepared for the first structural move."],[.18,"03 / Interlude","Space to explain.","The model pauses while one important idea takes over the screen."],[.25,"04 / Structure","Assemble with intent.","Slabs, walls and the front support columns arrive as individual architectural components."],[.39,"05 / Upper volume","Define privacy.","The upper datum is drawn, then extruded into a more private second storey."],[.47,"06 / Interlude","A clear point of view.","A second pause gives the project narrative room before construction resumes."],[.56,"07 / Envelope","Bring in light.","Glazing slides into the façade and the roof plane settles above the composition."],[.70,"08 / Landscape","Return to place.","Planting grows from the analysed terrain and softens the precision of the model."],[.78,"09 / Interlude","Precision without sterility.","The final editorial break creates anticipation before the resolved study."],[.87,"10 / Evaluation","Inspect the whole.","Dimensions resolve and the camera begins a deliberate architectural orbit."],[.97,"11 / Resolved","A composed whole.","The final concept becomes both technical study and presentation piece."]];

const architect=createArchitectScene(host);
function resizeThree(){architect.resize()}
addEventListener("resize",resizeThree);
addEventListener("orientationchange",()=>setTimeout(resizeThree,150));
resizeThree();

let currentScroll=0;
function updatePage(){
  const max=experience.offsetHeight-innerHeight,p=clamp(scrollY/Math.max(1,max));
  currentScroll=p;
  root.style.setProperty("--p",p.toFixed(4));
  $("percent").textContent=String(Math.round(p*100)).padStart(3,"0")+"%";

  const introT=1-sseg(p,.035,.085);
  opacity("intro",introT);
  transform("intro",`translateY(${-22*sseg(p,.035,.085)}px)`);

  floatPanel("panelA",p,.095,.12,.155,.175,0,24);
  floatPanel("panelB",p,.135,.155,.175,.188,-12,18);

  const pc=floatPanel("panelC",p,.30,.33,.39,.42,0,25),
        pd=floatPanel("panelD",p,.355,.385,.425,.45,-12,20),
        ed1=editorial("editorialOne",p,.18,.195,.225,.24),
        ed2=editorial("editorialTwo",p,.465,.485,.525,.545),
        ed3=editorial("editorialThree",p,.785,.805,.845,.865),
        editorMax=Math.max(ed1,ed2,ed3),
        final=sseg(p,.965,1);

  opacity("finalGrid",final);
  transform("finalGrid",`translateY(${12*(1-final)}px)`);

  const lower=Math.max(pc||0,pd||0),
        lift=Math.max(48*lower,90*final),
        scaleLoss=.018*lower+.028*final;

  modelEl.style.opacity=1-editorMax*.96;
  modelEl.style.filter=`blur(${editorMax*1.7}px)`;
  modelEl.style.transform=`translateY(${16-lift}px) scale(${1-scaleLoss-editorMax*.025})`;

  const renderFade=sseg(p,.935,.998)*(1-editorMax);
  referenceRender.style.opacity=(.96*renderFade).toFixed(3);
  referenceRender.style.transform=`translateY(${10*(1-renderFade)}px) scale(${1.02-.02*renderFade})`;
  host.style.opacity=(1-.52*renderFade).toFixed(3);

  $("paintLayer").style.opacity=.92*sseg(p,.925,.995)*(1-editorMax);
  $("phase").style.opacity=1-editorMax;

  let active=phases[0];
  for(const ph of phases)if(p>=ph[0])active=ph;
  if($("phaseNum").textContent!==active[1]){
    $("phaseNum").textContent=active[1];
    $("phaseTitle").textContent=active[2];
    $("phaseDetail").textContent=active[3];
    $("phaseTitle").animate([{opacity:.12,transform:"translateY(7px)"},{opacity:1,transform:"translateY(0)"}],{duration:300,easing:"cubic-bezier(.2,.8,.2,1)"});
  }
}

let ticking=false;
addEventListener("scroll",()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{updatePage();ticking=false})},{passive:true});
updatePage();

function render(){requestAnimationFrame(render);architect.renderAt(designTimeFromScroll(currentScroll))}
requestAnimationFrame(render);
