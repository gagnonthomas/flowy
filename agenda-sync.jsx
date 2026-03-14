import{useState,useRef,useEffect}from"react";

const MFR=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const MFR_FULL=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const NOW=new Date();
const TODAY=(function(){var d=NOW;return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");})();
const TOMORROW=(function(){var d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");})();
const gid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,"0");
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const fd=(y,m)=>(new Date(y,m,1).getDay()+6)%7;

const NAV_GROUPS=[
  {id:"accueil",    icon:"🏠", label:"Accueil",      tabs:[{id:"accueil",label:"Accueil"}]},
  {id:"aujourdhui", icon:"📅", label:"Aujourd'hui",  tabs:[{id:"agenda",label:"Agenda"},{id:"routines",label:"Routines"}]},
  {id:"focus",      icon:"⏱", label:"Focus",         tabs:[{id:"focus",label:"Focus"}]},
  {id:"planning",   icon:"📆", label:"Planning",     tabs:[{id:"semaine",label:"Semaine"},{id:"cal",label:"Calendrier"},{id:"mois",label:"Bilan"}]},
  {id:"taches",     icon:"✅", label:"Tâches",       tabs:[{id:"todos",label:"Tâches"},{id:"notes",label:"Notes"}]},
  {id:"moi",        icon:"💚", label:"Moi",           tabs:[{id:"wellness",label:"Santé"},{id:"respiration",label:"Respiration"},{id:"meditation",label:"Méditation"},{id:"defis",label:"Défis"}]},
  {id:"flowi",      icon:"🧠", label:"Flowi",         tabs:[{id:"coach",label:"Coach"},{id:"recompenses",label:"XP"}]},
];
// Helper: find which group a tab belongs to
function groupOfTab(t){return NAV_GROUPS.find(function(g){return g.tabs.some(function(s){return s.id===t;});})||NAV_GROUPS[0];}


const MO_COLORS=["#EF4444","#F97316","#F59E0B","#10B981","#06B6D4","#3B82F6","#8B5CF6","#EC4899","#14B8A6","#F43F5E","#6366F1","#84CC16"];

const CATS={
  rdv:{label:"RDV",color:"#3B82F6",bg:"#EFF6FF"},
  tache:{label:"Tache",color:"#8B5CF6",bg:"#F5F3FF"},
  perso:{label:"Perso",color:"#10B981",bg:"#ECFDF5"},
  sante:{label:"Sante",color:"#EF4444",bg:"#FFF1F2"},
  famille:{label:"Famille",color:"#F59E0B",bg:"#FFF7ED"},
};

function SwipeTask(props){
  var onComplete=props.onComplete;
  var onDelete=props.onDelete;
  var children=props.children;
  var startX=React.useRef(null);
  var startY=React.useRef(null);
  var currentX=React.useRef(0);
  var direction=React.useRef(null); // "h" horizontal | "v" vertical | null
  var[offset,setOffset]=React.useState(0);
  var[swiping,setSwiping]=React.useState(false);

  var THRESHOLD=72;

  var onTouchStart=function(e){
    startX.current=e.touches[0].clientX;
    startY.current=e.touches[0].clientY;
    direction.current=null;
    currentX.current=0;
  };
  var onTouchMove=function(e){
    if(startX.current===null)return;
    var dx=e.touches[0].clientX-startX.current;
    var dy=e.touches[0].clientY-startY.current;
    // Determine direction on first significant movement
    if(direction.current===null){
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>6){direction.current="h";}
      else if(Math.abs(dy)>6){direction.current="v";}
      else{return;}
    }
    if(direction.current!=="h")return;
    e.preventDefault(); // block vertical scroll only when swiping horizontally
    currentX.current=dx;
    setSwiping(true);
    setOffset(Math.max(-140,Math.min(140,dx)));
  };
  var onTouchEnd=function(){
    if(direction.current==="h"){
      var dx=currentX.current;
      if(dx<-THRESHOLD){onComplete&&onComplete();}
      else if(dx>THRESHOLD){onDelete&&onDelete();}
    }
    setOffset(0);
    setSwiping(false);
    startX.current=null;
    startY.current=null;
    currentX.current=0;
    direction.current=null;
  };

  var bgColor="transparent";
  var hint=null;
  if(offset<-20){bgColor="#DCFCE7";hint=<span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18,pointerEvents:"none"}}>✅</span>;}
  if(offset>20){bgColor="#FEE2E2";hint=<span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18,pointerEvents:"none"}}>🗑️</span>;}

  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:10,marginBottom:5,background:bgColor,transition:swiping?"none":"background 0.2s"}}>
      {hint}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{transform:"translateX("+offset+"px)",transition:swiping?"none":"transform 0.25s cubic-bezier(.25,.46,.45,.94)",willChange:"transform",touchAction:"pan-y"}}
      >
        {children}
      </div>
    </div>
  );
}


function ScanModal(props){
  var open=props.open,target=props.target,img=props.img,b64=props.b64,mime=props.mime,phase=props.phase,results=props.results,sel=props.sel,err=props.err;
  var setScanOpen=props.setScanOpen,setScanImg=props.setScanImg,setScanB64=props.setScanB64,setScanMime=props.setScanMime,setScanPhase=props.setScanPhase,setScanResults=props.setScanResults,setScanSel=props.setScanSel,setScanErr=props.setScanErr;
  var photoRef=props.photoRef,galleryRef=props.galleryRef;
  var onAdd=props.onAdd;
  if(!open)return null;
  function handleFile(file){
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(e){
      var url=e.target.result;
      setScanImg(url);
      var b=url.split(",")[1];
      setScanB64(b);
      setScanMime(file.type||"image/jpeg");
      setScanPhase("preview");
    };
    reader.readAsDataURL(file);
  }
  function doScan(){
    setScanPhase("loading");setScanErr(null);
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-5",max_tokens:800,
        messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:mime,data:b64}},
          {type:"text",text:"Lis attentivement cette image et extrait tous les elements de liste (taches, items d'epicerie, notes). Retourne uniquement une liste JSON pure, sans markdown, sans backticks, sans explication: [{\"text\":\"item 1\"},{\"text\":\"item 2\"}]. Si rien n'est lisible, retourne []."},
        ]}],
      }),
    }).then(function(r){return r.json();}).then(function(d){
      var raw=(d.content||[]).map(function(b2){return b2.text||"";}).join("").trim();
      try{var arr=JSON.parse(raw);setScanResults(arr);setScanPhase("results");}
      catch(e){setScanErr("Impossible de lire la liste. Reessaie avec une photo plus nette.");setScanPhase("preview");}
    }).catch(function(){setScanErr("Erreur reseau.");setScanPhase("preview");});
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#FFFFFF",borderRadius:20,padding:24,width:340,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:800,color:"#2D3A5A"}}>📷 {target==="agenda"?"Agenda du jour":target==="semaine"?"Agenda semaine":target==="mois"?"Agenda mois":"Scanner une liste"}</p>
          <button onClick={function(){setScanOpen(false);setScanPhase("pick");setScanImg(null);setScanResults([]);setScanSel([]);}} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#F0F0F0",fontSize:16,cursor:"pointer"}}>×</button>
        </div>
        {phase==="pick"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#8090B0",textAlign:"center",marginBottom:8}}>{(target==="agenda"||target==="semaine"||target==="mois")?"Prends une photo de ton agenda papier — les événements seront extraits automatiquement":"Prends une photo de ta liste ou choisis une image"}</p>
            <button onClick={function(){photoRef.current&&photoRef.current.click();}} style={{padding:"12px",borderRadius:12,border:"2px solid #3B82F6",background:"#FFFFFF",color:"#1E3A8A",fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:"pointer"}}>📸 Appareil photo</button>
            <button onClick={function(){galleryRef.current&&galleryRef.current.click();}} style={{padding:"12px",borderRadius:12,border:"2px solid #8B5CF6",background:"#FFFFFF",color:"#4C1D95",fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:"pointer"}}>🖼 Galerie</button>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={function(e){handleFile(e.target.files[0]);}}/>
            <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(e){handleFile(e.target.files[0]);}}/>
          </div>
        )}
        {phase==="preview"&&(
          <div>
            {img&&<img src={img} alt="scan" style={{width:"100%",borderRadius:12,marginBottom:12,maxHeight:200,objectFit:"cover"}}/>}
            {err&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#EF4444",marginBottom:8,textAlign:"center"}}>{err}</p>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){setScanPhase("pick");setScanImg(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #E8EDF5",background:"#FAFBFF",fontSize:13,fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>Rechoisir</button>
              <button onClick={doScan} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#3B82F6",color:"white",fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:"pointer"}}>🔍 Analyser</button>
            </div>
          </div>
        )}
        {phase==="loading"&&(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <p style={{fontSize:36,marginBottom:12}}>🔍</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"#8090B0"}}>Analyse en cours...</p>
          </div>
        )}
        {phase==="results"&&(
          <div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#8090B0",marginBottom:10}}>{results.length+" elements detectes — coche ceux a ajouter"}</p>
            {results.map(function(r,i){var checked=sel.indexOf(i)>=0;return(
              <div key={i} onClick={function(){setScanSel(function(p){return checked?p.filter(function(x){return x!==i;}):[...p,i];});}} style={{display:"flex",gap:8,alignItems:"center",padding:"8px 10px",marginBottom:4,borderRadius:10,background:checked?"#EFF6FF":"#FAFBFF",border:"1.5px solid "+(checked?"#3B82F6":"#E8EDF5"),cursor:"pointer"}}>
                <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(checked?"#3B82F6":"#CBD5E1"),background:checked?"#3B82F6":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,flexShrink:0}}>{checked?"✓":""}</div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#2D3A5A",flex:1}}>{r.text}</p>
              </div>
            );})}
            <button onClick={function(){if(sel.length>0){onAdd(sel.map(function(i){return results[i].text;}));setScanOpen(false);setScanPhase("pick");setScanImg(null);setScanResults([]);setScanSel([]);}}} style={{width:"100%",padding:"12px",marginTop:8,borderRadius:12,border:"none",background:sel.length>0?"#10B981":"#E8EDF5",color:sel.length>0?"white":"#8090B0",fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:"pointer"}}>{"+ Ajouter "+(sel.length>0?"("+sel.length+")":"")+" elements"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

const PM={
  focus:      {light:"#F5F3FF",border:"#DDD6FE",accent:"#7C3AED",text:"#4C1D95"},
  agenda:     {light:"#EFF6FF",border:"#BFDBFE",accent:"#3B82F6",text:"#1E40AF"},
  routines:   {light:"#FFF7ED",border:"#FED7AA",accent:"#F97316",text:"#9A3412"},
  semaine:    {light:"#FDF4FF",border:"#E9D5FF",accent:"#9333EA",text:"#581C87"},
  mois:       {light:"#F0FDFA",border:"#99F6E4",accent:"#0D9488",text:"#134E4A"},
  todos:      {light:"#EEF2FF",border:"#C7D2FE",accent:"#4F46E5",text:"#312E81"},
  notes:      {light:"#FFFBEB",border:"#FDE68A",accent:"#D97706",text:"#78350F"},
  epicerie:   {light:"#F0FDF4",border:"#BBF7D0",accent:"#16A34A",text:"#14532D"},
  wellness:   {light:"#FFF1F2",border:"#FECDD3",accent:"#E11D48",text:"#881337"},
  defis:      {light:"#F0F9FF",border:"#BAE6FD",accent:"#0284C7",text:"#0C4A6E"},
  creativite: {light:"#FFF0F9",border:"#FBCFE8",accent:"#DB2777",text:"#831843"},
  budget:     {light:"#ECFDF5",border:"#A7F3D0",accent:"#059669",text:"#064E3B"},
  voyage:     {light:"#FFF7ED",border:"#FED7AA",accent:"#EA580C",text:"#7C2D12"},
  coach:      {light:"#F0FDF4",border:"#86EFAC",accent:"#16A34A",text:"#14532D"},
  recompenses:{light:"#FEFCE8",border:"#FEF08A",accent:"#CA8A04",text:"#713F12"},
};

const MOODS=[
  {id:"heureux",emoji:"😄",label:"Heureux",color:"#F5C800",bg:"#FFFBCC",face:"heureux"},
  {id:"triste",emoji:"😢",label:"Triste",color:"#5BC4D4",bg:"#DBEAFE",face:"triste"},
  {id:"excite",emoji:"🤩",label:"Excite",color:"#F0C130",bg:"#FEF9C3",face:"excite"},
  {id:"calme",emoji:"😌",label:"Calme",color:"#D4915A",bg:"#FDECD2",face:"calme"},
  {id:"fatigue",emoji:"😴",label:"Fatigue",color:"#E07840",bg:"#FDDBC0",face:"fatigue"},
  {id:"fier",emoji:"😊",label:"Fier",color:"#7BC67A",bg:"#D1FAE5",face:"fier"},
  {id:"fache",emoji:"😡",label:"Fache",color:"#D95A4A",bg:"#FEE2E2",face:"fache"},
  {id:"confus",emoji:"😕",label:"Confus",color:"#C06090",bg:"#FDE8F0",face:"confus"},
];

function MoodBlob(props){
  var m=props.mood;var sel=props.sel;var s=props.size||52;
  var c2=s/2;var r=s*0.44;var sw=s*0.06;

  // Poster-accurate body colors
  var bodyColor={
    heureux:"#FFD93D",
    triste:"#5BC4D4",
    excite:"#FFD93D",
    calme:"#D4915A",
    fatigue:"#E07840",
    fier:"#7BC67A",
    fache:"#D95A4A",
    confus:"#C06090",
  }[m.face]||"#E0E0E0";

  var totalH=s*1.28;

  // Helper: arc brow going upward (happy mood)
  function happyBrow(cx,cy,wr){
    return "M "+(cx-wr)+" "+cy+" Q "+cx+" "+(cy-wr*0.9)+" "+(cx+wr)+" "+cy;
  }
  // Helper: arc brow going down inner (sad/angry)
  function sadBrow(cx,cy,wr,dir){
    var mid=dir==="left"?(cx+wr*0.5):(cx-wr*0.5);
    var topY=dir==="left"?(cy-wr*0.7):(cy-wr*0.7);
    return "M "+(cx-wr)+" "+cy+" Q "+mid+" "+topY+" "+(cx+wr)+" "+cy;
  }
  // Half-closed eye (tired)
  function halfEye(cx,cy,ew,eh){
    return "M "+(cx-ew)+" "+cy+" Q "+cx+" "+(cy-eh)+" "+(cx+ew)+" "+cy+" L "+(cx+ew)+" "+(cy+eh*0.4)+" Q "+cx+" "+(cy+eh*1.1)+" "+(cx-ew)+" "+(cy+eh*0.4)+" Z";
  }
  // Arc smile
  function smile(x1,y1,x2,y2,cy2){
    return "M "+x1+" "+y1+" Q "+((x1+x2)/2)+" "+cy2+" "+x2+" "+y2;
  }
  // Open smile (teeth)
  function bigSmile(cx,cy,w,h){
    return "M "+(cx-w)+" "+cy+" Q "+cx+" "+(cy+h*1.2)+" "+(cx+w)+" "+cy+" Q "+cx+" "+(cy+h*0.3)+" "+(cx-w)+" "+cy;
  }

  var BW=sw*0.88; // brow width stroke
  var EW=sw*0.9;  // eye stroke

  function renderFace(){
    var fc=m.face;
    if(fc==="heureux") return (
      <g>
        {/* Happy arched brows */}
        <path d={happyBrow(c2-s*0.13,c2-s*0.14,s*0.085)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <path d={happyBrow(c2+s*0.13,c2-s*0.14,s*0.085)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Squinted happy eyes — arcs */}
        <path d={"M "+(c2-s*0.2)+" "+(c2-s*0.05)+" Q "+(c2-s*0.12)+" "+(c2-s*0.13)+" "+(c2-s*0.04)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        <path d={"M "+(c2+s*0.04)+" "+(c2-s*0.05)+" Q "+(c2+s*0.12)+" "+(c2-s*0.13)+" "+(c2+s*0.2)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        {/* Big open smile with teeth */}
        <path d={bigSmile(c2,c2+s*0.04,s*0.18,s*0.14)} fill="white" stroke="#2D2020" strokeWidth={sw*0.8} strokeLinecap="round"/>
        {/* Cheeks */}
        <ellipse cx={c2-s*0.23} cy={c2+s*0.08} rx={s*0.08} ry={s*0.055} fill="#F87171" opacity="0.3"/>
        <ellipse cx={c2+s*0.23} cy={c2+s*0.08} rx={s*0.08} ry={s*0.055} fill="#F87171" opacity="0.3"/>
      </g>
    );
    if(fc==="triste") return (
      <g>
        {/* Sad inner-raised brows */}
        <line x1={c2-s*0.2} y1={c2-s*0.12} x2={c2-s*0.06} y2={c2-s*0.18} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <line x1={c2+s*0.06} y1={c2-s*0.18} x2={c2+s*0.2} y2={c2-s*0.12} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Eyes — half closed, sad */}
        <path d={"M "+(c2-s*0.19)+" "+(c2-s*0.04)+" Q "+(c2-s*0.11)+" "+(c2-s*0.1)+" "+(c2-s*0.03)+" "+(c2-s*0.04)+" Q "+(c2-s*0.11)+" "+(c2+s*0.01)+" "+(c2-s*0.19)+" "+(c2-s*0.04)+" Z"} fill="#2D2020"/>
        <path d={"M "+(c2+s*0.03)+" "+(c2-s*0.04)+" Q "+(c2+s*0.11)+" "+(c2-s*0.1)+" "+(c2+s*0.19)+" "+(c2-s*0.04)+" Q "+(c2+s*0.11)+" "+(c2+s*0.01)+" "+(c2+s*0.03)+" "+(c2-s*0.04)+" Z"} fill="#2D2020"/>
        {/* Frown */}
        <path d={smile(c2-s*0.14,c2+s*0.14,c2+s*0.14,c2+s*0.14,c2+s*0.06)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        {/* Cheeks + tear */}
        <ellipse cx={c2-s*0.22} cy={c2+s*0.07} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.25"/>
        <ellipse cx={c2+s*0.22} cy={c2+s*0.07} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.25"/>
        <ellipse cx={c2-s*0.14} cy={c2+s*0.07} rx={s*0.022} ry={s*0.036} fill="white" opacity="0.85"/>
      </g>
    );
    if(fc==="excite") return (
      <g>
        {/* Raised excited brows */}
        <path d={happyBrow(c2-s*0.13,c2-s*0.18,s*0.085)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <path d={happyBrow(c2+s*0.13,c2-s*0.18,s*0.085)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Wide open eyes */}
        <circle cx={c2-s*0.13} cy={c2-s*0.06} r={s*0.065} fill="#2D2020"/>
        <circle cx={c2+s*0.13} cy={c2-s*0.06} r={s*0.065} fill="#2D2020"/>
        <circle cx={c2-s*0.105} cy={c2-s*0.08} r={s*0.022} fill="white"/>
        <circle cx={c2+s*0.155} cy={c2-s*0.08} r={s*0.022} fill="white"/>
        {/* Open mouth O shape */}
        <ellipse cx={c2} cy={c2+s*0.1} rx={s*0.1} ry={s*0.12} fill="#2D2020"/>
        <ellipse cx={c2} cy={c2+s*0.1} rx={s*0.07} ry={s*0.09} fill="#C0384A"/>
      </g>
    );
    if(fc==="calme") return (
      <g>
        {/* Calm relaxed brows — gently curved */}
        <path d={"M "+(c2-s*0.2)+" "+(c2-s*0.15)+" Q "+(c2-s*0.12)+" "+(c2-s*0.18)+" "+(c2-s*0.04)+" "+(c2-s*0.15)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <path d={"M "+(c2+s*0.04)+" "+(c2-s*0.15)+" Q "+(c2+s*0.12)+" "+(c2-s*0.18)+" "+(c2+s*0.2)+" "+(c2-s*0.15)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Closed eyes with lashes — calm sleepy */}
        <path d={"M "+(c2-s*0.2)+" "+(c2-s*0.06)+" Q "+(c2-s*0.12)+" "+(c2-s*0.13)+" "+(c2-s*0.04)+" "+(c2-s*0.06)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        <path d={"M "+(c2+s*0.04)+" "+(c2-s*0.06)+" Q "+(c2+s*0.12)+" "+(c2-s*0.13)+" "+(c2+s*0.2)+" "+(c2-s*0.06)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        {/* Lashes */}
        <line x1={c2-s*0.2} y1={c2-s*0.06} x2={c2-s*0.22} y2={c2-s*0.1} stroke="#2D2020" strokeWidth={sw*0.7} strokeLinecap="round"/>
        <line x1={c2-s*0.14} y1={c2-s*0.1} x2={c2-s*0.15} y2={c2-s*0.14} stroke="#2D2020" strokeWidth={sw*0.7} strokeLinecap="round"/>
        <line x1={c2+s*0.2} y1={c2-s*0.06} x2={c2+s*0.22} y2={c2-s*0.1} stroke="#2D2020" strokeWidth={sw*0.7} strokeLinecap="round"/>
        <line x1={c2+s*0.14} y1={c2-s*0.1} x2={c2+s*0.15} y2={c2-s*0.14} stroke="#2D2020" strokeWidth={sw*0.7} strokeLinecap="round"/>
        {/* Gentle smile */}
        <path d={smile(c2-s*0.14,c2+s*0.09,c2+s*0.14,c2+s*0.09,c2+s*0.17)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        <ellipse cx={c2-s*0.22} cy={c2+s*0.07} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.28"/>
        <ellipse cx={c2+s*0.22} cy={c2+s*0.07} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.28"/>
      </g>
    );
    if(fc==="fatigue") return (
      <g>
        {/* Droopy tired brows */}
        <line x1={c2-s*0.2} y1={c2-s*0.15} x2={c2-s*0.05} y2={c2-s*0.18} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <line x1={c2+s*0.05} y1={c2-s*0.18} x2={c2+s*0.2} y2={c2-s*0.15} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Half-open tired eyes */}
        <path d={"M "+(c2-s*0.19)+" "+(c2-s*0.05)+" Q "+(c2-s*0.11)+" "+(c2-s*0.12)+" "+(c2-s*0.03)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        <path d={"M "+(c2-s*0.19)+" "+(c2-s*0.05)+" Q "+(c2-s*0.11)+" "+(c2-s*0.02)+" "+(c2-s*0.03)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={sw*0.6} strokeLinecap="round"/>
        <ellipse cx={c2-s*0.11} cy={c2-s*0.05} rx={s*0.045} ry={s*0.03} fill="#2D2020"/>
        <path d={"M "+(c2+s*0.03)+" "+(c2-s*0.05)+" Q "+(c2+s*0.11)+" "+(c2-s*0.12)+" "+(c2+s*0.19)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        <path d={"M "+(c2+s*0.03)+" "+(c2-s*0.05)+" Q "+(c2+s*0.11)+" "+(c2-s*0.02)+" "+(c2+s*0.19)+" "+(c2-s*0.05)} fill="none" stroke="#2D2020" strokeWidth={sw*0.6} strokeLinecap="round"/>
        <ellipse cx={c2+s*0.11} cy={c2-s*0.05} rx={s*0.045} ry={s*0.03} fill="#2D2020"/>
        {/* Flat mouth */}
        <line x1={c2-s*0.12} y1={c2+s*0.1} x2={c2+s*0.12} y2={c2+s*0.1} stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        {/* Cheeks */}
        <ellipse cx={c2-s*0.22} cy={c2+s*0.06} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.25"/>
        <ellipse cx={c2+s*0.22} cy={c2+s*0.06} rx={s*0.07} ry={s*0.05} fill="#F87171" opacity="0.25"/>
        {/* Zz */}
        <text x={c2+r*0.58} y={c2-r*0.42} fontFamily="Inter,sans-serif" fontSize={s*0.14} fill="#B0A090" fontWeight="bold" opacity="0.75">z</text>
        <text x={c2+r*0.72} y={c2-r*0.62} fontFamily="Inter,sans-serif" fontSize={s*0.1} fill="#B0A090" fontWeight="bold" opacity="0.5">z</text>
      </g>
    );
    if(fc==="fier") return (
      <g>
        {/* Proud confident brows — flat strong */}
        <line x1={c2-s*0.2} y1={c2-s*0.17} x2={c2-s*0.05} y2={c2-s*0.17} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <line x1={c2+s*0.05} y1={c2-s*0.17} x2={c2+s*0.2} y2={c2-s*0.17} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Confident eyes */}
        <circle cx={c2-s*0.12} cy={c2-s*0.06} r={s*0.055} fill="#2D2020"/>
        <circle cx={c2+s*0.12} cy={c2-s*0.06} r={s*0.055} fill="#2D2020"/>
        <circle cx={c2-s*0.09} cy={c2-s*0.08} r={s*0.02} fill="white"/>
        <circle cx={c2+s*0.15} cy={c2-s*0.08} r={s*0.02} fill="white"/>
        {/* Big proud grin */}
        <path d={bigSmile(c2,c2+s*0.04,s*0.17,s*0.13)} fill="white" stroke="#2D2020" strokeWidth={sw*0.8} strokeLinecap="round"/>
      </g>
    );
    if(fc==="fache") return (
      <g>
        {/* Angry V-brows */}
        <line x1={c2-s*0.2} y1={c2-s*0.12} x2={c2-s*0.05} y2={c2-s*0.18} stroke="#2D2020" strokeWidth={BW*1.1} strokeLinecap="round"/>
        <line x1={c2+s*0.05} y1={c2-s*0.18} x2={c2+s*0.2} y2={c2-s*0.12} stroke="#2D2020" strokeWidth={BW*1.1} strokeLinecap="round"/>
        {/* Angry eyes — oval, squinting */}
        <ellipse cx={c2-s*0.12} cy={c2-s*0.05} rx={s*0.07} ry={s*0.05} fill="#2D2020"/>
        <ellipse cx={c2+s*0.12} cy={c2-s*0.05} rx={s*0.07} ry={s*0.05} fill="#2D2020"/>
        {/* Deep frown */}
        <path d={smile(c2-s*0.15,c2+s*0.15,c2+s*0.15,c2+s*0.15,c2+s*0.05)} fill="none" stroke="#2D2020" strokeWidth={EW*1.1} strokeLinecap="round"/>
      </g>
    );
    if(fc==="confus") return (
      <g>
        {/* One brow raised, one normal — confused asymmetry */}
        <path d={"M "+(c2-s*0.2)+" "+(c2-s*0.1)+" Q "+(c2-s*0.12)+" "+(c2-s*0.18)+" "+(c2-s*0.04)+" "+(c2-s*0.12)} fill="none" stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        <line x1={c2+s*0.04} y1={c2-s*0.15} x2={c2+s*0.2} y2={c2-s*0.17} stroke="#2D2020" strokeWidth={BW} strokeLinecap="round"/>
        {/* Confused eyes — different sizes */}
        <circle cx={c2-s*0.12} cy={c2-s*0.05} r={s*0.065} fill="#2D2020"/>
        <circle cx={c2+s*0.12} cy={c2-s*0.05} r={s*0.04} fill="#2D2020"/>
        <circle cx={c2-s*0.09} cy={c2-s*0.07} r={s*0.022} fill="white"/>
        {/* Squiggly confused mouth */}
        <path d={"M "+(c2-s*0.13)+" "+(c2+s*0.1)+" Q "+(c2-s*0.06)+" "+(c2+s*0.06)+" "+c2+" "+(c2+s*0.1)+" Q "+(c2+s*0.06)+" "+(c2+s*0.14)+" "+(c2+s*0.13)+" "+(c2+s*0.1)} fill="none" stroke="#2D2020" strokeWidth={EW} strokeLinecap="round"/>
        {/* Question mark */}
        <text x={c2+r*0.6} y={c2-r*0.45} fontFamily="Inter,sans-serif" fontSize={s*0.2} fill="#2D2020" fontWeight="bold" opacity="0.7">?</text>
      </g>
    );
    return null;
  }

  return(
    <svg width={s} height={totalH} viewBox={"0 0 "+s+" "+totalH} style={{overflow:"visible",filter:sel?"drop-shadow(0 4px 14px "+bodyColor+"CC)":"none",transition:"filter 0.25s"}}>
      {/* Shadow */}
      <ellipse cx={c2} cy={totalH-s*0.06} rx={r*0.6} ry={s*0.055} fill="rgba(0,0,0,0.09)"/>
      {/* Legs */}
      <line x1={c2-s*0.08} y1={s*0.84} x2={c2-s*0.09} y2={s*0.97} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>
      <line x1={c2-s*0.09} y1={s*0.97} x2={c2-s*0.14} y2={s*1.04} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>
      <line x1={c2+s*0.08} y1={s*0.84} x2={c2+s*0.09} y2={s*0.97} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>
      <line x1={c2+s*0.09} y1={s*0.97} x2={c2+s*0.14} y2={s*1.04} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>
      {/* Arms per mood */}
      {(m.face==="heureux"||m.face==="excite"||m.face==="fier")&&<line x1={c2-r} y1={c2-s*0.04} x2={c2-r-s*0.13} y2={c2-s*0.18} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {(m.face==="heureux"||m.face==="excite"||m.face==="fier")&&<line x1={c2+r} y1={c2-s*0.04} x2={c2+r+s*0.13} y2={c2-s*0.18} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {(m.face==="calme"||m.face==="confus")&&<line x1={c2-r} y1={c2+s*0.02} x2={c2-r-s*0.1} y2={c2+s*0.02} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {(m.face==="calme"||m.face==="confus")&&<line x1={c2+r} y1={c2+s*0.02} x2={c2+r+s*0.1} y2={c2+s*0.02} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {(m.face==="triste"||m.face==="fatigue")&&<line x1={c2-r} y1={c2+s*0.05} x2={c2-r-s*0.09} y2={c2+s*0.13} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {(m.face==="triste"||m.face==="fatigue")&&<line x1={c2+r} y1={c2+s*0.05} x2={c2+r+s*0.09} y2={c2+s*0.13} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {m.face==="fache"&&<line x1={c2-r} y1={c2} x2={c2-r-s*0.1} y2={c2-s*0.1} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {m.face==="fache"&&<line x1={c2+r} y1={c2} x2={c2+r+s*0.1} y2={c2-s*0.1} stroke="#2D2020" strokeWidth={sw*0.75} strokeLinecap="round"/>}
      {/* Body circle */}
      <circle cx={c2} cy={c2} r={r} fill={bodyColor} stroke={sel?"rgba(0,0,0,0.18)":"transparent"} strokeWidth={sel?2:0}/>
      {/* Face */}
      {renderFace()}
    </svg>
  );
}

function LotusIcon(props){
  var size=props.size||32;
  var animated=props.animated||false;
  var col=props.color||"#7C3AED";
  var bg=props.bg||"transparent";
  var sw=Math.max(6,size*0.09);
  var anim=animated?"draw 0.95s ease forwards":"none";
  return(
    <svg width={size} height={size} viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg" style={props.style||{}}>
      {animated&&<style>{"@keyframes draw{from{stroke-dashoffset:800}to{stroke-dashoffset:0}}"}</style>}
      <g transform="translate(140,145)" fill={bg} stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path strokeDasharray="800" strokeDashoffset={animated?"800":"0"} style={{animation:animated?anim+" 0.0s":"none"}}
          d="M -10,20 C -35,45 -100,42 -128,16 C -112,-14 -58,-2 -10,20 Z"/>
        <path strokeDasharray="800" strokeDashoffset={animated?"800":"0"} style={{animation:animated?anim+" 0.35s":"none"}}
          d="M 10,20 C 35,45 100,42 128,16 C 112,-14 58,-2 10,20 Z"/>
        <path strokeDasharray="800" strokeDashoffset={animated?"800":"0"} style={{animation:animated?anim+" 0.75s":"none"}}
          d="M -5,14 C -40,2 -76,-48 -56,-104 C -32,-82 -12,-32 -5,14 Z"/>
        <path strokeDasharray="800" strokeDashoffset={animated?"800":"0"} style={{animation:animated?anim+" 1.1s":"none"}}
          d="M 5,14 C 40,2 76,-48 56,-104 C 32,-82 12,-32 5,14 Z"/>
        <path strokeDasharray="800" strokeDashoffset={animated?"800":"0"} style={{animation:animated?anim+" 1.5s":"none"}}
          d="M 0,14 C -26,-24 -23,-90 0,-130 C 23,-90 26,-24 0,14 Z"/>
      </g>
    </svg>
  );
}

function _OldLotusIconUnused(props){
  var size=props.size||32;
  var animated=props.animated||false;
  var s=size/160;
  var dur=animated?"0.45s":"0s";
  var petals=[
    {id:"lp1",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"0s"},
    {id:"lp2",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"0.3s",rotate:51},
    {id:"lp3",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"0.6s",rotate:102},
    {id:"lp4",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"0.9s",rotate:153},
    {id:"lp5",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"1.2s",rotate:204},
    {id:"lp6",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"1.5s",rotate:255},
    {id:"lp7",d:"M 0,-20 C -22,-55 -18,-110 0,-130 C 18,-110 22,-55 0,-20 Z",delay:"1.8s",rotate:306},
    {id:"lm1",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"2.0s",rotate:25,mid:true},
    {id:"lm2",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"2.2s",rotate:85,mid:true},
    {id:"lm3",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"2.4s",rotate:145,mid:true},
    {id:"lm4",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"2.6s",rotate:205,mid:true},
    {id:"lm5",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"2.8s",rotate:265,mid:true},
    {id:"lm6",d:"M 0,-15 C -16,-42 -14,-85 0,-100 C 14,-85 16,-42 0,-15 Z",delay:"3.0s",rotate:325,mid:true},
  ];
  var styleBlock=animated?"\n@keyframes lpop{from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)}}\n":"";
  return(
    <svg width={size} height={size} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style={props.style||{}}>
      {animated&&<style>{styleBlock}</style>}
      <g transform={"translate(80,90) scale("+s+")"} style={{transformOrigin:"80px 90px"}}>
        {petals.map(function(p){
          var fill=p.mid?"#818CF8":"#7C3AED";
          var animStyle=animated?{opacity:0,animation:"lpop "+dur+" ease forwards "+p.delay}:{opacity:1};
          return(
            <g key={p.id} transform={p.rotate?"rotate("+p.rotate+")":""} style={animStyle}>
              <path d={p.d} fill={fill} opacity={p.mid?"0.95":"0.88"}/>
            </g>
          );
        })}
        {/* Inner petals */}
        {[0,72,144,216,288].map(function(r,i){
          var animStyle=animated?{opacity:0,animation:"lpop "+dur+" ease forwards "+(3.2+i*0.15)+"s"}:{opacity:1};
          return(
            <g key={"li"+i} transform={"rotate("+r+")"} style={animStyle}>
              <path d="M 0,-10 C -10,-28 -9,-58 0,-68 C 9,-58 10,-28 0,-10 Z" fill="#C7D2FE"/>
            </g>
          );
        })}
        {/* Center */}
        <circle cx="0" cy="-10" r="14" fill="#C7D2FE" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.0s"}:{}}/>
        <circle cx="0" cy="-10" r="7"  fill="#7C3AED" opacity="0.7" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.1s"}:{}}/>
        <circle cx="0" cy="-10" r="3"  fill="#EEF2FF" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.2s"}:{}}/>
        <circle cx="0"  cy="-22" r="2.5" fill="#C7D2FE" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.25s"}:{}}/>
        <circle cx="9"  cy="-19" r="2"   fill="#C7D2FE" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.3s"}:{}}/>
        <circle cx="-9" cy="-19" r="2"   fill="#C7D2FE" style={animated?{opacity:0,animation:"lpop "+dur+" ease forwards 4.35s"}:{}}/>
      </g>
    </svg>
  );
}

function ls(key,def){try{var v=localStorage.getItem("as_"+key);return v!==null?JSON.parse(v):def;}catch(e){return def;}}
function ss(key,val){try{localStorage.setItem("as_"+key,JSON.stringify(val));}catch(e){}}

function makeSwipeNav(onSwipeLeft,onSwipeRight){
  var startX=null;
  return{
    onTouchStart:function(e){startX=e.touches[0].clientX;},
    onTouchEnd:function(e){
      if(startX===null)return;
      var dx=e.changedTouches[0].clientX-startX;
      if(Math.abs(dx)>50){if(dx<0)onSwipeLeft();else onSwipeRight();}
      startX=null;
    },
    onMouseDown:function(e){startX=e.clientX;},
    onMouseUp:function(e){
      if(startX===null)return;
      var dx=e.clientX-startX;
      if(Math.abs(dx)>80){if(dx<0)onSwipeLeft();else onSwipeRight();}
      startX=null;
    },
  };
}

function useWindowSize(){
  var[size,setSize]=useState({w:window.innerWidth,h:window.innerHeight});
  useEffect(function(){
    // Ensure proper viewport meta for mobile/tablet
    var meta=document.querySelector("meta[name=viewport]");
    if(!meta){meta=document.createElement("meta");meta.name="viewport";document.head.appendChild(meta);}
    meta.content="width=device-width, initial-scale=1, maximum-scale=1";
    function onResize(){setSize({w:window.innerWidth,h:window.innerHeight});}
    window.addEventListener("resize",onResize);
    return function(){window.removeEventListener("resize",onResize);};
  },[]);
  return size;
}

export default function App() {
  var win=useWindowSize();
  var isDual=win.w>=768;
  var isTablet=win.w>=768&&win.w<1100;
  var isPhone=win.w<768;
  var navW=isPhone?56:isTablet?62:72;
  var tabFontSize=isPhone?8:isTablet?9:10;
  var tabIconSize=isPhone?16:isTablet?18:22;
  var contentPad=isPhone?8:isTablet?12:16;
  var[tab,setTab]=useState("accueil");
  var[showCheckin,setShowCheckin]=useState(function(){
    var h=new Date().getHours();
    var slot=h<12?"matin":h<18?"apresmidi":"soir";
    var stored=localStorage.getItem("as_energyLog");
    var log=stored?JSON.parse(stored):{};
    var key=TODAY+"-"+slot;
    return !log[key];
  });
  var[checkinSlot,setCheckinSlot]=useState(function(){
    var h=new Date().getHours();
    return h<12?"matin":h<18?"apresmidi":"soir";
  });
  var[onboarded,setOnboarded]=useState(function(){return ls("onboarded",false);});
  var[obStep,setObStep]=useState(function(){return ls("onboarded",false)?0:-1;});
  var[obName,setObName]=useState(function(){return ls("obName","");});
  var[obTdah,setObTdah]=useState(function(){return ls("obTdah","");});
  var[obDefis,setObDefis]=useState(function(){return ls("obDefis",[]);});
  var[obObjectif,setObObjectif]=useState(function(){return ls("obObjectif","");});
  var[darkMode,setDarkMode]=useState(function(){return ls("darkMode",false);});
  var[syncOpen,setSyncOpen]=useState(false);
  var[badDay,setBadDay]=useState(false);
  var[badDayTask,setBadDayTask]=useState("");
  var[badDayTimer,setBadDayTimer]=useState(0);
  var[badDayActive,setBadDayActive]=useState(false);
  var[badDayTotal,setBadDayTotal]=useState(300);
  var badDayRef=useRef(null);
  var[syncCode,setSyncCode]=useState(function(){return ls("syncCode","");});
  var[syncInput,setSyncInput]=useState("");
  var[syncStatus,setSyncStatus]=useState("");
  var[syncLoading,setSyncLoading]=useState(false);
  var WORKER_URL="https://agenda-sync.YOUR_SUBDOMAIN.workers.dev";
  var[calMon,setCalMon]=useState(new Date(NOW.getFullYear(),NOW.getMonth(),1));
  var[calOpen,setCalOpen]=useState(false);
  var yr=calMon.getFullYear(),mo=calMon.getMonth();
  var[selDate,setSelDate]=useState(TODAY);
  var[events,setEvents]=useState(function(){return ls("events",[]);});
  var[moods,setMoods]=useState(function(){return ls("moods",{});});
  var[todos,setTodos]=useState(function(){return ls("todos",[]);});
  var[notes,setNotes]=useState(function(){return ls("notes",[]);});
  var[grocery,setGrocery]=useState([]);
  var[mealInput,setMealInput]=useState("");
  var[mealLoading,setMealLoading]=useState(false);
  var[mealIngredients,setMealIngredients]=useState([]);
  var[flyerDeals,setFlyerDeals]=useState([]);
  var[flyerLoading,setFlyerLoading]=useState(false);
  var[flyerLocation,setFlyerLocation]=useState("Montréal, QC");
  var[flyerError,setFlyerError]=useState("");
  var[lastFlyerSearch,setLastFlyerSearch]=useState("");
  var[budget,setBudget]=useState([]);
  var[budgetStart,setBudgetStart]=useState("");
  var[budgetEnd,setBudgetEnd]=useState("");
  var[budgetRevenues,setBudgetRevenues]=useState([{id:"r1",label:"Salaire",budget:"",actual:""}]);
  var[budgetBills,setBudgetBills]=useState([{id:"b1",label:"Loyer",budget:"",actual:""},{id:"b2",label:"Internet",budget:"",actual:""},{id:"b3",label:"Electricite",budget:"",actual:""},{id:"b4",label:"Telephone",budget:"",actual:""}]);
  var[budgetExpenses,setBudgetExpenses]=useState([{id:"e1",label:"Epicerie",budget:"",actual:""},{id:"e2",label:"Restaurant",budget:"",actual:""},{id:"e3",label:"Transport",budget:"",actual:""},{id:"e4",label:"Sante",budget:"",actual:""},{id:"e5",label:"Loisirs",budget:"",actual:""}]);
  var[budgetSavings,setBudgetSavings]=useState([{id:"s1",label:"Urgence",budget:"",actual:""},{id:"s2",label:"Vacances",budget:"",actual:""}]);
  var[budgetDebts,setBudgetDebts]=useState([{id:"d1",label:"Pret etudiant",budget:"",actual:""},{id:"d2",label:"Carte credit",budget:"",actual:""}]);
  var[newEvTitle,setNewEvTitle]=useState("");
  var[newEvTime,setNewEvTime]=useState("");
  var[newEvEndTime,setNewEvEndTime]=useState("");
  var[newEvDate,setNewEvDate]=useState("");
  var[newEvCat,setNewEvCat]=useState("rdv");
  var[newTodo,setNewTodo]=useState("");
  var[newTodoPriority,setNewTodoPriority]=useState("normale");
  var[newTodoDue,setNewTodoDue]=useState("");
  var[newNote,setNewNote]=useState("");
  var[newGrocery,setNewGrocery]=useState("");
  var[focusActive,setFocusActive]=useState(false);
  var[focusSecs,setFocusSecs]=useState(1500);
  var[focusTotal,setFocusTotal]=useState(1500);
  var[focusCustom,setFocusCustom]=useState("");
  var[focusTaskId,setFocusTaskId]=useState("");
  var[focusDone,setFocusDone]=useState(false);
  var timerRef=useRef(null);
  // New sections state
  var[habits,setHabits]=useState(function(){return ls("habits",[
    {id:"h1",label:"Meditation",icon:"🧘",done:{}},
    {id:"h2",label:"Exercice",icon:"🏃",done:{}},
    {id:"h3",label:"Lecture",icon:"📖",done:{}},
    {id:"h4",label:"Gratitude",icon:"🙏",done:{}},
  ]);});
  var[newHabit,setNewHabit]=useState("");
  var[habitIconLoading,setHabitIconLoading]=useState(false);
  var[gratitude,setGratitude]=useState(function(){return ls("gratitude",{});});
  var[newGratitude,setNewGratitude]=useState("");
  var[breathPhase,setBreathPhase]=useState(null);
  var[breathSel,setBreathSel]=useState(0);
  var[breathSecs,setBreathSecs]=useState(0);
  var[breathDuration,setBreathDuration]=useState(3);
  var[breathElapsed,setBreathElapsed]=useState(0);
  var[breathCustom,setBreathCustom]=useState({name:"Mon exercice",phases:[{label:"Inspirer",sec:4},{label:"Expirer",sec:4}]});
  var[breathShowCustom,setBreathShowCustom]=useState(false);
  var[breathNewPhase,setBreathNewPhase]=useState({label:"Inspirer",sec:4});
  var breathRef=useRef(null);
  var breathSecsRef=useRef(null);
  var breathElapsedRef=useRef(null);
  var[sleepLog,setSleepLog]=useState(function(){return ls("sleepLog",{});});
  var[sleepNote,setSleepNote]=useState("");
  var[waterLog,setWaterLog]=useState(function(){return ls("waterLog",{});});
  var[energyLog,setEnergyLog]=useState(function(){return ls("energyLog",{});});
  var[workouts,setWorkouts]=useState(function(){return ls("workouts",[]);});
  var[newWorkout,setNewWorkout]=useState({type:"",dur:""});
  var[weight,setWeight]=useState(function(){return ls("weight",{});});
  var[newWeight,setNewWeight]=useState("");
  var[defis,setDefis]=useState(function(){return ls("defis",[]);});
  var[newDefi,setNewDefi]=useState("");
  var[rappels,setRappels]=useState(function(){return ls("rappels",["","","",""]);});
  var[agendaNotes,setAgendaNotes]=useState(function(){return ls("agendaNotes",{});});
  var[semaineReview,setSemaineReview]=useState(function(){return ls("semaineReview",{});});
  var[newDefiDays,setNewDefiDays]=useState(30);
  var[voyages,setVoyages]=useState([]);
  var[newVoyage,setNewVoyage]=useState({dest:"",dateDepart:"",dateRetour:"",note:"",budget:""});
  var[activeVoyage,setActiveVoyage]=useState(null);
  var[voyageDetailTab,setVoyageDetailTab]=useState("infos");
  var[bucketList,setBucketList]=useState([]);
  var[newBucketDest,setNewBucketDest]=useState("");
  var[phrasesLoading,setPhrasesLoading]=useState(false);
  var[aiDayPlan,setAiDayPlan]=useState({});
  var[dayPlanLoading,setDayPlanLoading]=useState(false);
  var[brainDump,setBrainDump]=useState({});
  var[brainDumpResult,setBrainDumpResult]=useState({});
  var[brainDumpLoading,setBrainDumpLoading]=useState(false);
  var[openBlocIdx,setOpenBlocIdx]=useState(null);
  var[inspirations,setInspirations]=useState([]);
  var[newInspo,setNewInspo]=useState("");
  var[inspoFilter,setInspoFilter]=useState("all");
  var[projects,setProjects]=useState([]);
  var[newProject,setNewProject]=useState("");
  var[openProject,setOpenProject]=useState(null);
  var[oracle,setOracle]=useState(function(){
    var stored=localStorage.getItem("as_oracle");
    var date=localStorage.getItem("as_oracleDate");
    if(stored&&date===TODAY)return stored;
    return "";
  });
  var[oracleLoading,setOracleLoading]=useState(false);
  var[oracleDate,setOracleDate]=useState(function(){
    var date=localStorage.getItem("as_oracleDate");
    return date===TODAY?TODAY:"";
  });
  var[jourBlocks,setJourBlocks]=useState(function(){return ls("jourBlocks",{});});
  var[jourPrios,setJourPrios]=useState(function(){return ls("jourPrios",{});});
  var[prioPickerOpen,setPrioPickerOpen]=useState(null);
  var[todoViewDate,setTodoViewDate]=useState(TODAY);
  var[editEvtId,setEditEvtId]=useState(null);
  var[dayViewDate,setDayViewDate]=useState(null); // index 0,1,2 ou null
  var[jourGratitude,setJourGratitude]=useState(function(){return ls("jourGratitude",{});});
  var[jourNote,setJourNote]=useState("");
  var[semaineGoals,setSemaineGoals]=useState(function(){return ls("semaineGoals",[]);});
  var[newSemaineGoal,setNewSemaineGoal]=useState("");
  var[semaineTasks,setSemaineTasks]=useState(function(){return ls("semaineTasks",{});});
  var[moisGoals,setMoisGoals]=useState(function(){return ls("moisGoals",[]);});
  var[newMoisGoal,setNewMoisGoal]=useState("");
  var[moisReview,setMoisReview]=useState(function(){return ls("moisReview",{});});
  var[routines,setRoutines]=useState(function(){return ls("routines",[
    {id:"r1",name:"Routine du matin",emoji:"🌅",color:"#F97316",blocks:[
      {id:"b1",label:"Reveil doux",emoji:"⏰",dur:5,color:"#FED7AA"},
      {id:"b2",label:"Meditation",emoji:"🧘",dur:10,color:"#C4B5FD"},
      {id:"b3",label:"Petit-dejeuner",emoji:"🥣",dur:15,color:"#A7F3D0"},
      {id:"b4",label:"Douche",emoji:"🚿",dur:10,color:"#BAE6FD"},
    ]},
    {id:"r2",name:"Routine du soir",emoji:"🌙",color:"#8B5CF6",blocks:[
      {id:"b5",label:"Rangement",emoji:"🧹",dur:10,color:"#FDE68A"},
      {id:"b6",label:"Lecture",emoji:"📖",dur:20,color:"#E9D5FF"},
      {id:"b7",label:"Gratitude",emoji:"🌸",dur:5,color:"#FCE7F3"},
    ]},
  ]);});
  var[activeRoutine,setActiveRoutine]=useState(null);
  var[routineBlockIdx,setRoutineBlockIdx]=useState(0);
  var[routineBlockSecs,setRoutineBlockSecs]=useState(0);
  var[routineRunning,setRoutineRunning]=useState(false);
  var[routineRef]=useState({current:null});
  var[editRoutineId,setEditRoutineId]=useState(null);
  var[newRoutineName,setNewRoutineName]=useState("");
  var[newRoutineEmoji,setNewRoutineEmoji]=useState("🌅");
  var[newRoutineColor,setNewRoutineColor]=useState("#F97316");
  var[newBlock,setNewBlock]=useState({label:"",emoji:"⭐",dur:10,color:"#FED7AA"});
  var[draftBlocks,setDraftBlocks]=useState([]);
  var[creatingRoutine,setCreatingRoutine]=useState(false);
  var[routineAiPrompt,setRoutineAiPrompt]=useState("");
  var[routineAiLoading,setRoutineAiLoading]=useState(false);
  var[routineSchedule,setRoutineSchedule]=useState(function(){return ls("routineSchedule",{});});
  var[routineLog,setRoutineLog]=useState(function(){return ls("routineLog",{});});
  var[scheduleDay,setScheduleDay]=useState("lundi");
  var[scheduleTime,setScheduleTime]=useState("07:00");
  var[scheduleRoutineId,setScheduleRoutineId]=useState("");
  var[coachMsgs,setCoachMsgs]=useState(function(){return ls("coachMsgs",[{role:"assistant",text:"Bonjour ! 👋 Je suis ton coach Flowi. Je peux t'aider à décomposer tes tâches, suggérer des stratégies de focus, ou simplement t'encourager. Par où veux-tu commencer ?"}]);});
  var[coachInput,setCoachInput]=useState("");
  var[coachLoading,setCoachLoading]=useState(false);
  var[importNoteOpen,setImportNoteOpen]=useState(false);
  var[importListOpen,setImportListOpen]=useState(false);
  var[importListText,setImportListText]=useState("");
  var[postponeToast,setPostponeToast]=useState(null);
  var[cerveauText,setCerveauText]=useState("");
  var[cerveauEntries,setCerveauEntries]=useState(function(){return ls("cerveauEntries",[]);});
  var[moisSelDay,setMoisSelDay]=useState(null);
  var[flowiMode,setFlowiMode]=useState("chat");
  var[flowiDecomposeText,setFlowiDecomposeText]=useState("");
  var[flowiDecomposeResult,setFlowiDecomposeResult]=useState(null);
  var[flowiDecomposeLoading,setFlowiDecomposeLoading]=useState(false);
  var[flowiPlanResult,setFlowiPlanResult]=useState(null);
  var[flowiPlanLoading,setFlowiPlanLoading]=useState(false);
  var[meditDuration,setMeditDuration]=useState(5);
  var[meditType,setMeditType]=useState("pleine-conscience");
  var[meditPhase,setMeditPhase]=useState("idle");
  var[meditElapsed,setMeditElapsed]=useState(0);
  var[meditGuidance,setMeditGuidance]=useState(null);
  var[meditGuidanceLoading,setMeditGuidanceLoading]=useState(false);
  var[meditPromptIdx,setMeditPromptIdx]=useState(0);
  var[noteInsights,setNoteInsights]=useState({});
  var[noteInsightLoading,setNoteInsightLoading]=useState(null);
  var meditTimerRef=useRef(null);
  var meditPromptRef=useRef(null);
  var[coachOpen,setCoachOpen]=useState(false);
  var coachScrollRef=useRef(null);
  var prioSectionRef=useRef(null);
  var mainScrollRef=useRef(null);
  var scrollPositions=useRef({});
  var[xp,setXp]=useState(function(){return ls("xp",0);});
  var[xpLog,setXpLog]=useState(function(){return ls("xpLog",[]);});
  var[badges,setBadges]=useState(function(){return ls("badges",[]);});
  var[scanOpen,setScanOpen]=useState(false);
  var[scanTarget,setScanTarget]=useState("todos");
  var[scanImg,setScanImg]=useState(null);
  var[scanB64,setScanB64]=useState(null);
  var[scanMime,setScanMime]=useState("image/jpeg");
  var[scanPhase,setScanPhase]=useState("pick");
  var[scanResults,setScanResults]=useState([]);
  var[scanSel,setScanSel]=useState([]);
  var[scanErr,setScanErr]=useState(null);
  var photoRef=useRef(null);
  var galleryRef=useRef(null);

  useEffect(function(){
    if(focusActive){
      timerRef.current=setInterval(function(){
        setFocusSecs(function(s){
          if(s<=1){
            clearInterval(timerRef.current);
            setFocusActive(false);
            setFocusDone(true);
            return focusTotal;
          }
          return s-1;
        });
      },1000);
    }else{
      clearInterval(timerRef.current);
    }
    return function(){clearInterval(timerRef.current);};
  },[focusActive]);

  useEffect(function(){
    if(coachScrollRef.current){coachScrollRef.current.scrollTop=coachScrollRef.current.scrollHeight;}
  },[coachMsgs]);

  useEffect(function(){
    if(badDayActive){
      badDayRef.current=setInterval(function(){
        setBadDayTimer(function(s){
          if(s>=badDayTotal){clearInterval(badDayRef.current);setBadDayActive(false);return badDayTotal;}
          return s+1;
        });
      },1000);
    } else {
      clearInterval(badDayRef.current);
    }
    return function(){clearInterval(badDayRef.current);};
  },[badDayActive]);

  /* ── AUTOSAVE localStorage ── */
  useEffect(function(){
    document.title="Flowi";
    // Inject Google Fonts into document head
    if(!document.getElementById("flowi-fonts")){
      var l1=document.createElement("link");l1.rel="preconnect";l1.href="https://fonts.googleapis.com";document.head.appendChild(l1);
      var l2=document.createElement("link");l2.rel="preconnect";l2.href="https://fonts.gstatic.com";l2.crossOrigin="anonymous";document.head.appendChild(l2);
      var l3=document.createElement("link");l3.id="flowi-fonts";l3.rel="stylesheet";l3.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&display=swap";document.head.appendChild(l3);
    }
  },[]);
  useEffect(function(){
    if(mainScrollRef.current){
      mainScrollRef.current.scrollTop=scrollPositions.current[tab]||0;
    }
  },[tab]);
  useEffect(function(){
    ss("onboarded",onboarded);
    ss("obName",obName);
    ss("obTdah",obTdah);
    ss("obDefis",obDefis);
    ss("obObjectif",obObjectif);
    ss("darkMode",darkMode);
    ss("syncCode",syncCode);
    ss("events",events);
    ss("moods",moods);
    ss("todos",todos);
    ss("notes",notes);
    ss("rappels",rappels);
    ss("agendaNotes",agendaNotes);
    ss("semaineReview",semaineReview);
    ss("habits",habits);
    ss("gratitude",gratitude);
    ss("sleepLog",sleepLog);
    ss("waterLog",waterLog);
    ss("energyLog",energyLog);
    ss("workouts",workouts);
    ss("weight",weight);
    ss("defis",defis);
    ss("jourBlocks",jourBlocks);
    ss("jourPrios",jourPrios);
    ss("jourGratitude",jourGratitude);
    ss("semaineGoals",semaineGoals);
    ss("semaineTasks",semaineTasks);
    ss("moisGoals",moisGoals);
    ss("moisReview",moisReview);
    ss("routines",routines);
    ss("routineSchedule",routineSchedule);
    ss("routineLog",routineLog);
    ss("cerveauEntries",cerveauEntries);
    ss("coachMsgs",coachMsgs);
    ss("xp",xp);
    ss("xpLog",xpLog);
    ss("badges",badges);
  },[onboarded,obName,obTdah,obDefis,obObjectif,darkMode,syncCode,
     events,moods,todos,notes,habits,gratitude,rappels,agendaNotes,semaineReview,
     sleepLog,waterLog,energyLog,workouts,weight,defis,
     jourBlocks,jourPrios,jourGratitude,
     semaineGoals,semaineTasks,moisGoals,moisReview,
     routines,routineSchedule,routineLog,coachMsgs,xp,xpLog,badges]);

  var byDate=function(d){return events.filter(function(e){return e.date===d;});};
  var pm=PM[tab]||PM.agenda;
  var fmtTime=function(s){return pad(Math.floor(s/60))+":"+pad(s%60);};

  var addEvent=function(){
    if(!newEvTitle.trim())return;
    var evDate=newEvDate||selDate;
    setEvents(function(p){return[...p,{id:gid(),title:newEvTitle.trim(),date:evDate,time:newEvTime,endTime:newEvEndTime,category:newEvCat,done:false}];});
    setNewEvTitle("");setNewEvTime("");setNewEvEndTime("");setNewEvDate("");
  };
  var addTodo=function(){if(!newTodo.trim())return;var dueDate=newTodoDue||(todoViewDate!==TODAY?todoViewDate:"");setTodos(function(p){return[...p,{id:gid(),text:newTodo.trim(),done:false,priority:newTodoPriority,due:dueDate,scheduledDate:todoViewDate}];});setNewTodo("");setNewTodoDue("");};

  // ── Complete todo + retire des priorités du jour en remontant les suivantes ──
  var completeTodoById=function(tid,todoText){
    setTodos(function(p){return p.map(function(x){
      if(x.id===tid){
        if(!x.done)earnXp(5,"Tâche accomplie : "+(todoText||x.text).slice(0,30));
        return Object.assign({},x,{done:true,doneDate:TODAY});
      }
      return x;
    });});
    // Retirer du jourPrios et remonter les priorités restantes
    setJourPrios(function(prev){
      var o=Object.assign({},prev);
      var arr=(o[selDate]||["","",""]).slice();
      var idx=arr.indexOf(todoText||"");
      if(idx>=0){
        arr.splice(idx,1);
        arr.push(""); // comble la fin pour toujours avoir 3 slots
        o[selDate]=arr;
      }
      return o;
    });
  };

  // ── ROLLOVER : transfère les tâches non complétées des jours passés vers aujourd'hui ──
  useEffect(function(){
    setTodos(function(prev){
      var changed=false;
      var updated=prev.map(function(t){
        if(!t.done&&t.scheduledDate&&t.scheduledDate<TODAY){
          changed=true;
          return Object.assign({},t,{scheduledDate:TODAY,rolledOver:true});
        }
        return t;
      });
      return changed?updated:prev;
    });
  },[]);
  var addNote=function(){if(!newNote.trim())return;setNotes(function(p){return[...p,{id:gid(),text:newNote.trim(),date:TODAY}];});setNewNote("");};

  var HABIT_EMOJI_MAP=[
    {keys:["cours","run","jogg","sport","gym","fitness","muscul"],emoji:"🏃"},
    {keys:["yoga","étire","stretch"],emoji:"🧘"},
    {keys:["médit","meditat"],emoji:"🧘"},
    {keys:["lecture","lire","livre","book"],emoji:"📚"},
    {keys:["eau","hydrat","boire"],emoji:"💧"},
    {keys:["sommeil","dormir","dodo"],emoji:"😴"},
    {keys:["gratitud","reconnaiss"],emoji:"🙏"},
    {keys:["journal","écriture","write"],emoji:"✍️"},
    {keys:["marche","walk","promenad"],emoji:"🚶"},
    {keys:["vélo","bike","cycl"],emoji:"🚴"},
    {keys:["natation","nager","swim","piscine"],emoji:"🏊"},
    {keys:["vitamines","supplément","pilule"],emoji:"💊"},
    {keys:["fruit","légume","salade","manger"],emoji:"🥗"},
    {keys:["café","thé","tisane"],emoji:"☕"},
    {keys:["musique","guitare","piano","chant"],emoji:"🎵"},
    {keys:["dessin","peinture","art","créat"],emoji:"🎨"},
    {keys:["cuisine","cuisiner","recette"],emoji:"👨‍🍳"},
    {keys:["ménage","range","nettoy"],emoji:"🧹"},
    {keys:["travail","boulot","bureau","focus"],emoji:"💼"},
    {keys:["respirat","souffle","breath"],emoji:"🌬️"},
    {keys:["douche froide","froid"],emoji:"🧊"},
    {keys:["soleil","dehors","nature"],emoji:"☀️"},
    {keys:["social","ami","famille"],emoji:"👥"},
    {keys:["prière","spirituel"],emoji:"🕯️"},
  ];
  var guessHabitEmoji=function(label){
    var low=label.toLowerCase();
    for(var i=0;i<HABIT_EMOJI_MAP.length;i++){
      var entry=HABIT_EMOJI_MAP[i];
      for(var j=0;j<entry.keys.length;j++){
        if(low.indexOf(entry.keys[j])>=0)return entry.emoji;
      }
    }
    return null;
  };
  var addHabitWithIcon=function(label){
    if(!label.trim())return;
    var id=gid();
    var localEmoji=guessHabitEmoji(label);
    setHabits(function(p){return[...p,{id:id,label:label.trim(),icon:localEmoji||"⭐",done:{}}];});
    setNewHabit("");
    if(!localEmoji){
      setHabitIconLoading(true);
      fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:20,
          system:"Respond with ONE emoji only. Nothing else. Just a single emoji character.",
          messages:[{role:"user",content:label.trim()}]
        })
      }).then(function(r){return r.json();}).then(function(data){
        var raw=((data.content&&data.content[0]&&data.content[0].text)||"").trim();
        var emoji=raw.charAt(0)||"⭐";
        setHabits(function(p){return p.map(function(h){return h.id===id?Object.assign({},h,{icon:emoji}):h;});});
        setHabitIconLoading(false);
      }).catch(function(){setHabitIconLoading(false);});
    }
  };
  var autoCompleteHabit=function(keyword){
    setHabits(function(p){
      return p.map(function(h){
        if(h.label.toLowerCase().indexOf(keyword.toLowerCase())>=0){
          var d=Object.assign({},h.done);
          if(!d[TODAY]){
            d[TODAY]=true;
            earnXp(3,"Habitude auto: "+h.label);
          }
          return Object.assign({},h,{done:d});
        }
        return h;
      });
    });
  };

  var addGrocery=function(){if(!newGrocery.trim())return;setGrocery(function(p){return[...p,{id:gid(),text:newGrocery.trim(),done:false}];});setNewGrocery("");};

  var generateIngredients=function(plat){
    if(!plat.trim())return;
    setMealLoading(true);
    setMealIngredients([]);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,system:"Tu es un assistant culinaire. Réponds UNIQUEMENT avec un tableau JSON pur, sans markdown, sans backticks, sans explication. Format: [{\"item\":\"200g poulet\",\"category\":\"Viandes\"},{\"item\":\"2 gousses ail\",\"category\":\"Légumes\"}]. Catégories possibles: Légumes, Fruits, Viandes, Poissons, Produits laitiers, Épices, Céréales, Condiments, Conserves.",messages:[{role:"user",content:"Liste tous les ingrédients nécessaires pour faire: "+plat+". Inclus les quantités approximatives pour 4 personnes."}]})}).then(function(r){return r.json();}).then(function(d){
      try{
        var txt=d.content.filter(function(c){return c.type==="text";}).map(function(c){return c.text;}).join("");
        var clean=txt.replace(/```json|```/g,"").trim();
        var parsed=JSON.parse(clean);
        setMealIngredients(parsed);
      }catch(e){setMealIngredients([{item:"Erreur lors de la génération",category:"Erreur"}]);}
      setMealLoading(false);
    }).catch(function(){setMealLoading(false);setMealIngredients([{item:"Erreur de connexion",category:"Erreur"}]);});
  };

  var searchFlyers=function(){
    if(!flyerLocation.trim())return;
    setFlyerLoading(true);
    setFlyerDeals([]);
    setFlyerError("");
    var groceryItems=grocery.filter(function(g){return !g.done;}).map(function(g){return g.text;}).concat(mealIngredients.map(function(i){return i.item.replace(/^\d+[a-zA-Z]*\s*/,"").split(" ")[0];})).filter(function(x,i,a){return a.indexOf(x)===i;}).slice(0,15).join(", ");
    var searchPrompt=groceryItems.length>3?"Ces articles de ma liste: "+groceryItems+". ":"";
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],system:"Tu es un assistant qui trouve les rabais d'épicerie dans les circulaires. Après ta recherche web, réponds UNIQUEMENT avec un tableau JSON pur sans markdown ni backticks. Format: [{\"store\":\"IGA\",\"item\":\"Poulet entier\",\"price\":\"7.99$/kg\",\"originalPrice\":\"12.99$/kg\",\"savings\":\"38%\",\"validUntil\":\"jeudi\",\"category\":\"Viandes\"},{\"store\":\"Metro\",\"item\":\"Fraises 1lb\",\"price\":\"2.99$\",\"originalPrice\":\"4.99$\",\"savings\":\"40%\",\"validUntil\":\"mercredi\",\"category\":\"Fruits\"}]. Inclus seulement de vraies promotions trouvées. Cherche spécifiquement pour les épiceries IGA, Metro, Maxi, Super C, Provigo dans la région de "+flyerLocation+".",messages:[{role:"user",content:"Cherche les meilleures promotions et rabais de la semaine dans les circulaires d'épicerie (IGA, Metro, Maxi, Super C, Provigo, Walmart épicerie) pour "+flyerLocation+". "+searchPrompt+"Retourne les meilleures offres en JSON pur."}]})}).then(function(r){return r.json();}).then(function(d){
      try{
        var txt=d.content.filter(function(c){return c.type==="text";}).map(function(c){return c.text;}).join("");
        var clean=txt.replace(/```json|```/g,"").trim();
        var jsonStart=clean.indexOf("[");
        if(jsonStart>=0)clean=clean.slice(jsonStart);
        var jsonEnd=clean.lastIndexOf("]");
        if(jsonEnd>=0)clean=clean.slice(0,jsonEnd+1);
        var parsed=JSON.parse(clean);
        setFlyerDeals(parsed);
        setLastFlyerSearch(new Date().toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}));
      }catch(e){setFlyerError("Impossible de récupérer les circulaires. Réessaie.");console.error(e);}
      setFlyerLoading(false);
    }).catch(function(e){setFlyerLoading(false);setFlyerError("Erreur de connexion.");});
  };

  var fetchOracle=function(){
    if(oracleLoading)return;
    setOracleLoading(true);
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-5",
        max_tokens:120,
        messages:[{role:"user",content:"Genere UNE seule pensee positive et inspirante en francais pour bien commencer la journee. Maximum 2 phrases courtes. Ton chaleureux. Reponds UNIQUEMENT avec la pensee, sans guillemets ni introduction."}],
      }),
    }).then(function(res){return res.json();}).then(function(data){
      var txt=(data.content||[]).map(function(b){return b.text||"";}).join("").trim();
      setOracle(txt);setOracleDate(TODAY);setOracleLoading(false);
      localStorage.setItem("as_oracle",txt);localStorage.setItem("as_oracleDate",TODAY);
    }).catch(function(){
      var fallback="Chaque journee est une nouvelle chance. Tu es capable de grandes choses !";
      setOracle(fallback);setOracleDate(TODAY);setOracleLoading(false);
      localStorage.setItem("as_oracle",fallback);localStorage.setItem("as_oracleDate",TODAY);
    });
  };

  // ── XP helper ─────────────────────────────────────────────
  var earnXp=function(amount,reason){
    var LEVELS=[0,50,150,300,500,800,1200,1800,2500,3500,5000];
    var BADGES_DEF=[
      {id:"first50",threshold:50,emoji:"⭐",label:"Premier pas",desc:"50 XP gagnés"},
      {id:"lvl3",threshold:300,emoji:"🔥",label:"En feu",desc:"300 XP gagnés"},
      {id:"lvl5",threshold:800,emoji:"💜",label:"Régulier",desc:"800 XP gagnés"},
      {id:"lvl7",threshold:1800,emoji:"💎",label:"Diamant",desc:"1800 XP gagnés"},
      {id:"lvl10",threshold:5000,emoji:"🏆",label:"Légende",desc:"5000 XP gagnés"},
    ];
    setXp(function(prev){
      var newXp=prev+amount;
      setXpLog(function(p){return[{id:gid(),amount:amount,reason:reason,date:TODAY},...p].slice(0,100);});
      var newBadges=BADGES_DEF.filter(function(b){return newXp>=b.threshold;}).filter(function(b){return !badges.find(function(x){return x.id===b.id;});});
      if(newBadges.length>0)setBadges(function(p){return[...p,...newBadges];});
      return newXp;
    });
  };

  // ── Routine timer ──────────────────────────────────────────
  var startRoutine=function(routine){
    if(routineRef.current)clearInterval(routineRef.current);
    setActiveRoutine(routine);
    setRoutineBlockIdx(0);
    setRoutineBlockSecs(routine.blocks[0].dur*60);
    setRoutineRunning(true);
    routineRef.current=setInterval(function(){
      setRoutineBlockSecs(function(prev){
        if(prev<=1){
          setRoutineBlockIdx(function(bi){
            var next=bi+1;
            if(next>=routine.blocks.length){
              clearInterval(routineRef.current);
              setRoutineRunning(false);
              earnXp(20,"Routine completee : "+routine.name);
              setRoutineLog(function(prev){
                var o=Object.assign({},prev);
                var dates=(o[routine.id]||[]).slice();
                if(dates.indexOf(TODAY)<0)dates.push(TODAY);
                o[routine.id]=dates;
                return o;
              });
              return bi;
            }
            setRoutineBlockSecs(routine.blocks[next].dur*60);
            return next;
          });
          return prev;
        }
        return prev-1;
      });
    },1000);
  };

  var stopRoutine=function(){
    if(routineRef.current)clearInterval(routineRef.current);
    setRoutineRunning(false);
  };

  // ── Coach IA ───────────────────────────────────────────────
  var sendCoach=function(){
    if(!coachInput.trim()||coachLoading)return;
    var userMsg={role:"user",text:coachInput.trim()};
    var history=[...coachMsgs,userMsg];
    setCoachMsgs(history);
    setCoachInput("");
    setCoachLoading(true);
    var apiMsgs=history.map(function(m){return{role:m.role==="assistant"?"assistant":"user",content:m.text};});
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-5",
        max_tokens:600,
        system:"Tu es Flowi, le coach personnel de l'utilisateur dans l'application Flowi. Tu es chaleureux, bienveillant et spécialisé en productivité, organisation et bien-être mental — avec une expertise pour les cerveaux qui fonctionnent différemment. Tu tutoies toujours l'utilisateur. Tu parles avec naturel, comme un ami de confiance qui s'y connaît. Tes réponses sont courtes et ciblées — jamais de pavés, jamais de listes à n points. Tu vas à l'essentiel. Avant de conseiller, tu reconnais l'état de la personne. Si elle est épuisée, tu adaptes. Si elle est dans le flow, tu amplifies. Tu célèbres les petites victoires sans exagérer. Tu ne juges jamais. Tu sais que la productivité n'est pas une question de volonté, chaque cerveau fonctionne à sa façon. Tu proposes toujours des actions concrètes, micro, réalisables maintenant. Quand tu reçois des données (énergie, tâches, humeur, sommeil), tu les utilises pour personnaliser ta réponse sans les lister mécaniquement. Maximum 150 mots. Écris toujours en français.",
        messages:apiMsgs,
      }),
    }).then(function(r){return r.json();}).then(function(d){
      var txt=(d.content||[]).map(function(b){return b.text||"";}).join("").trim();
      setCoachMsgs(function(p){return[...p,{role:"assistant",text:txt}];});
      setCoachLoading(false);
    }).catch(function(){
      setCoachMsgs(function(p){return[...p,{role:"assistant",text:"Desole, je n'arrive pas a me connecter. Reessaie dans un moment !"}];});
      setCoachLoading(false);
    });
  };

  // ── AI task decompose ──────────────────────────────────────
  var decomposeTask=function(taskText){
    var msg="Decompose cette tache en etapes courtes et actionables : "+taskText;
    setCoachInput(msg);
    setTab("coach");
    setTimeout(function(){
      var userMsg={role:"user",text:msg};
      setCoachMsgs(function(p){return[...p,userMsg];});
      setCoachInput("");
      setCoachLoading(true);
      fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-5",
          max_tokens:400,
          system:"Tu es Flowi, coach bienveillant spécialisé en productivité et flow. Quand on te donne une tâche, décompose-la en 4-6 étapes très courtes, concrètes et immédiatement actionnables. Chaque étape doit prendre moins de 15 minutes. Format : liste numérotée. Termine avec une phrase d'encouragement naturelle, comme un ami. Tu tutoies toujours. En français.",
          messages:[{role:"user",content:msg}],
        }),
      }).then(function(r){return r.json();}).then(function(d){
        var txt=(d.content||[]).map(function(b){return b.text||"";}).join("").trim();
        setCoachMsgs(function(p){return[...p,{role:"assistant",text:txt}];});
        setCoachLoading(false);
      }).catch(function(){setCoachLoading(false);});
    },100);
  };

  var collectSyncData=function(){
    return JSON.stringify({
      version:1,
      savedAt:new Date().toISOString(),
      todos:todos,
      notes:notes,
      events:events,
      habits:habits,
      moods:moods,
      energyLog:energyLog,
      waterLog:waterLog,
      sleepLog:sleepLog,
      jourPrios:jourPrios,
      jourGratitude:jourGratitude,
      jourBlocks:jourBlocks,
      semaineGoals:semaineGoals,
      moisGoals:moisGoals,
      defis:defis,
      xp:xp,
      xpHistory:xpHistory,
      badges:badges,
      obName:obName,
      obTdah:obTdah,
      obDefis:obDefis,
      obObjectif:obObjectif,
    });
  };

  var applySyncData=function(raw){
    try{
      var d=JSON.parse(raw);
      if(d.todos)setTodos(d.todos);
      if(d.notes)setNotes(d.notes);
      if(d.events)setEvents(d.events);
      if(d.habits)setHabits(d.habits);
      if(d.moods)setMoods(d.moods);
      if(d.energyLog)setEnergyLog(d.energyLog);
      if(d.waterLog)setWaterLog(d.waterLog);
      if(d.sleepLog)setSleepLog(d.sleepLog);
      if(d.jourPrios)setJourPrios(d.jourPrios);
      if(d.jourGratitude)setJourGratitude(d.jourGratitude);
      if(d.jourBlocks)setJourBlocks(d.jourBlocks);
      if(d.semaineGoals)setSemaineGoals(d.semaineGoals);
      if(d.moisGoals)setMoisGoals(d.moisGoals);
      if(d.defis)setDefis(d.defis);
      if(d.xp)setXp(d.xp);
      if(d.xpHistory)setXpHistory(d.xpHistory);
      if(d.badges)setBadges(d.badges);
      if(d.obName)setObName(d.obName);
      return true;
    }catch(e){return false;}
  };

  var genCode=function(){
    var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var c="";
    for(var i=0;i<6;i++)c+=chars[Math.floor(Math.random()*chars.length)];
    return c;
  };

  var syncSave=function(){
    var code=syncCode||genCode();
    setSyncCode(code);
    setSyncLoading(true);
    setSyncStatus("");
    fetch(WORKER_URL+"/sync/"+code,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:collectSyncData(),
    }).then(function(r){return r.json();}).then(function(d){
      setSyncLoading(false);
      if(d.ok){setSyncStatus("saved");}
      else{setSyncStatus("error");}
    }).catch(function(){setSyncLoading(false);setSyncStatus("error");});
  };

  var syncLoad=function(){
    var code=syncInput.trim().toUpperCase();
    if(code.length!==6){setSyncStatus("invalid");return;}
    setSyncLoading(true);
    setSyncStatus("");
    fetch(WORKER_URL+"/sync/"+code).then(function(r){
      if(r.status===404){setSyncLoading(false);setSyncStatus("notfound");return null;}
      return r.text();
    }).then(function(raw){
      if(!raw)return;
      var ok=applySyncData(raw);
      setSyncLoading(false);
      if(ok){setSyncCode(code);setSyncStatus("loaded");setOnboarded(true);}
      else{setSyncStatus("error");}
    }).catch(function(){setSyncLoading(false);setSyncStatus("error");});
  };

  var openScan=function(target){
    setScanTarget(target);setScanImg(null);setScanB64(null);
    setScanPhase("pick");setScanResults([]);setScanSel([]);setScanErr(null);
    setScanOpen(true);
  };

  var loadPhoto=function(file){
    if(!file)return;
    var r=new FileReader();
    r.onload=function(ev){
      var d=ev.target.result;
      setScanImg(d);
      setScanB64(d.split(",")[1]);
      setScanMime(d.startsWith("data:image/png")?"image/png":"image/jpeg");
      setScanPhase("preview");
      setScanErr(null);
    };
    r.readAsDataURL(file);
  };

  var analyzePhoto=function(){
    setScanPhase("loading");setScanErr(null);
    var prompts={
      todos:"Photo of a handwritten task list. Extract each task. Reply ONLY with JSON array: [{\"text\":\"task\"}]. Nothing else.",
      notes:"Photo of handwritten notes. Transcribe faithfully. Reply ONLY with JSON array: [{\"text\":\"paragraph\"}]. Nothing else.",
      epicerie:"Photo of a handwritten grocery list. Extract each item. Reply ONLY with JSON array: [{\"text\":\"item\"}]. Nothing else.",
      agenda:"Photo d'un agenda papier. Extrais chaque événement ou tâche visible avec l'heure si indiquée. Réponds UNIQUEMENT avec un tableau JSON: [{\"text\":\"09h00 - Réunion équipe\"},{\"text\":\"Appeler médecin\"}]. Rien d'autre.",
      semaine:"Photo d'un agenda hebdomadaire papier. Extrais chaque événement ou tâche avec le jour et l'heure si indiqués. Réponds UNIQUEMENT avec un tableau JSON: [{\"text\":\"Lundi 10h - Réunion\"},{\"text\":\"Mercredi - Dentiste\"}]. Rien d'autre.",
      mois:"Photo d'un agenda mensuel papier. Extrais chaque événement ou tâche avec la date si indiquée. Réponds UNIQUEMENT avec un tableau JSON: [{\"text\":\"15 - Anniversaire Marie\"},{\"text\":\"28 - Voyage Paris\"}]. Rien d'autre.",
    };
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-5",
        max_tokens:800,
        messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:scanMime,data:scanB64}},
          {type:"text",text:prompts[scanTarget]||prompts.todos},
        ]}],
      }),
    }).then(function(res){return res.json();}).then(function(data){
      var txt=(data.content||[]).map(function(b){return b.text||"";}).join("");
      var parsed=[];
      try{parsed=JSON.parse(txt.split("```json").join("").split("```").join("").trim());}catch(e2){parsed=[];}
      if(!Array.isArray(parsed)||parsed.length===0){
        setScanErr("Aucun contenu detecte. Essayez avec une photo plus nette.");
        setScanPhase("preview");
        return;
      }
      var withIds=parsed.map(function(item){return{id:gid(),text:(item.text||"").trim()};}).filter(function(x){return x.text;});
      setScanResults(withIds);
      setScanSel(withIds.map(function(x){return x.id;}));
      setScanPhase("confirm");
    }).catch(function(){
      setScanErr("Erreur reseau. Verifiez votre connexion.");
      setScanPhase("preview");
    });
  };

  var importScan=function(){
    var selected=scanResults.filter(function(x){return scanSel.includes(x.id);});
    if(scanTarget==="todos") setTodos(function(p){return[...p,...selected.map(function(x){return{id:gid(),text:x.text,done:false,priority:"normale",due:""};})];});
    if(scanTarget==="notes") setNotes(function(p){return[...p,...selected.map(function(x){return{id:gid(),text:x.text,date:TODAY};})];});
    if(scanTarget==="epicerie") setGrocery(function(p){return[...p,...selected.map(function(x){return{id:gid(),text:x.text,done:false};})];});
    if(scanTarget==="agenda"||scanTarget==="semaine"||scanTarget==="mois"){
      setTodos(function(p){return[...p,...selected.map(function(x){return{id:gid(),text:x.text,done:false,priority:"normale",due:""};})];});
      setNotes(function(p){return[...p,...selected.map(function(x){return{id:gid(),text:x.text,date:TODAY};})];});
    }
    setScanOpen(false);
  };

  var renderSection=function(){
    if(tab==="agenda") {
      var jourKey=selDate;
      var blocks=jourBlocks[jourKey]||{};
      var prios=(jourPrios[jourKey]||["","",""]);
      var grat=jourGratitude[jourKey]||"";
      var hours=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
      var jourDate=new Date(selDate+"T12:00:00");
      var jourMood=moods[jourKey]||null;
      var jourSleep=sleepLog[jourKey]||{};
      var jourWater=waterLog[jourKey]||0;
      return (
        <div style={{padding:"8px 12px",overflowX:"hidden"}}>

          {/* ── DATE HEADER : date à gauche, calendrier à droite ── */}
          <div style={{display:"flex",gap:0,marginBottom:10,borderRadius:12,background:"linear-gradient(135deg,#E8F4FD,#EDE8F5)",border:"1.5px solid #BAD8FB",overflow:"hidden"}}>

            {/* Date + nav — moitié gauche */}
            <div style={{width:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"6px 10px",borderRight:"1px solid #BAD8FB"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#8090B0",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:1}}>{jourDate.toLocaleDateString("fr-FR",{weekday:"long"})}</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:52,fontWeight:700,color:"#3B82F6",lineHeight:1,margin:"1px 0"}}>{jourDate.getDate()}</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#6080B0",marginBottom:5}}>{MFR_FULL[jourDate.getMonth()]+" "+jourDate.getFullYear()}</p>
              <div style={{display:"flex",gap:5}}>
                <button onClick={function(){var d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()-1);setSelDate(d.toISOString().slice(0,10));}} style={{width:26,height:26,borderRadius:7,border:"1.5px solid #BAD8FB",background:"#FFFFFF",fontSize:13,cursor:"pointer",color:"#3B82F6",fontWeight:700}}>{"<"}</button>
                <button onClick={function(){var d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()+1);setSelDate(d.toISOString().slice(0,10));}} style={{width:26,height:26,borderRadius:7,border:"1.5px solid #BAD8FB",background:"#FFFFFF",fontSize:13,cursor:"pointer",color:"#3B82F6",fontWeight:700}}>{">"}</button>
              </div>
            </div>

            {/* Mini calendrier mensuel — moitié droite */}
            <div style={{width:"50%",display:"flex",alignItems:"stretch"}}>
            {(function(){
              var cy=jourDate.getFullYear(),cm=jourDate.getMonth();
              var firstDay=(new Date(cy,cm,1).getDay()+6)%7;
              var daysInMonth=new Date(cy,cm+1,0).getDate();
              return(
                <div style={{width:"100%",padding:"4px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <button onClick={function(){var d=new Date(selDate+"T12:00:00");d.setMonth(d.getMonth()-1);d.setDate(1);setSelDate(d.toISOString().slice(0,10));}} style={{border:"none",background:"none",fontSize:10,cursor:"pointer",color:"#3B82F6",fontWeight:700,padding:0}}>{"<"}</button>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:800,color:"#1E3A8A"}}>{MFR_FULL[cm]}</p>
                    <button onClick={function(){var d=new Date(selDate+"T12:00:00");d.setMonth(d.getMonth()+1);d.setDate(1);setSelDate(d.toISOString().slice(0,10));}} style={{border:"none",background:"none",fontSize:10,cursor:"pointer",color:"#3B82F6",fontWeight:700,padding:0}}>{">"}</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0,marginBottom:2}}>
                    {["L","M","M","J","V","S","D"].map(function(d,i){return(<p key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:800,color:i>=5?"#F43F5E":"#8090B0",textAlign:"center",lineHeight:1.4}}>{d}</p>);})}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                    {Array.from({length:firstDay}).map(function(_,i){return <div key={"e"+i}/>;})}
                    {Array.from({length:daysInMonth}).map(function(_,i){
                      var day=i+1;
                      var ds=cy+"-"+pad(cm+1)+"-"+pad(day);
                      var isToday=ds===TODAY;
                      var isSel=ds===selDate;
                      return(
                        <button key={day} onClick={function(){setSelDate(ds);}} style={{aspectRatio:"1",borderRadius:3,border:"none",background:isSel?"#3B82F6":isToday?"#DBEAFE":"transparent",color:isSel?"white":isToday?"#1D4ED8":"#1E3A8A",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:isSel||isToday?800:400,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </div>
          </div>

          {/* ── PENSÉE DU JOUR ── */}
          <div onClick={!oracle||oracleDate!==TODAY?fetchOracle:undefined} style={{marginBottom:10,borderRadius:14,background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1.5px solid #C4B5FD",padding:"14px 14px 12px",cursor:(!oracle||oracleDate!==TODAY)&&!oracleLoading?"pointer":"default",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-10,top:-10,width:70,height:70,borderRadius:"50%",background:"rgba(139,92,246,0.06)"}}/>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:1}}>✨</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#8B5CF6",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Pensée du jour</p>
                {oracleLoading?(
                  <div style={{display:"flex",gap:4,alignItems:"center",paddingTop:2}}>
                    {[0,1,2].map(function(d){return(<div key={d} style={{width:5,height:5,borderRadius:"50%",background:"#C4B5FD"}}/>);})}
                  </div>
                ):oracle&&oracleDate===TODAY?(
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:"#4C1D95",lineHeight:1.7,fontStyle:"italic"}}>{oracle}</p>
                ):(
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#A78BFA",fontWeight:500,lineHeight:1.5}}>Touche pour recevoir ta pensée du jour 🌿</p>
                )}
              </div>
              {oracle&&oracleDate===TODAY&&(
                <button onClick={function(e){e.stopPropagation();fetchOracle();}} style={{border:"none",background:"none",fontSize:14,cursor:"pointer",color:"#A78BFA",flexShrink:0,opacity:oracleLoading?0.4:1,padding:0,marginTop:1}} title="Nouvelle pensée">↺</button>
              )}
            </div>
          </div>

          {/* ── VOIX FLOWI ── */}
          {(function(){
            var energy=energyLog[jourKey]||0;
            var pendingCount=todos.filter(function(t){return !t.done;}).length;
            var doneCount=todos.filter(function(t){return t.done&&t.doneDate===TODAY;}).length;
            var nowH=new Date().getHours();
            var msg=null;
            if(energy>=4&&pendingCount>0)msg="Tu es en forme aujourd'hui — c'est le bon moment pour avancer sur ce qui compte. 🔥";
            else if(energy<=2&&pendingCount>3)msg="Avec ton énergie du jour, une ou deux choses bien faites valent mieux que dix à moitié. 🌿";
            else if(doneCount>=3)msg="Tu as déjà accompli "+doneCount+" choses aujourd'hui. C'est réel, même si ça ne semble pas assez. ✨";
            else if(nowH>=19)msg="La journée tire à sa fin. Ce qui n'est pas fait attendra demain — sans jugement. 🌙";
            else if(pendingCount===0)msg="Ta liste est vide. Profites-en pour souffler ou anticiper demain. 🌿";
            if(!msg)return null;
            return(
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#8B5CF6",fontStyle:"italic",lineHeight:1.7,textAlign:"center",padding:"0 4px",marginBottom:8,opacity:0.85}}>{msg}</p>
            );
          })()}

          {/* ── SCAN AGENDA PAPIER ── */}
          <button onClick={function(){openScan("agenda");}} style={{width:"100%",marginBottom:10,padding:"7px 12px",borderRadius:10,border:"1.5px dashed #BFDBFE",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}>
            <span style={{fontSize:14}}>📷</span>
            <p style={{fontSize:11,color:"#1E40AF",fontWeight:600}}>Importer depuis un agenda papier</p>
          </button>

          {/* ── AJOUTER UN ÉVÉNEMENT ── */}
          <div style={{marginBottom:10,padding:"10px 12px",borderRadius:12,background:PM.agenda.light,border:"1.5px solid "+PM.agenda.border}}>
            {/* Titre + bouton */}
            <div style={{display:"flex",gap:6,marginBottom:7}}>
              <input value={newEvTitle} onChange={function(e){setNewEvTitle(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addEvent();}} placeholder="Titre du rendez-vous..." style={{flex:1,border:"1.5px solid "+PM.agenda.border,borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"'Inter',sans-serif",background:"#FFFFFF"}}/>
              <button onClick={addEvent} style={{padding:"6px 14px",borderRadius:8,border:"none",background:PM.agenda.accent,color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>+</button>
            </div>
            {/* Date + Heures */}
            <div style={{display:"flex",gap:6,marginBottom:7,alignItems:"center"}}>
              <input value={newEvDate||selDate} onChange={function(e){setNewEvDate(e.target.value);}} type="date" style={{flex:1,border:"1.5px solid "+PM.agenda.border,borderRadius:8,padding:"5px 7px",fontSize:11,background:"#FFFFFF",color:"#1E3A8A",fontFamily:"'Inter',sans-serif"}}/>
              <input value={newEvTime} onChange={function(e){
                var v=e.target.value;
                setNewEvTime(v);
                if(v){
                  var parts=v.split(":");
                  var h=(parseInt(parts[0])+1)%24;
                  setNewEvEndTime(String(h).padStart(2,"0")+":"+parts[1]);
                }
              }} type="time" style={{width:78,border:"1.5px solid "+PM.agenda.border,borderRadius:8,padding:"5px 7px",fontSize:11,background:"#FFFFFF"}}/>
              <span style={{fontSize:10,color:"#BAD8FB",flexShrink:0}}>→</span>
              <input value={newEvEndTime} onChange={function(e){setNewEvEndTime(e.target.value);}} type="time" style={{width:78,border:"1.5px solid "+PM.agenda.border,borderRadius:8,padding:"5px 7px",fontSize:11,background:"#FFFFFF"}}/>
            </div>
            {/* Catégories */}
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {Object.entries(CATS).map(function(entry){var k=entry[0],cat=entry[1];return(
                <button key={k} onClick={function(){setNewEvCat(k);}} style={{padding:"3px 9px",borderRadius:12,border:"1.5px solid "+(newEvCat===k?cat.color:"#E8EDF5"),background:newEvCat===k?cat.bg:"#FFFFFF",color:newEvCat===k?cat.color:"#8090B0",fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:"pointer"}}>{cat.label}</button>
              );})}
            </div>
          </div>

          {/* ── HORAIRE DE LA JOURNÉE ── */}
          {(function(){
            var dayEvts2=byDate(selDate);
            var nowH=new Date().getHours();
            var HOURS=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
            // Determine which hours to show: hours with content + adjacent empty ones for context
            var activeHours=new Set();
            HOURS.forEach(function(h){
              var hStr=pad(h)+":";
              var hasEvt=dayEvts2.some(function(ev){return ev.time&&ev.time.startsWith(hStr);});
              var hasBlock=(jourBlocks[jourKey]||{})[String(h)];
              var isCurrent=selDate===TODAY&&h===nowH;
              if(hasEvt||hasBlock||isCurrent){
                activeHours.add(h-1);activeHours.add(h);activeHours.add(h+1);
              }
            });
            // Always show at least morning + current hour context
            if(activeHours.size===0)[nowH-1,nowH,nowH+1,8,9].forEach(function(h){activeHours.add(h);});
            var visibleHours=HOURS.filter(function(h){return activeHours.has(h);});
            return(
              <div style={{marginBottom:10,padding:"10px 12px",borderRadius:12,background:"#FFFFFF",border:"1.5px solid #BAD8FB"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <p style={{fontSize:10,color:"#1E3A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>⏰ Horaire</p>
                  {dayEvts2.length>0&&<p style={{fontSize:10,color:PM.agenda.accent,fontWeight:600}}>{dayEvts2.filter(function(e){return e.done;}).length+"/"+dayEvts2.length+" accomplis ✓"}</p>}
                </div>
                <div>
                  {visibleHours.map(function(h,idx){
                    var hKey=String(h);
                    var val=(jourBlocks[jourKey]||{})[hKey]||"";
                    var timeColor=h<12?"#3B82F6":h<18?"#8B5CF6":"#1E3A8A";
                    var hStr=pad(h)+":";
                    var hEvts=dayEvts2.filter(function(ev){return ev.time&&ev.time.startsWith(hStr);});
                    var hasContent=val||hEvts.length>0;
                    var isCurrent=selDate===TODAY&&h===nowH;
                    // Show gap indicator if hours are not consecutive
                    var prevH=visibleHours[idx-1];
                    var showGap=idx>0&&h-prevH>1;
                    return(
                      <div key={h}>
                        {showGap&&<div style={{display:"flex",alignItems:"center",gap:6,margin:"2px 0 2px 32px"}}><div style={{flex:1,height:1,background:"#F0F4FF",borderRadius:1}}/><span style={{fontSize:8,color:"#C4C9D4"}}>···</span><div style={{flex:1,height:1,background:"#F0F4FF",borderRadius:1}}/></div>}
                        <div style={{display:"flex",gap:8,borderLeft:"2px solid "+(isCurrent?"#EF4444":hasContent?timeColor+"88":"#EEF0F8"),paddingLeft:8,marginBottom:2,paddingBottom:4}}>
                          <span style={{fontSize:10,color:isCurrent?"#EF4444":hasContent?timeColor:"#C4C9D4",fontWeight:700,width:24,flexShrink:0,textAlign:"right",paddingTop:4}}>{h+"h"}</span>
                          <div style={{flex:1,minWidth:0}}>
                            {hEvts.map(function(ev){
                              var cat=CATS[ev.category]||{color:"#6B7280",bg:"#F9FAFB"};
                              var timeLabel=ev.time+(ev.endTime?" → "+ev.endTime:"");
                              return(
                                <div key={ev.id} onClick={function(){setEditEvtId(ev.id);}} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"5px 8px",marginBottom:3,borderRadius:8,background:ev.done?"#F8F8F8":cat.bg,border:"1px solid "+(ev.done?"#E5E7EB":cat.color+"44"),cursor:"pointer"}}>
                                  <div style={{width:3,borderRadius:2,alignSelf:"stretch",background:ev.done?"#D1D5DB":cat.color,flexShrink:0,minHeight:16}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,color:ev.done?"#9CA3AF":"#1F2937",fontWeight:600,textDecoration:ev.done?"line-through":"none",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</p>
                                    <p style={{fontSize:9,color:cat.color,fontWeight:600,marginTop:1}}>{timeLabel}</p>
                                    {ev.note&&<p style={{fontSize:9,color:"#9CA3AF",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📝 {ev.note}</p>}
                                  </div>
                                </div>
                              );
                            })}
                            <input value={val} onChange={function(e){var k=hKey;var v=e.target.value;var d=selDate;setJourBlocks(function(prev){var o=Object.assign({},prev);var b=Object.assign({},o[d]||{});b[k]=v;o[d]=b;return o;});}} placeholder={h===6?"Matin...":h===12?"Midi...":h===18?"Soirée...":""} style={{width:"100%",border:"none",fontSize:11,background:val?"#EFF6FF":"transparent",color:"#1E3A8A",padding:"2px 4px",borderRadius:4,fontWeight:val?600:400}}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── ROW 1: Focus + Humeur/Sommeil ── */}
          <div ref={prioSectionRef} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <div style={{borderRadius:10,border:"1.5px solid #BAD8FB",background:"#FFFFFF",padding:"7px 9px",position:"relative"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#1E3A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>🎯 Priorités du jour</p>
              {[0,1,2].map(function(i){
                var val=prios[i]||"";
                var isDone=val&&todos.some(function(t){return t.text===val&&t.done;});
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:val?"#3B82F6":"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",color:val?"white":"#93C5FD",fontSize:8,fontWeight:800,flexShrink:0}}>{isDone?"✓":i+1}</div>
                    {val?(
                      <div style={{flex:1,display:"flex",alignItems:"center",gap:4,padding:"3px 7px",borderRadius:7,background:isDone?"#F0FDF4":"#EFF6FF",border:"1px solid "+(isDone?"#86EFAC":"#BFDBFE")}}>
                        <p style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:11,color:isDone?"#15803D":"#1E40AF",fontWeight:600,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</p>
                        <button onClick={function(){var idx=i;setJourPrios(function(prev){var o=Object.assign({},prev);var arr=(o[jourKey]||["","",""]).slice();arr[idx]="";o[jourKey]=arr;return o;});}} style={{border:"none",background:"none",color:"#93C5FD",fontSize:12,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0}}>×</button>
                      </div>
                    ):(
                      <button onClick={function(){setPrioPickerOpen(i);}} style={{flex:1,padding:"3px 8px",borderRadius:7,border:"1px dashed #BFDBFE",background:"transparent",fontFamily:"'Inter',sans-serif",fontSize:10,color:"#93C5FD",cursor:"pointer",textAlign:"left"}}>+ Choisir une tâche</button>
                    )}
                  </div>
                );
              })}

              {/* Picker dropdown */}
              {prioPickerOpen!==null&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"white",borderRadius:10,border:"1.5px solid #BFDBFE",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",maxHeight:200,overflowY:"auto",marginTop:4}}>
                  {/* Saisie libre */}
                  <div style={{padding:"6px 10px",borderBottom:"1px solid #EFF6FF",display:"flex",gap:6}}>
                    <input
                      autoFocus
                      placeholder="Ou écris une priorité..."
                      style={{flex:1,border:"none",outline:"none",fontSize:11,fontFamily:"'Inter',sans-serif",color:"#1E40AF"}}
                      onKeyDown={function(e){
                        if(e.key==="Enter"&&e.target.value.trim()){
                          var v=e.target.value.trim();var idx=prioPickerOpen;
                          setJourPrios(function(prev){var o=Object.assign({},prev);var arr=(o[jourKey]||["","",""]).slice();arr[idx]=v;o[jourKey]=arr;return o;});
                          setPrioPickerOpen(null);
                        }
                        if(e.key==="Escape")setPrioPickerOpen(null);
                      }}
                    />
                    <button onClick={function(){setPrioPickerOpen(null);}} style={{border:"none",background:"none",color:"#93C5FD",fontSize:14,cursor:"pointer",padding:0}}>×</button>
                  </div>
                  {/* Tâches existantes */}
                  {todos.filter(function(t){return !t.done&&prios.indexOf(t.text)<0;}).slice(0,8).map(function(t){
                    var PICO={urgente:"🔴",haute:"🟠",normale:"🔵",basse:"🟢"};
                    return(
                      <div key={t.id} onClick={function(){
                        var v=t.text;var idx=prioPickerOpen;
                        setJourPrios(function(prev){var o=Object.assign({},prev);var arr=(o[jourKey]||["","",""]).slice();arr[idx]=v;o[jourKey]=arr;return o;});
                        setPrioPickerOpen(null);
                      }} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",cursor:"pointer",borderBottom:"1px solid #F8FAFF"}}>
                        <span style={{fontSize:11,flexShrink:0}}>{PICO[t.priority||"normale"]}</span>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#1F2937",fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</p>
                      </div>
                    );
                  })}
                  {todos.filter(function(t){return !t.done&&prios.indexOf(t.text)<0;}).length===0&&(
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#D1D5DB",textAlign:"center",padding:"12px"}}>Aucune tâche disponible</p>
                  )}
                </div>
              )}
            </div>
            {!isPhone&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{borderRadius:10,border:"1.5px solid #FBCFE8",background:"linear-gradient(135deg,#FDF2F8,#FFF5FB)",padding:"8px 10px",flex:1,display:"flex",flexDirection:"column"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9D174D",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>⚡ Énergie</p>
                <div style={{display:"flex",gap:3,flex:1}}>
                  {[["🪫","Épuisé",1],["⚡","Faible",2],["🔋","Moyen",3],["🔥","Élevé",4],["💥","Max",5]].map(function(e){
                    var sel=(energyLog[jourKey]||0)===e[2];
                    return(<button key={e[2]} onClick={function(){var v=e[2];setEnergyLog(function(p){var o=Object.assign({},p);o[jourKey]=v;return o;});}} style={{flex:1,padding:"6px 2px",borderRadius:8,border:"2px solid "+(sel?"#EC4899":"#F3BAD6"),background:sel?"#FCE7F3":"white",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.15s",transform:sel?"scale(1.05)":"scale(1)"}}>
                      <span style={{fontSize:16}}>{e[0]}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:sel?"#9D174D":"#C084A0",fontWeight:700,lineHeight:1}}>{e[1]}</span>
                    </button>);
                  })}
                </div>
              </div>
              <div style={{borderRadius:10,border:"1.5px solid #C4B5FD",background:"#EDE9FE",padding:"7px 9px",flex:1}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4C1D95",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>🌙 Sommeil</p>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <input type="time" value={jourSleep.bedtime||""} onChange={function(e){var v=e.target.value;setSleepLog(function(p){var o=Object.assign({},p);o[jourKey]=Object.assign({},o[jourKey]||{},{bedtime:v});return o;});}} style={{flex:1,border:"none",background:"transparent",fontFamily:"'Inter',sans-serif",fontSize:11,color:"#4C1D95",fontWeight:700,textAlign:"center"}}/>
                  <span style={{fontSize:10,color:"#A78BFA"}}>→</span>
                  <input type="time" value={jourSleep.waketime||""} onChange={function(e){var v=e.target.value;setSleepLog(function(p){var o=Object.assign({},p);o[jourKey]=Object.assign({},o[jourKey]||{},{waketime:v});return o;});}} style={{flex:1,border:"none",background:"transparent",fontFamily:"'Inter',sans-serif",fontSize:11,color:"#4C1D95",fontWeight:700,textAlign:"center"}}/>
                </div>
              </div>
            </div>}
          </div>

                 {/* ── ROW 2: Rappels + Notes ── */}
          {!isPhone&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <div style={{borderRadius:10,border:"1.5px solid #FCA5A5",background:"#FFFFFF",padding:"7px 9px"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7F1D1D",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>🔔 Rappels</p>
              {[0,1,2,3].map(function(i){return(<div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}><div style={{width:4,height:4,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/><input value={rappels[i]||""} onChange={function(e){var v=e.target.value;var idx=i;setRappels(function(p){var a=p.slice();a[idx]=v;return a;});}} placeholder={"Rappel "+(i+1)+"..."} style={{flex:1,border:"none",borderBottom:"1px solid #FECACA",fontSize:10,fontFamily:"'Inter',sans-serif",background:"transparent",color:"#7F1D1D",padding:"1px 0"}}/></div>);})}
            </div>
            <div style={{borderRadius:10,border:"1.5px solid #A7F3D0",background:"#ECFDF5",padding:"7px 9px"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#065F46",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>📝 Notes</p>
              <textarea value={agendaNotes[jourKey]||""} onChange={function(e){var v=e.target.value;var k=jourKey;setAgendaNotes(function(p){var o=Object.assign({},p);o[k]=v;return o;});}} placeholder="Notes libres..." rows={5} style={{width:"100%",border:"none",background:"transparent",fontSize:11,fontFamily:"'Inter',sans-serif",resize:"none",color:"#065F46",lineHeight:1.6}}/>
            </div>
          </div>
          )}

          {/* ── ROW 3: Tâches ── */}
          {!isPhone?(
          <div style={{marginBottom:6}}>
            <div style={{borderRadius:10,border:"1.5px solid #C4B5FD",background:"#FFFFFF",padding:"7px 9px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4C1D95",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>✅ Tâches</p>
                <button onClick={function(){setTab("todos");}} style={{border:"none",background:"none",fontSize:9,color:"#8B5CF6",fontWeight:700,cursor:"pointer",padding:0,fontFamily:"'Inter',sans-serif"}}>Voir tout →</button>
              </div>
              {(function(){
                var PCOLORS={urgente:"#DC2626",haute:"#EA580C",normale:"#8B5CF6",basse:"#16A34A"};
                var PICON={urgente:"🔴",haute:"🟠",normale:"🔵",basse:"🟢"};
                var prioOrd={urgente:0,haute:1,normale:2,basse:3};
                var sorted=todos.filter(function(t){return !t.done;}).sort(function(a,b){return (prioOrd[a.priority||"normale"]||2)-(prioOrd[b.priority||"normale"]||2);});
                var pinnedTexts=prios.filter(function(p){return p&&p.trim();});
                return sorted.slice(0,6).map(function(t){
                  var col=PCOLORS[t.priority||"normale"]||"#8B5CF6";
                  var ico=PICON[t.priority||"normale"]||"🔵";
                  var tid=t.id;
                  var isOverdue=t.due&&(t.due<TODAY);
                  var isPinned=pinnedTexts.indexOf(t.text)>=0;
                  var pinToday=function(){
                    if(isPinned)return;
                    setJourPrios(function(prev){
                      var o=Object.assign({},prev);
                      var arr=(o[jourKey]||["","",""]).slice();
                      var slot=arr.indexOf("");
                      if(slot===-1)slot=2;
                      arr[slot]=t.text;
                      o[jourKey]=arr;
                      return o;
                    });
                  };
                  return(
                  <div key={t.id} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:4,cursor:"pointer",borderRadius:6,padding:"2px 4px",background:isPinned?"#EFF6FF":"transparent",border:isPinned?"1px solid #BAD8FB":"1px solid transparent",transition:"all 0.15s"}} title={isPinned?"Déjà en priorité":"Ajouter aux priorités du jour"}>
                    <div onClick={function(){completeTodoById(tid,t.text);}} style={{width:12,height:12,borderRadius:3,border:"1.5px solid "+col,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:8,flexShrink:0,marginTop:3}}></div>
                    <div style={{flex:1,minWidth:0}} onClick={pinToday}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:isPinned?"#1E3A8A":col,fontWeight:700,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ico+" "+t.text}</p>
                      {t.due&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:isOverdue?"#DC2626":"#B0A090"}}>{"📅 "+new Date(t.due+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>}
                    </div>
                    <button onClick={pinToday} style={{border:"none",background:"none",padding:0,fontSize:11,cursor:isPinned?"default":"pointer",flexShrink:0,marginTop:1,opacity:isPinned?1:0.4,transition:"opacity 0.15s"}} title={isPinned?"Épinglé":"Épingler en priorité"}>
                      {isPinned?"📌":"📍"}
                    </button>
                  </div>
                  );
                });
              })()}
              {todos.filter(function(t){return !t.done;}).length===0&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#C4B5FD",textAlign:"center",paddingTop:4}}>Aucune tâche !</p>}
            </div>
          </div>
          ):(
          /* ── PETIT ÉCRAN : Tâches d'abord, puis wellness ── */
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:6}}>
            {/* Tâches */}
            <div style={{borderRadius:10,border:"1.5px solid #C4B5FD",background:"#FFFFFF",padding:"7px 9px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4C1D95",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>✅ Tâches</p>
                <button onClick={function(){setTab("todos");}} style={{border:"none",background:"none",fontSize:9,color:"#8B5CF6",fontWeight:700,cursor:"pointer",padding:0,fontFamily:"'Inter',sans-serif"}}>Voir tout →</button>
              </div>
              {(function(){
                var PCOLORS={urgente:"#DC2626",haute:"#EA580C",normale:"#8B5CF6",basse:"#16A34A"};
                var PICON={urgente:"🔴",haute:"🟠",normale:"🔵",basse:"🟢"};
                var prioOrd={urgente:0,haute:1,normale:2,basse:3};
                var sorted=todos.filter(function(t){return !t.done;}).sort(function(a,b){return (prioOrd[a.priority||"normale"]||2)-(prioOrd[b.priority||"normale"]||2);});
                var pinnedTexts=prios.filter(function(p){return p&&p.trim();});
                return sorted.slice(0,6).map(function(t){
                  var col=PCOLORS[t.priority||"normale"]||"#8B5CF6";
                  var ico=PICON[t.priority||"normale"]||"🔵";
                  var tid=t.id;
                  var isOverdue=t.due&&(t.due<TODAY);
                  var isPinned=pinnedTexts.indexOf(t.text)>=0;
                  var pinToday=function(){if(isPinned)return;setJourPrios(function(prev){var o=Object.assign({},prev);var arr=(o[jourKey]||["","",""]).slice();var slot=arr.indexOf("");if(slot===-1)slot=2;arr[slot]=t.text;o[jourKey]=arr;return o;});};
                  return(
                    <div key={t.id} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:4,cursor:"pointer",borderRadius:6,padding:"2px 4px",background:isPinned?"#EFF6FF":"transparent",border:isPinned?"1px solid #BAD8FB":"1px solid transparent"}}>
                      <div onClick={function(){completeTodoById(tid,t.text);}} style={{width:12,height:12,borderRadius:3,border:"1.5px solid "+col,background:"transparent",flexShrink:0,marginTop:3}}></div>
                      <div style={{flex:1,minWidth:0}} onClick={pinToday}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:isPinned?"#1E3A8A":col,fontWeight:700,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ico+" "+t.text}</p>
                        {t.due&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:isOverdue?"#DC2626":"#B0A090"}}>{"📅 "+new Date(t.due+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>}
                      </div>
                    </div>
                  );
                });
              })()}
              {todos.filter(function(t){return !t.done;}).length===0&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#C4B5FD",textAlign:"center",paddingTop:4}}>Aucune tâche !</p>}
            </div>
            {/* Énergie + Sommeil */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{borderRadius:10,border:"1.5px solid #FBCFE8",background:"linear-gradient(135deg,#FDF2F8,#FFF5FB)",padding:"8px 10px"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9D174D",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>⚡ Énergie</p>
                <div style={{display:"flex",gap:4}}>
                  {[["🪫","Épuisé",1],["⚡","Faible",2],["🔋","Moyen",3],["🔥","Élevé",4],["💥","Max",5]].map(function(e){
                    var sel=(energyLog[jourKey]||0)===e[2];
                    return(<button key={e[2]} onClick={function(){var v=e[2];setEnergyLog(function(p){var o=Object.assign({},p);o[jourKey]=v;return o;});}} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"2px solid "+(sel?"#EC4899":"#F3BAD6"),background:sel?"#FCE7F3":"white",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <span style={{fontSize:18}}>{e[0]}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:sel?"#9D174D":"#C084A0",fontWeight:700}}>{e[1]}</span>
                    </button>);
                  })}
                </div>
              </div>
              <div style={{borderRadius:10,border:"1.5px solid #C4B5FD",background:"#EDE9FE",padding:"10px 12px"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4C1D95",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🌙 Sommeil</p>
                <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#A78BFA",marginBottom:3}}>Coucher</span>
                    <input type="time" value={jourSleep.bedtime||""} onChange={function(e){var v=e.target.value;setSleepLog(function(p){var o=Object.assign({},p);o[jourKey]=Object.assign({},o[jourKey]||{},{bedtime:v});return o;});}} style={{width:"100%",border:"1.5px solid #C4B5FD",borderRadius:8,padding:"6px 4px",background:"white",fontSize:13,color:"#4C1D95",fontWeight:700,textAlign:"center"}}/>
                  </div>
                  <span style={{fontSize:16,color:"#A78BFA",flexShrink:0}}>→</span>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#A78BFA",marginBottom:3}}>Réveil</span>
                    <input type="time" value={jourSleep.waketime||""} onChange={function(e){var v=e.target.value;setSleepLog(function(p){var o=Object.assign({},p);o[jourKey]=Object.assign({},o[jourKey]||{},{waketime:v});return o;});}} style={{width:"100%",border:"1.5px solid #C4B5FD",borderRadius:8,padding:"6px 4px",background:"white",fontSize:13,color:"#4C1D95",fontWeight:700,textAlign:"center"}}/>
                  </div>
                </div>
              </div>
            </div>
            {/* Notes */}
            <div style={{borderRadius:10,border:"1.5px solid #A7F3D0",background:"#ECFDF5",padding:"7px 9px"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#065F46",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>📝 Notes</p>
              <textarea value={agendaNotes[jourKey]||""} onChange={function(e){var v=e.target.value;var k=jourKey;setAgendaNotes(function(p){var o=Object.assign({},p);o[k]=v;return o;});}} placeholder="Notes libres..." rows={3} style={{width:"100%",border:"none",background:"transparent",fontSize:11,fontFamily:"'Inter',sans-serif",resize:"none",color:"#065F46",lineHeight:1.6}}/>
            </div>
          </div>
          )}

        </div>
      );
    }
    if(tab==="todos") {
      var PRIOS=[["urgente","🔴","#FEE2E2","#DC2626"],["haute","🟠","#FFEDD5","#EA580C"],["normale","🔵","#EFF6FF","#3B82F6"],["basse","🟢","#F0FDF4","#16A34A"]];
      var prioOrder={urgente:0,haute:1,normale:2,basse:3};
      // Navigation date helpers
      var tvd=todoViewDate;
      var prevDay=function(){var d=new Date(tvd+"T12:00:00");d.setDate(d.getDate()-1);setTodoViewDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));};
      var nextDay=function(){var d=new Date(tvd+"T12:00:00");d.setDate(d.getDate()+1);setTodoViewDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));};
      var isViewingToday=tvd===TODAY;
      var tvdLabel=isViewingToday?"Aujourd'hui":tvd===TOMORROW?"Demain":new Date(tvd+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
      // Filter: show tasks for selected date (due on that date) + tasks with no date when viewing today
      var sortedTodos=todos.filter(function(t){
        if(t.done){
          // Tâches complétées : seulement visibles le jour où elles ont été faites
          return t.doneDate===tvd;
        }
        if(tvd===TODAY){
          // Aujourd'hui : tâches sans date + tâches dues aujourd'hui ou en retard
          return !t.due||t.due<=TODAY||t.scheduledDate===TODAY;
        }
        // Autres jours : seulement les tâches dues ce jour-là
        return t.due===tvd||t.scheduledDate===tvd;
      }).slice().sort(function(a,b){
        if(a.done!==b.done)return a.done?1:-1;
        return (prioOrder[a.priority||"normale"]||2)-(prioOrder[b.priority||"normale"]||2);
      });
      return (
      <div style={{padding:"10px 14px"}}>
        {/* ── SÉLECTEUR DE DATE ── */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",borderRadius:12,background:"#FEFCF8",border:"1.5px solid #EAE0D0"}}>
          <button onClick={prevDay} style={{width:28,height:28,borderRadius:8,border:"1.5px solid #EAE0D0",background:"white",fontSize:14,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center"}}>
            <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:isViewingToday?pm.accent:"#3D4A6A",lineHeight:1,textTransform:"capitalize"}}>{tvdLabel}</p>
            {!isViewingToday&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#B0A090",marginTop:2}}>{sortedTodos.filter(function(t){return !t.done;}).length} tâche{sortedTodos.filter(function(t){return !t.done;}).length!==1?"s":""}</p>}
          </div>
          <button onClick={nextDay} style={{width:28,height:28,borderRadius:8,border:"1.5px solid #EAE0D0",background:"white",fontSize:14,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>›</button>
          {!isViewingToday&&<button onClick={function(){setTodoViewDate(TODAY);}} style={{padding:"4px 10px",borderRadius:8,border:"1.5px solid "+pm.border,background:pm.light,fontSize:10,color:pm.accent,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}>Auj.</button>}
        </div>
        <div style={{background:"#FEFCF8",border:"1.5px solid #EAE0D0",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input value={newTodo} onChange={function(e){setNewTodo(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addTodo();}} placeholder="Nouvelle tâche..." style={{flex:1,border:"1.5px solid #EAE0D0",borderRadius:9,padding:"7px 10px",fontSize:13,background:"#FFFFFF"}}/>
            <button onClick={addTodo} style={{padding:"7px 14px",borderRadius:9,border:"none",background:pm.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>+</button>
          </div>
          {/* Priority selector */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Priorité :</p>
            <div style={{display:"flex",gap:5,flex:1}}>
              {PRIOS.map(function(pr){var sel=newTodoPriority===pr[0];return(
                <button key={pr[0]} onClick={function(){setNewTodoPriority(pr[0]);}} title={pr[0].charAt(0).toUpperCase()+pr[0].slice(1)} style={{flex:1,padding:"5px 2px",borderRadius:9,border:"2px solid "+(sel?pr[3]:"transparent"),background:sel?pr[2]:"#F3F4F6",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",transition:"all 0.15s",boxShadow:sel?"0 2px 8px "+pr[3]+"33":"none"}}>
                  <span style={{fontSize:16,lineHeight:1}}>{pr[1]}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:sel?800:500,color:sel?pr[3]:"#9CA3AF",lineHeight:1}}>{pr[0].charAt(0).toUpperCase()+pr[0].slice(1)}</span>
                </button>
              );})}
            </div>
          </div>
          {/* Due date */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,whiteSpace:"nowrap"}}>Échéance :</p>
            <input type="date" value={newTodoDue} onChange={function(e){setNewTodoDue(e.target.value);}} style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:7,padding:"3px 8px",fontSize:11,background:"white"}}/>
          </div>
        </div>

        {/* ── IMPORTER DEPUIS UNE LISTE ── */}
        <button onClick={function(){openScan("todos");}} style={{width:"100%",marginBottom:10,padding:"7px 12px",borderRadius:10,border:"1.5px dashed #BFDBFE",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}>
          <span style={{fontSize:14}}>📷</span>
          <p style={{fontSize:11,color:"#1E40AF",fontWeight:600}}>Importer depuis une liste</p>
        </button>

        {(function(){
          var energy=energyLog[TODAY]||0;
          var pending=todos.filter(function(t){return !t.done;});
          var urgent=pending.filter(function(t){return t.priority==="urgente";}).length;
          var msg=null;
          if(pending.length===0)msg="Liste vide. C'est une belle place pour souffler. 🌿";
          else if(urgent>=3)msg="Beaucoup d'urgences — essaie d'en choisir une seule pour commencer. 🎯";
          else if(energy<=2&&pending.length>5)msg="Longue liste, énergie basse. Une tâche à la fois, c'est déjà beaucoup. 🌿";
          else if(pending.length>=10)msg=""+pending.length+" tâches en attente. Rappelle-toi : tu n'as pas à tout faire aujourd'hui. ✨";
          if(!msg)return null;
          return <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#8B5CF6",fontStyle:"italic",lineHeight:1.7,textAlign:"center",padding:"4px 8px 8px",opacity:0.85}}>{msg}</p>;
        })()}
        {sortedTodos.length===0&&(
          <div style={{textAlign:"center",padding:"32px 20px"}}>
            <p style={{fontSize:28,marginBottom:10}}>{isViewingToday?"✅":"📅"}</p>
            <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:"#C8B090",fontStyle:"italic",marginBottom:8}}>
              {isViewingToday?"Aucune tâche pour l'instant.":"Aucune tâche prévue ce jour."}
            </p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#D1C8B8",lineHeight:1.6}}>
              {isViewingToday?"C'est un bon début — ajoute ta première tâche.":"Tu peux en ajouter une depuis le champ ci-dessus."}
            </p>
          </div>
        )}

        {sortedTodos.map(function(t){
          var prioInfo=PRIOS.find(function(pr){return pr[0]===(t.priority||"normale");})||PRIOS[2];
          var isOverdue=t.due&&t.due<TODAY&&!t.done;
          var completeTodo=function(){
            completeTodoById(t.id,t.text);
          };
          var deleteTodo=function(){setTodos(function(p){return p.filter(function(x){return x.id!==t.id;});});};
          return(
          <SwipeTask key={t.id} onComplete={t.done?null:completeTodo} onDelete={deleteTodo} disabled={false}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 10px",borderRadius:10,background:t.done?"#F7F3EE":prioInfo[2],border:"1.5px solid "+(t.done?"#EDE5D8":prioInfo[3]+"55"),opacity:t.done?0.65:1,transition:"opacity 0.2s"}}>
            {/* Checkbox */}
            <div onClick={function(){
              if(t.done){
                setTodos(function(p){return p.map(function(x){return x.id===t.id?Object.assign({},x,{done:false,doneDate:null}):x;});});
              } else {
                completeTodoById(t.id,t.text);
              }
            }} style={{width:20,height:20,borderRadius:6,border:"2px solid "+(t.done?pm.accent:"#DDD"),background:t.done?pm.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"white",fontSize:11,flexShrink:0,marginTop:1}}>{t.done?"✓":""}</div>
            {/* Content */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:t.due?2:0}}>
                <span style={{fontSize:11,flexShrink:0}}>{prioInfo[1]}</span>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:t.done?"#B0A090":prioInfo[3],fontWeight:700,textDecoration:t.done?"line-through":"none",lineHeight:1.3,flex:1}}>{t.text}</p>
                {t.rolledOver&&!t.done&&<span title="Reporté depuis hier" style={{fontSize:9,color:"#F97316",fontWeight:700,background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:6,padding:"1px 5px",flexShrink:0}}>↩ reporté</span>}
              </div>
              {t.done&&t.doneDate&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#B0A090",marginTop:1}}>{"✅ "+new Date(t.doneDate+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>}
              {!t.done&&(
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                  <span style={{fontSize:9}}>{t.due&&t.due<TODAY?"⚠️":"📅"}</span>
                  <input
                    type="date"
                    value={t.due||""}
                    onChange={function(e){var v=e.target.value;var tid=t.id;setTodos(function(p){return p.map(function(x){return x.id===tid?Object.assign({},x,{due:v}):x;});});}}
                    style={{border:"none",background:"transparent",fontSize:9,color:t.due?(t.due<TODAY?"#DC2626":"#8090B0"):"#C8C0B8",fontWeight:t.due&&t.due<TODAY?800:400,cursor:"pointer",padding:0,fontFamily:"'Inter',sans-serif",width:t.due?90:80}}
                  />
                  {t.due&&<button onClick={function(e){e.stopPropagation();var tid=t.id;setTodos(function(p){return p.map(function(x){return x.id===tid?Object.assign({},x,{due:""}):x;});});}} style={{border:"none",background:"none",color:"#D1D5DB",fontSize:10,cursor:"pointer",padding:0,lineHeight:1}}>×</button>}
                </div>
              )}
            </div>
            {/* Pin to today's priorities */}
            {(function(){
              var todayPrios=jourPrios[selDate]||["","",""];
              var alreadyPinned=todayPrios.indexOf(t.text)>=0;
              var hasSlot=todayPrios.some(function(p){return !p;});
              if(t.done)return null;
              return(
                <button
                  title={alreadyPinned?"Déjà dans les priorités":hasSlot?"Ajouter aux priorités du jour":"Priorités du jour pleines"}
                  onClick={function(){
                    if(alreadyPinned||!hasSlot)return;
                    var txt=t.text;
                    setJourPrios(function(prev){
                      var o=Object.assign({},prev);
                      var arr=(o[selDate]||["","",""]).slice();
                      var idx=arr.indexOf("");
                      if(idx>=0)arr[idx]=txt;
                      o[selDate]=arr;
                      return o;
                    });
                  }}
                  style={{border:"none",background:"none",fontSize:15,cursor:alreadyPinned||!hasSlot?"not-allowed":"pointer",padding:0,flexShrink:0,opacity:alreadyPinned?1:hasSlot?0.5:0.25,transition:"opacity 0.15s"}}
                >{alreadyPinned?"📌":"📍"}</button>
              );
            })()}
            {!t.done&&<button title="Pas aujourd'hui" onClick={function(){
              setTodos(function(p){return p.map(function(x){return x.id===t.id?Object.assign({},x,{scheduledDate:TOMORROW,rolledOver:false}):x;});});
              setPostponeToast(t.text.slice(0,30));
              setTimeout(function(){setPostponeToast(null);},2800);
            }} style={{border:"1px solid #E0E7FF",background:"#EEF2FF",borderRadius:7,color:"#6366F1",fontSize:11,cursor:"pointer",padding:"3px 7px",flexShrink:0,fontWeight:700}}>🌙</button>}
          </div>
          </SwipeTask>
          );
        })}
      </div>
      );
    }
    if(tab==="notes"){
      var askFlowiNote=function(n){
        if(noteInsightLoading)return;
        setNoteInsightLoading(n.id);
        fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:220,
            system:"Tu es Flowi, coach bienveillant et curieux. Quand on te partage une note ou une pensée, tu l'explores avec douceur. Tu ne juges pas, tu ne donnes pas de listes. Tu poses une question ouverte ou tu offres un reflet éclairant — une phrase ou deux maximum. Tu tutoies toujours. En français.",
            messages:[{role:"user",content:"Voici ma note :\n\n"+n.text}]
          })
        }).then(function(r){return r.json();}).then(function(data){
          var text=(data.content&&data.content[0]&&data.content[0].text)||"";
          setNoteInsights(function(p){var o=Object.assign({},p);o[n.id]=text;return o;});
          setNoteInsightLoading(null);
        }).catch(function(){setNoteInsightLoading(null);});
      };
      return(
        <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
          {/* En-tête */}
          <div style={{padding:"16px 16px 12px",background:"linear-gradient(135deg,#1E1B4B,#312E81)",flexShrink:0}}>
            <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:"white",marginBottom:4}}>📝 Notes</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>Capture tout — idée, pensée, vide-tête.<br/>Sans filtre, sans ordre.</p>
          </div>
          {/* Zone de saisie */}
          <div style={{padding:"12px 14px",background:"linear-gradient(180deg,#312E81 0%,#1E1B4B 60px,#0F0E1A 100%)",flexShrink:0}}>
            <textarea
              value={newNote}
              onChange={function(e){setNewNote(e.target.value);}}
              onKeyDown={function(e){if(e.key==="Enter"&&e.metaKey){addNote();}}}
              onBlur={function(){if(newNote.trim())addNote();}}
              placeholder={"Écris et laisse aller...\n\n- Une idée, une émotion, n'importe quoi\n- ⌘ Entrée pour sauvegarder"}
              rows={4}
              style={{width:"100%",border:"1.5px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'Inter',sans-serif",resize:"none",background:"rgba(255,255,255,0.05)",color:"white",lineHeight:1.7,marginBottom:8,outline:"none"}}
            />
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.2)"}}>Sauvegardé à la frappe</p>
              <button onClick={function(){openScan("notes");}} style={{padding:"6px 12px",borderRadius:10,border:"1.5px solid rgba(167,139,250,0.3)",background:"transparent",fontSize:14,cursor:"pointer"}}>📷</button>
            </div>
          </div>
          {/* Liste des notes */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",background:"#0F0E1A",display:"flex",flexDirection:"column",gap:10}}>
            {notes.length===0&&(
              <div style={{textAlign:"center",padding:"32px 16px"}}>
                <p style={{fontSize:28,marginBottom:10}}>🌫️</p>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:"rgba(255,255,255,0.25)",fontStyle:"italic",lineHeight:1.7}}>Rien encore.<br/>Commence par écrire une pensée.</p>
              </div>
            )}
            {notes.map(function(n){
              var insight=noteInsights[n.id]||null;
              var isLoading=noteInsightLoading===n.id;
              return(
                <div key={n.id} style={{borderRadius:13,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(167,139,250,0.2)",overflow:"hidden"}}>
                  {/* Contenu note */}
                  <div style={{padding:"12px 14px"}}>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{n.text}</p>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(167,139,250,0.5)"}}>{new Date(n.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {!insight&&(
                          <button onClick={function(){askFlowiNote(n);}} disabled={isLoading} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(109,40,217,0.2)",color:"#C4B5FD",fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:700,cursor:isLoading?"not-allowed":"pointer"}}>
                            {isLoading?(
                              <div style={{display:"flex",gap:2,alignItems:"center"}}>{[0,1,2].map(function(d){return <div key={d} style={{width:3,height:3,borderRadius:"50%",background:"#C4B5FD"}}/>;})}</div>
                            ):(
                              <><span style={{fontSize:12}}>🌿</span>Éclairer avec Flowi</>
                            )}
                          </button>
                        )}
                        {insight&&(
                          <button onClick={function(){setNoteInsights(function(p){var o=Object.assign({},p);delete o[n.id];return o;});}} style={{fontSize:9,color:"rgba(167,139,250,0.4)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Effacer réponse</button>
                        )}
                        <button onClick={function(){setNotes(function(p){return p.filter(function(x){return x.id!==n.id;});});}} style={{border:"none",background:"none",color:"rgba(255,255,255,0.2)",fontSize:14,cursor:"pointer",lineHeight:1}}>×</button>
                      </div>
                    </div>
                  </div>
                  {/* Réponse Flowi */}
                  {insight&&(
                    <div style={{padding:"10px 14px 12px",borderTop:"1px solid rgba(109,40,217,0.3)",background:"rgba(109,40,217,0.12)"}}>
                      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#6D28D9,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,marginTop:1}}>🌿</div>
                        <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:"rgba(196,181,253,0.9)",lineHeight:1.8,fontStyle:"italic"}}>{insight}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─── ACCUEIL ──────────────────────────────────────────────
    if(tab==="accueil"){
      var nowH=new Date().getHours();
      var greeting=nowH<6?"Bonne nuit 🌙":nowH<12?"Bonjour ☀️":nowH<18?"Bon après-midi 🌤":nowH<21?"Bonne soirée 🌆":"Bonsoir 🌙";
      var todayPrios=jourPrios[TODAY]||["","",""];
      var todayEvts=byDate(TODAY);
      var doneTodayCount=todos.filter(function(t){return t.done&&t.doneDate===TODAY;}).length;
      var pendingCount=todos.filter(function(t){return !t.done;}).length;
      var todayEnergy=energyLog[TODAY]||0;
      var todayMood=moods[TODAY]||null;
      var moodObj=todayMood?MOODS.find(function(m){return m.id===todayMood;}):null;
      var habDoneToday=habits.filter(function(h){return h.done&&h.done[TODAY];}).length;
      var XPS_LEVELS_D=[
        {lvl:1,label:"Débutant",min:0,emoji:"🌱"},
        {lvl:2,label:"Curieux",min:50,emoji:"🌿"},
        {lvl:3,label:"Régulier",min:150,emoji:"⚡"},
        {lvl:4,label:"Motivé",min:300,emoji:"🔥"},
        {lvl:5,label:"Focalisé",min:500,emoji:"🎯"},
        {lvl:6,label:"Champion",min:800,emoji:"💪"},
        {lvl:7,label:"Expert",min:1200,emoji:"🧠"},
        {lvl:8,label:"Maître",min:1800,emoji:"💎"},
        {lvl:9,label:"Légende",min:2500,emoji:"🌟"},
        {lvl:10,label:"Flow Master",min:3500,emoji:"🏆"},
      ];
      var curLvl=XPS_LEVELS_D.slice().reverse().find(function(l){return xp>=l.min;})||XPS_LEVELS_D[0];
      var nextLvl=XPS_LEVELS_D[curLvl.lvl]||null;
      var xpPct=nextLvl?Math.min(100,Math.round((xp-curLvl.min)/(nextLvl.min-curLvl.min)*100)):100;
      // Streak routines
      var bestStreak=0;
      routines.forEach(function(r){
        var dates=routineLog[r.id]||[];
        var s=0;var d=new Date(TODAY+"T12:00:00");
        while(true){var ds=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());if(dates.indexOf(ds)>=0){s++;d.setDate(d.getDate()-1);}else break;}
        if(s>bestStreak)bestStreak=s;
      });
      // Prochains events (today + future)
      var twoWeeksLater=(function(){var d=new Date();d.setDate(d.getDate()+14);return d.toISOString().slice(0,10);})();
      var upcomingEvts=events.filter(function(e){return e.date>=TODAY&&e.date<=twoWeeksLater;}).sort(function(a,b){return a.date<b.date?-1:1;}).slice(0,3);
      var BIG={fontFamily:"'Playfair Display',Georgia,serif",fontWeight:900,lineHeight:1};
      return(
        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>

          {/* ── SALUTATION ── */}
          <div style={{background:"linear-gradient(135deg,#3730A3,#6D28D9,#7C3AED)",borderRadius:20,padding:"20px 20px 16px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(79,70,229,0.35)"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
            <div style={{position:"absolute",right:30,bottom:-40,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
            <div style={{position:"absolute",left:-10,bottom:-20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.55)",fontWeight:600,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
            <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,color:"white",fontWeight:900,marginBottom:4,lineHeight:1.2}}>{greeting}</p>
            {/* Voix Flowi */}
            {(function(){
              var msgs=[
                nowH<10?"Un jour de plus pour avancer à ton rythme. 🌿":null,
                nowH>=10&&nowH<14&&doneTodayCount>0?"Tu avances bien. Continue comme ça. ✨":null,
                nowH>=14&&nowH<18&&pendingCount>3?"L'après-midi est encore là. Une tâche à la fois. 🎯":null,
                nowH>=18?"La journée tire à sa fin. Ce que tu as fait compte. 🌙":null,
                bestStreak>=5?""+bestStreak+" jours de streak — la constance, c'est du courage. 🔥":null,
                habDoneToday>=3?""+habDoneToday+" habitudes cochées aujourd'hui. Ça s'accumule. 💚":null,
              ].filter(Boolean);
              if(msgs.length===0)return null;
              var msg=msgs[0];
              return <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:"rgba(255,255,255,0.7)",fontStyle:"italic",marginBottom:12,lineHeight:1.6}}>{msg}</p>;
            })()}
            {/* Stats row */}
            <div style={{display:"flex",gap:6,marginTop:4}}>
              {[
                {val:doneTodayCount,label:"fait aujourd'hui",icon:"✅"},
                {val:pendingCount,label:"en attente",icon:"📋"},
                {val:bestStreak>0?bestStreak+"j":"—",label:"streak",icon:"🔥"},
              ].map(function(s,i){return(
                <div key={i} style={{flex:1,background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 6px",textAlign:"center",backdropFilter:"blur(4px)"}}>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:"white",lineHeight:1}}>{s.val}</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.6)",marginTop:3,lineHeight:1.2}}>{s.icon+" "+s.label}</p>
                </div>
              );})}
            </div>
          </div>

          {/* ── SECOURS ── */}
          <div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Outils de secours</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

              {/* Mode urgence */}
              <button onClick={function(){setBadDay(true);setBadDayTimer(0);setBadDayActive(false);}} style={{borderRadius:14,border:"none",background:"linear-gradient(135deg,#1E1B4B,#3730A3)",padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26}}>🌿</span>
                <div>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:2}}>Mode urgence</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>Journée difficile ? Une chose à la fois.</p>
                </div>
              </button>

              {/* Routine rapide 5 min */}
              <button onClick={function(){
                var q={id:"quick5",name:"Routine rapide",emoji:"⚡",color:"#F59E0B",blocks:[
                  {id:"q1",label:"4 grandes respirations",emoji:"🌬️",dur:1,color:"#BAE6FD"},
                  {id:"q2",label:"Écris 1 chose à faire maintenant",emoji:"✏️",dur:1,color:"#C4B5FD"},
                  {id:"q3",label:"Bois un verre d'eau",emoji:"💧",dur:1,color:"#A7F3D0"},
                  {id:"q4",label:"Lance-toi sur cette 1 chose",emoji:"🚀",dur:2,color:"#FDE68A"},
                ]};
                startRoutine(q);
                setTab("routines");
              }} style={{borderRadius:14,border:"none",background:"linear-gradient(135deg,#92400E,#D97706)",padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26}}>⚡</span>
                <div>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:2}}>Routine 5 min</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>Respirer, cibler, agir. C'est tout.</p>
                </div>
              </button>

              {/* Vide-cerveau */}
              <button onClick={function(){setTab("notes");}} style={{borderRadius:14,border:"none",background:"linear-gradient(135deg,#312E81,#6D28D9)",padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26}}>🌫️</span>
                <div>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:2}}>Vide-cerveau</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>Dépose tout. Sans ordre. Sans pression.</p>
                </div>
              </button>

              {/* Pas aujourd'hui */}
              <button onClick={function(){setTab("todos");}} style={{borderRadius:14,border:"none",background:"linear-gradient(135deg,#1F2937,#374151)",padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26}}>🌙</span>
                <div>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:2}}>Pas aujourd'hui</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>Reporter sans culpabilité. C'est correct.</p>
                </div>
              </button>

            </div>
          </div>

          {/* ── XP + NIVEAU ── */}
          <div style={{borderRadius:13,border:"1.5px solid #DDD6FE",background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <p style={Object.assign({},BIG,{fontSize:32,background:"linear-gradient(135deg,#7C3AED,#4F46E5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"})}>{curLvl.emoji}</p>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:900,color:"#4C1D95"}}>{curLvl.label}</p>
                  <p style={Object.assign({},BIG,{fontSize:18,color:"#6D28D9"})}>{xp}<span style={{fontSize:10,fontWeight:400,color:"#A78BFA",marginLeft:2}}>XP</span></p>
                </div>
                <div style={{height:6,background:"#DDD6FE",borderRadius:3,overflow:"hidden",marginTop:4}}>
                  <div style={{height:"100%",width:xpPct+"%",background:"linear-gradient(90deg,#7C3AED,#4F46E5)",borderRadius:3,transition:"width 0.4s"}}/>
                </div>
              </div>
            </div>
            {nextLvl&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7C3AED",textAlign:"right"}}>{nextLvl.min-xp+" XP pour "+nextLvl.label+" "+nextLvl.emoji}</p>}
          </div>

          {/* ── PRIORITÉS DU JOUR ── */}
          <div style={{borderRadius:13,border:"1.5px solid #FED7AA",background:"#FFFBEB",padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#92400E",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>🎯 Priorités du jour</p>
              <button onClick={function(){setTab("agenda");setTimeout(function(){if(prioSectionRef.current)prioSectionRef.current.scrollIntoView({behavior:"smooth",block:"start"});},120);}} style={{fontSize:9,color:"#D97706",background:"none",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Modifier →</button>
            </div>
            {todayPrios.filter(function(p){return p;}).length===0?(
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#D1B896",textAlign:"center",padding:"6px 0"}}>Aucune priorité définie</p>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {todayPrios.map(function(p,i){
                  if(!p)return null;
                  var isDone=todos.some(function(t){return t.text===p&&t.done;});
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,background:isDone?"#F0FDF4":"#FFFFFF",border:"1px solid "+(isDone?"#86EFAC":"#FDE68A")}}>
                      <span style={{fontSize:12,flexShrink:0}}>{isDone?"✅":["🥇","🥈","🥉"][i]}</span>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:isDone?"#6B7280":"#78350F",fontWeight:600,textDecoration:isDone?"line-through":"none",flex:1}}>{p}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── PROCHAINS RDV ── */}
          <div style={{borderRadius:13,border:"1.5px solid #BFDBFE",background:"#EFF6FF",padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#1E40AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>📅 Prochains rendez-vous</p>
              <button onClick={function(){setTab("agenda");}} style={{fontSize:9,color:"#3B82F6",background:"none",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Voir tout →</button>
            </div>
            {upcomingEvts.length===0?(
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#93C5FD",fontStyle:"italic",textAlign:"center",padding:"8px 0"}}>Aucun rendez-vous dans les 2 prochaines semaines 🌿</p>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {upcomingEvts.map(function(ev){
                  var CAT_COLORS={travail:"#3B82F6",sante:"#10B981",social:"#F59E0B",perso:"#8B5CF6",autre:"#6B7280"};
                  var cc=CAT_COLORS[ev.category]||"#3B82F6";
                  var isToday=ev.date===TODAY;
                  var evLabel=isToday?"Aujourd'hui":new Date(ev.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
                  return(
                    <div key={ev.id} onClick={function(){setEditEvtId(ev.id);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,background:"#FFFFFF",border:"1px solid "+cc+"33",cursor:"pointer"}}>
                      <div style={{width:3,borderRadius:2,alignSelf:"stretch",background:cc,flexShrink:0,minHeight:20}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#1F2937",fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{ev.title}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#6B7280",marginTop:1}}>{evLabel+(ev.time?" · "+ev.time:"")}</p>
                      </div>
                      <span style={{fontSize:10,color:"#D1D5DB"}}>›</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── HABITUDES DU JOUR ── */}
          {habits.length>0&&(
            <div style={{borderRadius:13,border:"1.5px solid #A7F3D0",background:"#F0FDF4",padding:"10px 12px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#065F46",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>💚 Habitudes</p>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <p style={Object.assign({},BIG,{fontSize:16,color:"#059669"})}>{habDoneToday}</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#6EE7B7"}}>{"/ "+habits.length}</p>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {habits.map(function(h){
                  var done=h.done&&h.done[TODAY];
                  return(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,background:done?"#D1FAE5":"#FFFFFF",border:"1px solid "+(done?"#6EE7B7":"#D1FAE5")}}>
                      <span style={{fontSize:13}}>{h.icon}</span>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:done?"#065F46":"#9CA3AF",fontWeight:done?700:400}}>{h.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      );
    }
    if(tab==="focus") {
      var focusXp=Math.round(focusTotal/60);
      var pendingTodos=todos.filter(function(t){return !t.done;});
      var focusTask=todos.find(function(t){return t.id===focusTaskId;})||null;
      var pct=focusTotal>0?focusSecs/focusTotal:0;
      var r=70;var circ=2*Math.PI*r;
      var handleFocusDismiss=function(checkTask){
        if(checkTask&&focusTask){
          setTodos(function(p){return p.map(function(t){return t.id===focusTaskId?Object.assign({},t,{done:true}):t;});});
          earnXp(focusXp+5,"Focus: "+focusTask.text);
        } else {
          earnXp(focusXp,"Session focus "+Math.round(focusTotal/60)+"min");
        }
        setFocusDone(false);setFocusTaskId("");
      };
      return (
        <div style={{minHeight:"100%",background:focusActive?"linear-gradient(160deg,#0F172A,#1E1B4B,#1E3A5F)":"#FAFBFF",transition:"background 0.8s ease",display:"flex",flexDirection:"column"}}>

          {/* ── POPUP COMPLETION ── */}
          {focusDone&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)"}}>
              <div style={{background:"white",borderRadius:24,padding:"32px 28px",width:"100%",maxWidth:320,boxShadow:"0 24px 60px rgba(0,0,0,0.3)",textAlign:"center",animation:"fadeIn 0.3s ease"}}>
                <div style={{fontSize:56,marginBottom:12}}>🎉</div>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:"#1E3A8A",marginBottom:4}}>Bien joué !</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:20,lineHeight:1.6}}>{Math.round(focusTotal/60)+" minutes de focus"}<br/>{"+"+(focusTask?focusXp+5:focusXp)+" XP gagnés"}</p>
                {focusTask&&(
                  <button onClick={function(){handleFocusDismiss(true);}} style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#16A34A,#059669)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8,boxShadow:"0 4px 16px rgba(22,163,74,0.35)"}}>
                    ✅ Tâche terminée · +{focusXp+5} XP
                  </button>
                )}
                <button onClick={function(){handleFocusDismiss(false);}} style={{width:"100%",padding:"11px",borderRadius:14,border:"1.5px solid #E5E7EB",background:"#F9FAFB",color:"#6B7280",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {focusTask?"Continuer sans cocher · +"+focusXp+" XP":"Fermer · +"+focusXp+" XP"}
                </button>
              </div>
            </div>
          )}

          {/* ── HERO TIMER ── */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 20px 20px"}}>
            {/* Tâche active */}
            {focusTask&&(
              <div style={{marginBottom:20,padding:"8px 16px",borderRadius:20,background:focusActive?"rgba(255,255,255,0.1)":"rgba(99,102,241,0.08)",border:"1px solid "+(focusActive?"rgba(255,255,255,0.15)":"rgba(99,102,241,0.2)"),maxWidth:280}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:focusActive?"rgba(255,255,255,0.7)":"#6366F1",fontWeight:600,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🎯 {focusTask.text}</p>
              </div>
            )}

            {/* Cercle SVG */}
            <div style={{position:"relative",width:200,height:200,marginBottom:20}}>
              <svg width="200" height="200" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
                <circle cx="100" cy="100" r={r} fill="none" stroke={focusActive?"rgba(255,255,255,0.1)":"#E8EDF5"} strokeWidth="10"/>
                <circle cx="100" cy="100" r={r} fill="none"
                  stroke={focusActive?"#A78BFA":pm.accent}
                  strokeWidth="10"
                  strokeDasharray={String(circ)}
                  strokeDashoffset={String(circ*(1-pct))}
                  strokeLinecap="round"
                  style={{transition:"stroke-dashoffset 1s linear,stroke 0.8s"}}
                />
              </svg>
              {/* Glow effect when active */}
              {focusActive&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.15),transparent)",pointerEvents:"none"}}/>}
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:44,fontWeight:900,color:focusActive?"white":"#1E3A8A",lineHeight:1,letterSpacing:-1,transition:"color 0.8s"}}>{fmtTime(focusSecs)}</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:focusActive?"rgba(255,255,255,0.45)":"#8090B0",marginTop:4,fontWeight:500}}>{Math.round(focusTotal/60)+" min · +"+focusXp+" XP"}</p>
              </div>
            </div>

            {/* Boutons */}
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <button onClick={function(){setFocusActive(false);setFocusSecs(focusTotal);}} style={{width:44,height:44,borderRadius:"50%",border:"1.5px solid "+(focusActive?"rgba(255,255,255,0.2)":"#E8EDF5"),background:focusActive?"rgba(255,255,255,0.08)":"#F8FAFF",color:focusActive?"rgba(255,255,255,0.6)":"#6070A0",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>↺</button>
              <button onClick={function(){setFocusActive(function(f){return !f;});}} style={{padding:"14px 40px",borderRadius:30,border:"none",background:focusActive?"linear-gradient(135deg,#EF4444,#DC2626)":"linear-gradient(135deg,#6366F1,#7C3AED)",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:focusActive?"0 6px 20px rgba(239,68,68,0.4)":"0 6px 20px rgba(99,102,241,0.4)",transition:"all 0.2s",letterSpacing:0.2}}>
                {focusActive?"Pause":"Démarrer"}
              </button>
              {focusActive&&<div style={{width:44}}/>}
            </div>
          </div>

          {/* ── CONFIGURATION (masquée si actif) ── */}
          <div style={{flex:1,background:"white",borderRadius:"24px 24px 0 0",padding:"20px 16px 24px",boxShadow:"0 -4px 24px rgba(0,0,0,0.06)",transition:"all 0.4s",opacity:focusActive?0.4:1,pointerEvents:focusActive?"none":"auto"}}>

            {/* Durées */}
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Durée</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
              {[[5,"Sprint 🏃"],[10,"Pause ☕"],[25,"Pomodoro 🍅"],[30,"Lecture 📖"],[45,"Travail 💼"],[60,"Deep Work 🧠"]].map(function(p){
                var mins=p[0],lbl=p[1],secs=mins*60,sel=focusTotal===secs;
                return(
                  <button key={mins} onClick={function(){if(focusActive)return;setFocusTotal(secs);setFocusSecs(secs);}} style={{padding:"12px 4px",borderRadius:14,border:"2px solid "+(sel?"#6366F1":"#F0F0F8"),background:sel?"linear-gradient(135deg,#EEF2FF,#F5F3FF)":"#FAFBFF",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s",boxShadow:sel?"0 2px 12px rgba(99,102,241,0.15)":"none"}}>
                    <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:sel?"#4F46E5":"#3D4A6A",lineHeight:1}}>{mins}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,color:sel?"#6366F1":"#9CA3AF",lineHeight:1}}>{lbl}</span>
                  </button>
                );
              })}
            </div>

            {/* Personnalisé */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"10px 12px",borderRadius:12,border:"1.5px solid #F0F0F8",background:"#FAFBFF"}}>
              <span style={{fontSize:14}}>⏱</span>
              <input type="number" min="1" max="240" value={focusCustom} onChange={function(e){setFocusCustom(e.target.value);}} placeholder="Durée personnalisée..." style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:600,color:"#3D4A6A",outline:"none"}}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF"}}>min</span>
              <button onClick={function(){var m=parseInt(focusCustom);if(!m||m<1||focusActive)return;var s=m*60;setFocusTotal(s);setFocusSecs(s);setFocusCustom("");}} style={{padding:"5px 14px",borderRadius:9,border:"none",background:"#6366F1",color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK</button>
            </div>

            {/* Tâche */}
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Sur quoi tu travailles ?</p>
            {pendingTodos.length===0?(
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#C4C9D4",fontStyle:"italic",textAlign:"center",padding:"12px 0"}}>Aucune tâche en attente</p>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflowY:"auto"}}>
                <button onClick={function(){setFocusTaskId("");}} style={{padding:"9px 12px",borderRadius:10,border:"1.5px solid "+(focusTaskId===""?"#6366F1":"#F0F0F8"),background:focusTaskId===""?"#EEF2FF":"#FAFBFF",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}}>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:focusTaskId===""?"#4F46E5":"#9CA3AF",fontWeight:focusTaskId===""?700:400}}>Aucune tâche spécifique</span>
                </button>
                {pendingTodos.map(function(t){
                  var sel=focusTaskId===t.id;
                  var PICO={urgente:"🔴",haute:"🟠",normale:"🔵",basse:"🟢"};
                  return(
                    <button key={t.id} onClick={function(){setFocusTaskId(t.id);}} style={{padding:"9px 12px",borderRadius:10,border:"1.5px solid "+(sel?"#6366F1":"#F0F0F8"),background:sel?"#EEF2FF":"#FAFBFF",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all 0.15s"}}>
                      <span style={{fontSize:11,flexShrink:0}}>{PICO[t.priority||"normale"]}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:sel?"#4F46E5":"#374151",fontWeight:sel?700:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
                      {sel&&<div style={{width:18,height:18,borderRadius:"50%",background:"#6366F1",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"white",fontSize:9,fontWeight:800}}>✓</span></div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ─── RESPIRATION ─────────────────────────────────────────
    if(tab==="respiration") return (
      <div style={{padding:"10px 14px"}}>
        {(function(){
          var EXERCISES=[
            {id:0,name:"Cohérence cardiaque",desc:"Stress · équilibre nerveux",color:"#3B82F6",light:"#EFF6FF",phases:[{label:"Inspirer",sec:5},{label:"Expirer",sec:5}]},
            {id:1,name:"Respiration carrée",desc:"Anxiété · concentration",color:"#8B5CF6",light:"#F5F3FF",phases:[{label:"Inspirer",sec:4},{label:"Retenir",sec:4},{label:"Expirer",sec:4},{label:"Pause",sec:4}]},
            {id:2,name:"4-7-8",desc:"Endormissement · calme",color:"#0D9488",light:"#F0FDFA",phases:[{label:"Inspirer",sec:4},{label:"Retenir",sec:7},{label:"Expirer",sec:8}]},
            {id:3,name:"Abdominale",desc:"Détente · ancrage",color:"#16A34A",light:"#F0FDF4",phases:[{label:"Inspirer",sec:4},{label:"Expirer",sec:6},{label:"Pause",sec:2}]},
            {id:4,name:"Wim Hof (doux)",desc:"Énergie · clarté mentale",color:"#EA580C",light:"#FFF7ED",phases:[{label:"Inspirer",sec:2},{label:"Expirer",sec:2}]},
            {id:5,name:"Personnalisé ✏️",desc:"Mon propre exercice",color:"#DB2777",light:"#FFF0F9",phases:breathCustom.phases},
          ];
          var DURATIONS=[1,2,3,5,10];
          var ex=EXERCISES[breathSel];
          var phase=breathPhase;
          var isRunning=phase!==null;
          var phaseIdx=isRunning?(phase%ex.phases.length):0;
          var currentPhase=ex.phases[phaseIdx];
          var isInhale=currentPhase&&currentPhase.label==="Inspirer";
          var isHold=currentPhase&&(currentPhase.label==="Retenir"||currentPhase.label==="Pause");
          var phaseSec=isRunning?breathSecs:0;
          var elapsedMin=Math.floor(breathElapsed/60);
          var elapsedSec=breathElapsed%60;
          var stopBreath=function(){clearTimeout(breathRef.current);clearInterval(breathSecsRef.current);clearInterval(breathElapsedRef.current);setBreathPhase(null);setBreathSecs(0);setBreathElapsed(0);};
          var startBreath=function(){
            if(isRunning){stopBreath();return;}
            var totalSecs=breathDuration*60;
            setBreathElapsed(0);setBreathPhase(0);setBreathSecs(ex.phases[0].sec);
            var stopped=false;var elapsed=0;
            breathElapsedRef.current=setInterval(function(){elapsed++;setBreathElapsed(elapsed);if(elapsed>=totalSecs){stopped=true;clearInterval(breathElapsedRef.current);clearInterval(breathSecsRef.current);clearTimeout(breathRef.current);setBreathPhase(null);setBreathSecs(0);setBreathElapsed(0);earnXp(5,"Respiration ("+breathDuration+"min)");}},1000);
            breathSecsRef.current=setInterval(function(){setBreathSecs(function(p){return p>1?p-1:p;});},1000);
            var scheduleNext=function(idx){var dur=ex.phases[idx].sec*1000;breathRef.current=setTimeout(function(){if(stopped)return;var next=(idx+1)%ex.phases.length;setBreathPhase(function(p){return p===null?null:p+1;});setBreathSecs(ex.phases[next].sec);clearInterval(breathSecsRef.current);breathSecsRef.current=setInterval(function(){setBreathSecs(function(p){return p>1?p-1:p;});},1000);scheduleNext(next);},dur);};
            scheduleNext(0);
          };
          return(
            <div>
              {!isRunning&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
                    {EXERCISES.map(function(e){var sel=breathSel===e.id;return(
                      <button key={e.id} onClick={function(){setBreathSel(e.id);}} style={{padding:"7px 6px",borderRadius:10,border:"1.5px solid "+(sel?e.color:"#E5E7EB"),background:sel?e.light:"#FAFAFA",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:e.color,margin:"0 auto 4px"}}/>
                        <p style={{fontSize:9,color:sel?e.color:"#374151",fontWeight:700,lineHeight:1.3}}>{e.name}</p>
                        <p style={{fontSize:8,color:"#9CA3AF",marginTop:2}}>{e.phases.map(function(p){return p.sec;}).join("-")+"s"}</p>
                      </button>
                    );})}
                  </div>
                  <div style={{marginBottom:10}}>
                    <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Durée</p>
                    <div style={{display:"flex",gap:5}}>
                      {DURATIONS.map(function(d){var sel=breathDuration===d;return(
                        <button key={d} onClick={function(){setBreathDuration(d);}} style={{flex:1,padding:"6px 2px",borderRadius:9,border:"1.5px solid "+(sel?ex.color:"#E5E7EB"),background:sel?ex.light:"#FAFAFA",fontSize:10,color:sel?ex.color:"#6B7280",fontWeight:sel?700:400,cursor:"pointer"}}>{d+"min"}</button>
                      );})}
                    </div>
                  </div>
                  {breathSel===5&&(
                    <div style={{padding:"10px 12px",borderRadius:12,background:"#FFF0F9",border:"1.5px solid #FBCFE8",marginBottom:10}}>
                      <p style={{fontSize:10,color:"#831843",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>✏️ Personnaliser</p>
                      <input value={breathCustom.name} onChange={function(e){var v=e.target.value;setBreathCustom(function(p){return Object.assign({},p,{name:v});});}} placeholder="Nom de l'exercice" style={{width:"100%",border:"1px solid #FBCFE8",borderRadius:7,padding:"5px 8px",fontSize:11,marginBottom:8,background:"white"}}/>
                      {breathCustom.phases.map(function(ph,i){return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                          <select value={ph.label} onChange={function(e){var v=e.target.value;var idx=i;setBreathCustom(function(p){var phases=p.phases.slice();phases[idx]=Object.assign({},phases[idx],{label:v});return Object.assign({},p,{phases:phases});});}} style={{flex:1,border:"1px solid #FBCFE8",borderRadius:7,padding:"4px 6px",fontSize:10,background:"white"}}>
                            {["Inspirer","Retenir","Expirer","Pause"].map(function(o){return(<option key={o}>{o}</option>);})}
                          </select>
                          <input type="number" min={1} max={30} value={ph.sec} onChange={function(e){var v=parseInt(e.target.value)||1;var idx=i;setBreathCustom(function(p){var phases=p.phases.slice();phases[idx]=Object.assign({},phases[idx],{sec:v});return Object.assign({},p,{phases:phases});});}} style={{width:40,border:"1px solid #FBCFE8",borderRadius:7,padding:"4px 6px",fontSize:10,textAlign:"center",background:"white"}}/>
                          <span style={{fontSize:9,color:"#9CA3AF"}}>s</span>
                          {breathCustom.phases.length>1&&(<button onClick={function(){var idx=i;setBreathCustom(function(p){return Object.assign({},p,{phases:p.phases.filter(function(_,j){return j!==idx;})});});}} style={{border:"none",background:"none",color:"#FDA4AF",fontSize:12,cursor:"pointer",padding:0}}>×</button>)}
                        </div>
                      );})}
                      <button onClick={function(){setBreathCustom(function(p){return Object.assign({},p,{phases:[...p.phases,{label:"Inspirer",sec:4}]});});}} style={{width:"100%",padding:"5px",borderRadius:7,border:"1px dashed #FBCFE8",background:"white",fontSize:10,color:"#DB2777",cursor:"pointer",marginTop:2}}>+ Ajouter une phase</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{textAlign:"center",padding:"16px 0 8px"}}>
                {isRunning&&(<div style={{marginBottom:12}}><div style={{height:4,background:ex.light,borderRadius:2,overflow:"hidden",margin:"0 20px"}}><div style={{height:"100%",width:(breathElapsed/(breathDuration*60)*100)+"%",background:ex.color,borderRadius:2,transition:"width 1s linear"}}/></div><p style={{fontSize:10,color:"#9CA3AF",marginTop:4}}>{elapsedMin+"m"+pad(elapsedSec)+"s · "+breathDuration+" min"}</p></div>)}
                <div style={{position:"relative",width:160,height:160,margin:"0 auto 12px"}}>
                  {(function(){var isRetenir=currentPhase&&currentPhase.label==="Retenir";var isPause=currentPhase&&currentPhase.label==="Pause";var holdTransform=isRetenir?"translate(-50%,-50%) scale(1.2)":"translate(-50%,-50%) scale(0.7)";var anim=(!isRunning||isRetenir||isPause)?null:(isInhale?"breathIn "+(currentPhase.sec)+"s ease-in-out forwards":"breathOut "+(currentPhase.sec)+"s ease-in-out forwards");return(<div key={"bubble-"+phase} style={{position:"absolute",top:"50%",left:"50%",width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,"+ex.color+","+ex.color+"CC)",boxShadow:"0 0 40px "+ex.color+(isRunning?"55":"22"),transform:(!isRunning)?"translate(-50%,-50%) scale(0.9)":((isRetenir||isPause)?holdTransform:"translate(-50%,-50%)"),animation:anim||"none"}}/>);})()}
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:2}}>
                    <p style={{fontSize:11,color:"white",fontWeight:700,textAlign:"center",lineHeight:1.3,textShadow:"0 1px 4px rgba(0,0,0,0.4)"}}>{isRunning?currentPhase.label:"Prêt ?"}</p>
                    {isRunning&&<p style={{fontSize:20,color:"white",fontWeight:800,lineHeight:1,textShadow:"0 1px 4px rgba(0,0,0,0.4)"}}>{phaseSec}</p>}
                  </div>
                </div>
                {isRunning&&(<div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:12,flexWrap:"wrap"}}>{ex.phases.map(function(p,i){return(<div key={i} style={{padding:"3px 8px",borderRadius:10,background:phaseIdx===i?ex.color:ex.light,border:"1px solid "+ex.color}}><p style={{fontSize:9,color:phaseIdx===i?"white":ex.color,fontWeight:700}}>{p.label} {p.sec}s</p></div>);})}</div>)}
                {!isRunning&&(<p style={{fontSize:10,color:"#9CA3AF",marginBottom:10}}>{ex.name+" · "+ex.phases.map(function(p){return p.sec;}).join("-")+"s · "+breathDuration+" min"}</p>)}
                <button onClick={startBreath} style={{padding:"10px 32px",borderRadius:24,border:"none",background:isRunning?"#EF4444":ex.color,color:"white",fontWeight:700,fontSize:13,cursor:"pointer"}}>{isRunning?"Arrêter":"Commencer"}</button>
              </div>
            </div>
          );
        })()}
      </div>
    );

    // ─── MÉDITATION ───────────────────────────────────────────
    if(tab==="meditation"){
      var MEDIT_TYPES=[
        {id:"pleine-conscience",label:"Pleine conscience",emoji:"🌿",desc:"Observer sans juger"},
        {id:"body-scan",label:"Body scan",emoji:"🫁",desc:"Parcourir le corps"},
        {id:"visualisation",label:"Visualisation",emoji:"🌅",desc:"Créer un espace intérieur"},
        {id:"gratitude",label:"Gratitude",emoji:"🌸",desc:"Cultiver la reconnaissance"},
      ];
      var MEDIT_DURATIONS=[3,5,10,15,20];
      var selType=MEDIT_TYPES.find(function(t){return t.id===meditType;})||MEDIT_TYPES[0];
      var totalSecs=meditDuration*60;
      var pct=meditPhase==="running"?Math.min(100,Math.round(meditElapsed/totalSecs*100)):0;
      var remaining=Math.max(0,totalSecs-meditElapsed);
      var remMin=Math.floor(remaining/60);
      var remSec=remaining%60;

      // Bell sound via Web Audio API
      var playBell=function(){
        try{
          var ctx=new (window.AudioContext||window.webkitAudioContext)();
          var o=ctx.createOscillator();
          var g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          o.type="sine";o.frequency.setValueAtTime(528,ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+1.2);
          g.gain.setValueAtTime(0.4,ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+2.5);
          o.start(ctx.currentTime);o.stop(ctx.currentTime+2.5);
        }catch(e){}
      };

      var startMedit=function(){
        if(meditPhase==="running"){
          clearInterval(meditTimerRef.current);
          clearInterval(meditPromptRef.current);
          setMeditPhase("idle");
          setMeditElapsed(0);
          setMeditPromptIdx(0);
          return;
        }
        playBell();
        setMeditPhase("running");
        setMeditElapsed(0);
        setMeditPromptIdx(0);
        // Prompt rotation every 20 seconds
        meditPromptRef.current=setInterval(function(){
          setMeditPromptIdx(function(p){return p+1;});
        },20000);
        meditTimerRef.current=setInterval(function(){
          setMeditElapsed(function(prev){
            var next=prev+1;
            if(next>=totalSecs){
              clearInterval(meditTimerRef.current);
              clearInterval(meditPromptRef.current);
              playBell();
              earnXp(10,"Méditation "+meditDuration+"min");
              autoCompleteHabit("médit");
              autoCompleteHabit("meditation");
              setMeditPhase("done");
              return totalSecs;
            }
            return next;
          });
        },1000);
      };

      var fetchGuidance=function(){
        setMeditGuidanceLoading(true);
        setMeditGuidance(null);
        var energy=energyLog[TODAY]||0;
        var ELABELS=["non renseignée","Épuisé","Faible","Moyen","Élevé","Maximum"];
        var mood=moods[TODAY]||null;
        var moodObj=mood?MOODS.find(function(m){return m.id===mood;}):null;
        fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:300,
            system:"Tu es Flowi, coach bienveillant. Tu guides des séances de méditation courtes et accessibles. Ton ton est doux, chaleureux, sans jargon. Tu tutoies toujours. En français.",
            messages:[{role:"user",content:"Je vais faire une méditation de "+meditDuration+" minutes de type "+selType.label+". Mon énergie aujourd'hui : "+ELABELS[energy]+(moodObj?". Mon humeur : "+moodObj.label:"")+".\n\nÉcris une courte guidance de démarrage (3-5 phrases max) pour m'aider à commencer. Commence par m'inviter à m'installer confortablement. Adapte le ton à mon énergie et mon humeur. Pas de titre, juste le texte de guidance."}]
          })
        }).then(function(r){return r.json();}).then(function(data){
          var text=(data.content&&data.content[0]&&data.content[0].text)||"";
          setMeditGuidance(text);
          setMeditGuidanceLoading(false);
        }).catch(function(){setMeditGuidanceLoading(false);});
      };

      return(
        <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#0A0A14"}}>

          {/* ── PHASE IDLE / CONFIG ── */}
          {meditPhase==="idle"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",padding:"20px 16px",gap:20,overflowY:"auto"}}>

              {/* En-tête */}
              <div style={{textAlign:"center",paddingTop:8}}>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:900,color:"white",marginBottom:6}}>🧘 Méditation</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Un moment rien que pour toi.</p>
              </div>

              {/* Type */}
              <div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Type de méditation</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {MEDIT_TYPES.map(function(t){
                    var sel=meditType===t.id;
                    return(
                      <button key={t.id} onClick={function(){setMeditType(t.id);setMeditGuidance(null);}} style={{padding:"12px 10px",borderRadius:12,border:"1.5px solid "+(sel?"rgba(167,139,250,0.8)":"rgba(255,255,255,0.08)"),background:sel?"rgba(109,40,217,0.3)":"rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",transition:"all 0.15s"}}>
                        <span style={{fontSize:22}}>{t.emoji}</span>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:sel?"#C4B5FD":"rgba(255,255,255,0.5)",fontWeight:sel?700:400,lineHeight:1.2,textAlign:"center"}}>{t.label}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.25)",textAlign:"center"}}>{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Durée */}
              <div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Durée</p>
                <div style={{display:"flex",gap:8}}>
                  {MEDIT_DURATIONS.map(function(d){
                    var sel=meditDuration===d;
                    return(
                      <button key={d} onClick={function(){setMeditDuration(d);setMeditGuidance(null);}} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(sel?"rgba(167,139,250,0.8)":"rgba(255,255,255,0.08)"),background:sel?"rgba(109,40,217,0.3)":"rgba(255,255,255,0.04)",cursor:"pointer",transition:"all 0.15s"}}>
                        <p style={{"fontFamily":"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:900,color:sel?"#C4B5FD":"rgba(255,255,255,0.4)",lineHeight:1}}>{d}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"rgba(255,255,255,0.25)",marginTop:2}}>min</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guidance Flowi */}
              <div style={{borderRadius:14,border:"1px solid rgba(167,139,250,0.2)",background:"rgba(109,40,217,0.1)",padding:"12px 14px",minHeight:60}}>
                {meditGuidanceLoading?(
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(167,139,250,0.5)",fontStyle:"italic",textAlign:"center"}}>Flowi prépare ta séance...</p>
                ):meditGuidance?(
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(196,181,253,0.85)",lineHeight:1.8,fontStyle:"italic"}}>{meditGuidance}</p>
                ):(
                  <button onClick={fetchGuidance} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"4px 0"}}>
                    <span style={{fontSize:16}}>🌿</span>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(167,139,250,0.6)",fontWeight:600}}>Demander une guidance à Flowi</p>
                  </button>
                )}
              </div>

              {/* Bouton démarrer */}
              <button onClick={startMedit} style={{width:"100%",padding:"16px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6D28D9,#4F46E5)",color:"white",fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:900,cursor:"pointer",letterSpacing:0.5,boxShadow:"0 4px 24px rgba(109,40,217,0.4)"}}>
                Commencer · {meditDuration} min
              </button>
            </div>
          )}

          {/* ── PHASE RUNNING ── */}
          {meditPhase==="running"&&(function(){
            var TYPE_THEMES={
              "pleine-conscience":{
                color:"#818CF8",glow:"rgba(129,140,248,0.3)",
                prompts:[
                  "Observe ta respiration sans la contrôler.",
                  "Remarque les pensées qui passent. Laisse-les partir.",
                  "Reviens doucement à ce moment présent.",
                  "Sens le contact de ton corps avec ce sur quoi tu es assis.",
                  "Si ton esprit s'égare, c'est normal. Reviens.",
                  "Écoute les sons autour de toi sans les juger.",
                  "Observe les sensations dans ton corps, une par une.",
                  "Tu n'as rien à faire. Juste être là.",
                ],
              },
              "body-scan":{
                color:"#34D399",glow:"rgba(52,211,153,0.3)",
                prompts:[
                  "Porte ton attention sur tes pieds. Remarque chaque sensation.",
                  "Remonte doucement vers les chevilles et les mollets.",
                  "Observe tes genoux, tes cuisses. Relâche toute tension.",
                  "Porte l'attention sur ton ventre. Il monte et descend.",
                  "Sens ta poitrine, tes épaules. Laisse-les s'alourdir.",
                  "Observe tes bras, tes mains, jusqu'au bout des doigts.",
                  "Porte attention à ton cou, ta mâchoire. Relâche.",
                  "Parcours tout ton corps d'un seul regard intérieur.",
                ],
              },
              "visualisation":{
                color:"#F59E0B",glow:"rgba(245,158,11,0.3)",
                prompts:[
                  "Imagine un endroit où tu te sens parfaitement en sécurité.",
                  "Observe les détails — les couleurs, les lumières autour de toi.",
                  "Sens l'air de cet endroit sur ta peau.",
                  "Entends les sons de ce lieu. Laisse-les t'envelopper.",
                  "Tu es exactement là où tu dois être.",
                  "Explore cet espace intérieur à ton rythme.",
                  "Sens la paix de cet endroit entrer dans chaque cellule.",
                  "Emporte cette sensation avec toi dans ta journée.",
                ],
              },
              "gratitude":{
                color:"#F472B6",glow:"rgba(244,114,182,0.3)",
                prompts:[
                  "Pense à une personne qui compte pour toi.",
                  "Songe à quelque chose de simple qui t'a rendu heureux aujourd'hui.",
                  "Rappelle-toi un moment récent où tu as ri.",
                  "Reconnais une qualité que tu apprécies en toi.",
                  "Pense à une chance que tu as et que tu oublies parfois.",
                  "Songe à quelqu'un qui t'a aidé, de près ou de loin.",
                  "Laisse la gratitude remplir ta poitrine comme une lumière.",
                  "Tu as plus que tu ne le crois.",
                ],
              },
            };
            var theme=TYPE_THEMES[meditType]||TYPE_THEMES["pleine-conscience"];
            var prompts=theme.prompts;
            var currentPrompt=prompts[meditPromptIdx%prompts.length];
            return(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",gap:28,background:"radial-gradient(ellipse at center, "+theme.glow+" 0%, transparent 70%)"}}>

                {/* Cercle animé avec couleur du type */}
                <div style={{position:"relative",width:180,height:180}}>
                  <svg width={180} height={180} style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
                    <circle cx={90} cy={90} r={82} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}/>
                    <circle cx={90} cy={90} r={82} fill="none" stroke={theme.color} strokeWidth={6}
                      strokeDasharray={2*Math.PI*82} strokeDashoffset={2*Math.PI*82*(1-pct/100)}
                      style={{transition:"stroke-dashoffset 1s linear"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <p style={{"fontFamily":"'Playfair Display',Georgia,serif",fontSize:38,fontWeight:900,color:"white",lineHeight:1}}>{pad(remMin)+":"+pad(remSec)}</p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:theme.color,marginTop:4,fontWeight:600}}>{selType.emoji+" "+selType.label}</p>
                  </div>
                </div>

                {/* Prompt rotatif */}
                <div style={{maxWidth:260,textAlign:"center",minHeight:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <p key={meditPromptIdx} style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:"rgba(255,255,255,0.75)",lineHeight:1.8,fontStyle:"italic"}}>
                    {currentPrompt}
                  </p>
                </div>

                {/* Guidance Flowi si présente */}
                {meditGuidance&&meditPromptIdx===0&&(
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(196,181,253,0.5)",lineHeight:1.6,fontStyle:"italic",textAlign:"center",maxWidth:260}}>{meditGuidance}</p>
                )}

                {/* Arrêter */}
                <button onClick={startMedit} style={{padding:"10px 28px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.25)",fontFamily:"'Inter',sans-serif",fontSize:11,cursor:"pointer"}}>
                  Terminer
                </button>
              </div>
            );
          })()}

          {/* ── PHASE DONE ── */}
          {meditPhase==="done"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",gap:20,textAlign:"center"}}>
              <span style={{fontSize:48}}>🌸</span>
              <div>
                <p style={{"fontFamily":"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:"white",marginBottom:8}}>Belle séance.</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.7}}>{"Tu viens de méditer "+meditDuration+" minutes."}<br/>C'est un cadeau que tu te fais.</p>
              </div>
              <div style={{padding:"12px 20px",borderRadius:12,background:"rgba(109,40,217,0.2)",border:"1px solid rgba(167,139,250,0.3)"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(196,181,253,0.8)"}}>{"✨ +10 XP gagnés"}</p>
              </div>
              <button onClick={function(){setMeditPhase("idle");setMeditElapsed(0);setMeditGuidance(null);}} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"rgba(109,40,217,0.4)",color:"white",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Recommencer
              </button>
            </div>
          )}

        </div>
      );
    }

    // ─── BIEN-ETRE ───────────────────────────────────────────
    if(tab==="wellness") return (
      <div style={{padding:"10px 14px"}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Niveau d'énergie</p>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {[["🪫","Épuisé",1],["⚡","Faible",2],["🔋","Moyen",3],["🔥","Élevé",4],["💥","Maximum",5]].map(function(e){
            var sel=(energyLog[TODAY]||0)===e[2];
            return(<button key={e[2]} onClick={function(){setEnergyLog(function(p){var o=Object.assign({},p);o[TODAY]=e[2];return o;});}} style={{flex:1,padding:"8px 3px",borderRadius:10,border:"2px solid "+(sel?pm.accent:"#E8EDF5"),background:sel?pm.light:"#F8FAFF",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:18}}>{e[0]}</span>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:sel?pm.text:"#8090B0",fontWeight:700}}>{e[1]}</span>
            </button>);
          })}
        </div>

        <div style={{height:1,background:"#E8EDF5",marginBottom:12}}/>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Habitudes du {new Date(TODAY+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p>
        {habits.map(function(h){
          var done=h.done[TODAY];
          return(
            <SwipeTask key={h.id} onDelete={function(){setHabits(function(p){return p.filter(function(x){return x.id!==h.id;});});}} onComplete={done?null:function(){setHabits(function(p){return p.map(function(x){if(x.id!==h.id)return x;var d=Object.assign({},x.done);d[TODAY]=true;earnXp(3,'Habitude: '+x.label);return Object.assign({},x,{done:d});});});}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,borderRadius:12,background:done?pm.light:"#F8FAFF",border:"1.5px solid "+(done?pm.border:"#E8EDF5"),transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}} onClick={function(){setHabits(function(p){return p.map(function(x){if(x.id!==h.id)return x;var d=Object.assign({},x.done);var wasOn=d[TODAY];d[TODAY]=!wasOn;if(!wasOn)earnXp(3,'Habitude: '+x.label);return Object.assign({},x,{done:d});});})}}>
                <span style={{fontSize:20}}>{h.icon}</span>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:done?pm.text:"#3D4A6A",flex:1,textDecoration:done?"line-through":"none"}}>{h.label}</p>
                <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(done?pm.accent:"#D0D8EA"),background:done?pm.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,flexShrink:0}}>{done?"✓":""}</div>
              </div>
            </div>
            </SwipeTask>
          );
        })}
        <div style={{display:"flex",gap:6,marginTop:8,marginBottom:14}}>
          <input value={newHabit} onChange={function(e){setNewHabit(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newHabit.trim())addHabitWithIcon(newHabit);}} placeholder="Ajouter une habitude..." style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:9,padding:"6px 10px",fontSize:13,background:"#FFFFFF"}}/>
          <button onClick={function(){addHabitWithIcon(newHabit);}} disabled={habitIconLoading||!newHabit.trim()} style={{padding:"6px 12px",borderRadius:9,border:"none",background:habitIconLoading?"#E5E7EB":pm.accent,color:"white",fontSize:13,fontWeight:700,cursor:habitIconLoading?"not-allowed":"pointer"}}>{habitIconLoading?"⟳":"+"}</button>
        </div>

        <div style={{height:1,background:"#E8EDF5",marginBottom:12}}/>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Gratitude du jour</p>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <input value={newGratitude} onChange={function(e){setNewGratitude(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newGratitude.trim()){setGratitude(function(p){var o=Object.assign({},p);o[TODAY]=[...(o[TODAY]||[]),newGratitude.trim()];return o;});autoCompleteHabit("gratitude");setNewGratitude("");}}} placeholder="Je suis reconnaissant(e) pour..." style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:9,padding:"6px 10px",fontSize:13,background:"#FFFFFF"}}/>
          <button onClick={function(){if(!newGratitude.trim())return;setGratitude(function(p){var o=Object.assign({},p);o[TODAY]=[...(o[TODAY]||[]),newGratitude.trim()];return o;});autoCompleteHabit("gratitude");setNewGratitude("");}} style={{padding:"6px 12px",borderRadius:9,border:"none",background:pm.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>+</button>
        </div>
        {(gratitude[TODAY]||[]).map(function(g,i){return(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"6px 10px",marginBottom:4,borderRadius:9,background:pm.light,border:"1.5px solid "+pm.border}}>
            <span style={{fontSize:14,marginTop:1}}>🙏</span>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:pm.text,flex:1,lineHeight:1.4}}>{g}</p>
            <button onClick={function(){setGratitude(function(p){var o=Object.assign({},p);o[TODAY]=(o[TODAY]||[]).filter(function(_,j){return j!==i;});return o;});}} style={{border:"none",background:"none",color:"#CCC",fontSize:14,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        );})}

        <div style={{height:1,background:"#E8EDF5",margin:"12px 0"}}/>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Hydratation</p>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",gap:4,marginBottom:5}}>
            {[1,2,3,4,5,6,7,8].map(function(n){
              var filled=(waterLog[TODAY]||0)>=n;
              return(<button key={n} onClick={function(){setWaterLog(function(p){var o=Object.assign({},p);o[TODAY]=n;return o;});}} style={{flex:1,height:34,borderRadius:9,border:"2px solid "+(filled?"#29B6F6":"#E8EDF5"),background:filled?"#E1F5FE":"#F8FAFF",fontSize:15,cursor:"pointer",transition:"all 0.1s"}}>💧</button>);
            })}
          </div>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#29B6F6",textAlign:"center",fontWeight:700}}>{(waterLog[TODAY]||0)+" / 8 verres"}</p>
        </div>

        <div style={{height:1,background:"#E8EDF5",marginBottom:12}}/>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Seance du jour</p>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          {["🏃 Course","🚴 Velo","💪 Muscu","🧘 Yoga","🏊 Natation","🚶 Marche","⚽ Sport","🤸 Stretching"].map(function(t){
            var sel=newWorkout.type===t;
            return(<button key={t} onClick={function(){setNewWorkout(function(p){return Object.assign({},p,{type:sel?"":t});});}} style={{padding:"4px 10px",borderRadius:16,border:"1.5px solid "+(sel?pm.accent:"#E8EDF5"),background:sel?pm.light:"#F8FAFF",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:sel?pm.text:"#6070A0",cursor:"pointer"}}>{t}</button>);
          })}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <input type="number" value={newWorkout.dur} onChange={function(e){setNewWorkout(function(p){return Object.assign({},p,{dur:e.target.value});});}} placeholder="Duree (min)" style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:9,padding:"6px 10px",fontSize:13,background:"#FFFFFF"}}/>
          <button onClick={function(){if(!newWorkout.type||!newWorkout.dur)return;setWorkouts(function(p){return[...p,{id:gid(),type:newWorkout.type,dur:parseInt(newWorkout.dur),date:TODAY}];});setNewWorkout({type:"",dur:""});earnXp(5,"Seance sportive");}} style={{padding:"6px 14px",borderRadius:9,border:"none",background:pm.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
        </div>
        {workouts.filter(function(w){return w.date===TODAY;}).length>0&&(
          <div style={{marginBottom:10}}>
            {workouts.filter(function(w){return w.date===TODAY;}).map(function(w){return(
              <div key={w.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",marginBottom:3,borderRadius:9,background:pm.light,border:"1.5px solid "+pm.border}}>
                <span style={{fontSize:15}}>{w.type.split(" ")[0]}</span>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,color:pm.text,flex:1}}>{w.type.slice(w.type.indexOf(" ")+1)}</p>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:pm.accent,fontWeight:700}}>{w.dur+" min"}</span>
                <button onClick={function(){setWorkouts(function(p){return p.filter(function(x){return x.id!==w.id;});});}} style={{border:"none",background:"none",color:"#CCC",fontSize:14,cursor:"pointer"}}>×</button>
              </div>
            );})}
          </div>
        )}

      </div>
    );

    // ─── DEFIS ───────────────────────────────────────────────
    if(tab==="defis") return (
      <div style={{padding:"10px 14px"}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B0A090",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Nouveau defi</p>
        <div style={{padding:"10px 12px",borderRadius:14,background:pm.light,border:"1.5px solid "+pm.border,marginBottom:12}}>
          <input value={newDefi} onChange={function(e){setNewDefi(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newDefi.trim()){setDefis(function(p){return[...p,{id:gid(),title:newDefi.trim(),start:TODAY,days:newDefiDays,done:{}}];});setNewDefi("");}}} placeholder="Ex: 30 jours sans reseaux sociaux..." style={{width:"100%",border:"1.5px solid #E8EDF5",borderRadius:9,padding:"7px 10px",fontSize:13,background:"#FFFFFF",marginBottom:8}}/>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#8090B0",fontWeight:700,marginBottom:6}}>Duree :</p>
          <div style={{display:"flex",gap:5,marginBottom:8}}>
            {[7,14,21,30,66,100].map(function(d){
              var sel=newDefiDays===d;
              return(<button key={d} onClick={function(){setNewDefiDays(d);}} style={{flex:1,padding:"5px 2px",borderRadius:9,border:"1.5px solid "+(sel?pm.accent:"#E8EDF5"),background:sel?pm.accent:"#F8FAFF",color:sel?"white":"#6070A0",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{d+"j"}</button>);
            })}
          </div>
          <button onClick={function(){if(!newDefi.trim())return;setDefis(function(p){return[...p,{id:gid(),title:newDefi.trim(),start:TODAY,days:newDefiDays,done:{}}];});setNewDefi("");}} style={{width:"100%",padding:"8px",borderRadius:9,border:"none",background:pm.accent,color:"white",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Lancer le defi 🎯</button>
        </div>
        {defis.length===0&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"#C8D0E0",textAlign:"center",paddingTop:10}}>Lance ton premier defi !</p>}
        {defis.map(function(d){
          var doneToday=d.done[TODAY];
          var streak=Object.values(d.done).filter(Boolean).length;
          var pct=Math.min(100,Math.round(streak/d.days*100));
          var badge=pct>=100?"🏆":pct>=75?"🥇":pct>=50?"🥈":pct>=25?"🥉":"🎯";
          return(
            <div key={d.id} style={{marginBottom:12,padding:"12px 14px",borderRadius:14,background:doneToday?pm.light:"#F8FAFF",border:"1.5px solid "+(doneToday?pm.border:"#E8EDF5")}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:20}}>{badge}</span>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:800,color:pm.text,flex:1}}>{d.title}</p>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:pm.accent,fontWeight:700,background:pm.light,padding:"2px 8px",borderRadius:8}}>{streak+"/"+d.days+"j"}</span>
                <button onClick={function(){setDefis(function(p){return p.filter(function(x){return x.id!==d.id;});});}} style={{border:"none",background:"none",color:"#CCC",fontSize:15,cursor:"pointer"}}>×</button>
              </div>
              <div style={{height:8,background:"#E8EDF5",borderRadius:4,marginBottom:6,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct+"%",background:pct>=100?"#F59E0B":pm.accent,borderRadius:4,transition:"width 0.4s"}}/>
              </div>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#8090B0",marginBottom:8}}>{pct+"%  — Commence le "+new Date(d.start+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:2,marginBottom:8}}>
                {Array.from({length:Math.min(d.days,30)}).map(function(_,i){
                  var dt=new Date(d.start+"T12:00:00");dt.setDate(dt.getDate()+i);
                  var ds=dt.toISOString().slice(0,10);
                  return(<div key={i} onClick={function(){setDefis(function(p){return p.map(function(x){if(x.id!==d.id)return x;var dn=Object.assign({},x.done);dn[ds]=!dn[ds];return Object.assign({},x,{done:dn});});});}} style={{aspectRatio:"1",borderRadius:3,background:d.done[ds]?pm.accent:"#E8EDF5",cursor:"pointer",border:ds===TODAY?"2px solid "+pm.text:"none",transition:"background 0.15s"}}/>);
                })}
              </div>
              <button onClick={function(){setDefis(function(p){return p.map(function(x){if(x.id!==d.id)return x;var dn=Object.assign({},x.done);dn[TODAY]=!dn[TODAY];return Object.assign({},x,{done:dn});});});}} style={{width:"100%",padding:"9px",borderRadius:10,border:"none",background:doneToday?"#F0F4FF":pm.accent,color:doneToday?pm.text:"white",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s"}}>
                {doneToday?"✓ Fait aujourd'hui":"Marquer comme fait aujourd'hui"}
              </button>
            </div>
          );
        })}
      </div>
    );

    // ─── VOYAGE ──────────────────────────────────────────────

    // ─── CREATIVITE ──────────────────────────────────────────


    // ─── PLANIFICATION JOURNALIERE ───────────────────────────
    // ─── PLANIFICATION SEMAINE ────────────────────────────────
    if(tab==="semaine") {
      var weekStart=new Date(selDate+"T12:00:00");
      var dow=(weekStart.getDay()+6)%7;
      weekStart.setDate(weekStart.getDate()-dow);
      var weekDays=[];
      for(var wi=0;wi<7;wi++){var wd=new Date(weekStart);wd.setDate(wd.getDate()+wi);weekDays.push(wd.toISOString().slice(0,10));}
      var dayNames=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
      var goNextWeek=function(){var d=new Date(weekDays[0]+"T12:00:00");d.setDate(d.getDate()+7);setSelDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));};
      var goPrevWeek=function(){var d=new Date(weekDays[0]+"T12:00:00");d.setDate(d.getDate()-7);setSelDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));};
      var swipeSemaine=makeSwipeNav(goNextWeek,goPrevWeek);
      return (
        <div style={{padding:"10px 14px",userSelect:"none"}} {...swipeSemaine}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={goPrevWeek} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+pm.border,background:"#FFF",fontSize:18,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{"‹"}</button>
            <div style={{textAlign:"center"}}>
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:pm.accent,lineHeight:1}}>
                {"Semaine du "+new Date(weekDays[0]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
              </p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",marginTop:2}}>
                {"au "+new Date(weekDays[6]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
              </p>
            </div>
            <button onClick={goNextWeek} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+pm.border,background:"#FFF",fontSize:18,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{"›"}</button>
          </div>

          {/* Scan semaine papier */}
          <button onClick={function(){openScan("semaine");}} style={{width:"100%",marginBottom:12,padding:"7px 12px",borderRadius:10,border:"1.5px dashed "+pm.border,background:pm.light,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}>
            <span style={{fontSize:14}}>📷</span>
            <p style={{fontSize:11,color:pm.text,fontWeight:600}}>Importer depuis un agenda papier</p>
          </button>

          {/* Weekly goals */}
          <div style={{marginBottom:12,padding:"10px 12px",borderRadius:12,background:pm.light,border:"1.5px solid "+pm.border}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>🎯 Objectifs de la semaine</p>
            {semaineGoals.map(function(g){return(
              <div key={g.id} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                <div onClick={function(){setSemaineGoals(function(p){return p.map(function(x){return x.id===g.id?Object.assign({},x,{done:!x.done}):x;});});}} style={{width:18,height:18,borderRadius:5,border:"2px solid "+(g.done?pm.accent:"#C4B5FD"),background:g.done?pm.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,flexShrink:0,cursor:"pointer"}}>{g.done?"✓":""}</div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:g.done?"#A0A0C0":pm.text,fontWeight:600,flex:1,textDecoration:g.done?"line-through":"none"}}>{g.text}</p>
                <button onClick={function(){setSemaineGoals(function(p){return p.filter(function(x){return x.id!==g.id;});});}} style={{border:"none",background:"none",color:"#CCC",fontSize:14,cursor:"pointer"}}>×</button>
              </div>
            );})}
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <input value={newSemaineGoal} onChange={function(e){setNewSemaineGoal(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newSemaineGoal.trim()){setSemaineGoals(function(p){return[...p,{id:gid(),text:newSemaineGoal.trim(),done:false}];});setNewSemaineGoal("");}}} placeholder="Ajouter un objectif..." style={{flex:1,border:"1.5px solid "+pm.border,borderRadius:8,padding:"5px 9px",fontSize:12,fontFamily:"'Inter',sans-serif",background:"#FFFFFF"}}/>
              <button onClick={function(){if(!newSemaineGoal.trim())return;setSemaineGoals(function(p){return[...p,{id:gid(),text:newSemaineGoal.trim(),done:false}];});setNewSemaineGoal("");}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:pm.accent,color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>+</button>
            </div>
          </div>

          {/* 7 day columns */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12}}>
            {weekDays.map(function(wd,wi){
              var isToday=wd===TODAY;
              var isSel=wd===selDate;
              var CAT_C={travail:"#3B82F6",sante:"#10B981",social:"#F59E0B",perso:"#8B5CF6",autre:"#6B7280"};
              var dayEvts=byDate(wd).sort(function(a,b){return (a.time||"")>(b.time||"")?1:-1;});
              var dayTasks=semaineTasks[wd]||[];
              return(
                <div key={wd} style={{borderRadius:10,border:"1.5px solid "+(isToday?pm.accent:isSel?pm.border:"#E8EDF5"),background:isToday?pm.light:isSel?"#F8F5FF":"#FAFBFF",padding:"5px 4px",minHeight:90}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:800,color:isToday?pm.accent:"#8090B0",textAlign:"center",textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>{dayNames[wi]}</p>
                  <p onClick={function(){setDayViewDate(wd);}} style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:isToday?pm.accent:"#3D4A6A",textAlign:"center",marginBottom:4,cursor:"pointer"}}>{new Date(wd+"T12:00:00").getDate()}</p>
                  {/* RDV */}
                  {dayEvts.map(function(ev){
                    var cc=CAT_C[ev.category]||"#6B7280";
                    return(
                      <div key={ev.id} onClick={function(){setEditEvtId(ev.id);}} style={{marginBottom:2,padding:"3px 5px",borderRadius:5,background:cc+"15",border:"1px solid "+cc+"44",cursor:"pointer",overflow:"hidden"}}>
                        {ev.time&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:7,fontWeight:700,color:cc,lineHeight:1.2}}>{ev.time}{ev.endTime?"→"+ev.endTime:""}</p>}
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,color:ev.done?"#9CA3AF":cc,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",lineHeight:1.3,textDecoration:ev.done?"line-through":"none"}}>{ev.title}</p>
                      </div>
                    );
                  })}
                  {/* Notes/tâches manuelles */}
                  {dayTasks.map(function(t){return(
                    <div key={t.id} onClick={function(){setSemaineTasks(function(p){var o=Object.assign({},p);o[wd]=(o[wd]||[]).map(function(x){return x.id===t.id?Object.assign({},x,{done:!x.done}):x;});return o;});}} style={{display:"flex",gap:2,alignItems:"flex-start",marginBottom:2,cursor:"pointer"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:t.done?"#C4B5FD":pm.accent,flexShrink:0,marginTop:3}}/>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:t.done?"#B0B8C8":"#3D4A6A",textDecoration:t.done?"line-through":"none",lineHeight:1.3,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</p>
                    </div>
                  );})}
                  <input
                    placeholder="+"
                    onKeyDown={function(e){if(e.key==="Enter"&&e.target.value.trim()){var v=e.target.value.trim();var d=wd;setSemaineTasks(function(p){var o=Object.assign({},p);o[d]=[...(o[d]||[]),{id:gid(),text:v,done:false}];return o;});e.target.value="";}}}
                    style={{width:"100%",border:"none",borderBottom:"1px solid #E8EDF5",fontSize:9,fontFamily:"'Inter',sans-serif",background:"transparent",color:"#8090B0",padding:"2px 0",marginTop:2}}
                  />
                </div>
              );
            })}
          </div>

          {/* Weekly review */}
          <div style={{padding:"10px 12px",borderRadius:12,background:"#FFFBF0",border:"1.5px solid #FDE68A"}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#92400E",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>📝 Bilan de la semaine</p>
            <textarea
              value={semaineReview[weekDays[0]]||""}
              onChange={function(e){var v=e.target.value;var k=weekDays[0];setSemaineReview(function(p){var o=Object.assign({},p);o[k]=v;return o;});}}
              placeholder="Ce qui a bien fonctionné, ce que j'améliore..."
              rows={2}
              style={{width:"100%",border:"none",background:"transparent",fontSize:12,fontFamily:"'Inter',sans-serif",resize:"none",color:"#92400E",lineHeight:1.6}}
            />
          </div>
        </div>
      );
    }

    // ─── PLANIFICATION MOIS ───────────────────────────────────
    if(tab==="cal") {
      var calYr=calMon.getFullYear(),calMo=calMon.getMonth();
      var calPm=PM.mois;
      var CAT_COLORS={travail:"#3B82F6",sante:"#10B981",social:"#F59E0B",perso:"#8B5CF6",autre:"#6B7280"};
      var totalDays=dim(calYr,calMo);
      // Build days array with events
      var allDays=Array.from({length:totalDays}).map(function(_,i){
        var day=i+1;
        var ds=calYr+"-"+pad(calMo+1)+"-"+pad(day);
        var dow=(new Date(ds+"T12:00:00").getDay()+6)%7; // 0=lun..6=dim
        return{day:day,ds:ds,evts:byDate(ds),isToday:ds===TODAY,dow:dow};
      });
      // Group by week
      var firstDow=fd(calYr,calMo);
      var weeks=[];
      var week=Array(firstDow).fill(null);
      allDays.forEach(function(d){
        week.push(d);
        if(week.length===7){weeks.push(week);week=[];}
      });
      if(week.length>0){while(week.length<7)week.push(null);weeks.push(week);}
      var JOURS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
      var swipeCal=makeSwipeNav(
        function(){setCalMon(new Date(calYr,calMo+1,1));},
        function(){setCalMon(new Date(calYr,calMo-1,1));}
      );
      return(
        <div style={{padding:"10px 14px",userSelect:"none"}} {...swipeCal}>
          {/* Navigation */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={function(){setCalMon(new Date(calYr,calMo-1,1));}} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+calPm.border,background:"#FFF",fontSize:18,color:calPm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{"‹"}</button>
            <div style={{textAlign:"center"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,color:calPm.accent,textTransform:"capitalize",lineHeight:1}}>{MFR_FULL[calMo]}</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:600,letterSpacing:0.5}}>{calYr}</p>
            </div>
            <button onClick={function(){setCalMon(new Date(calYr,calMo+1,1));}} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+calPm.border,background:"#FFF",fontSize:18,color:calPm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{"›"}</button>
          </div>

          {/* En-têtes jours */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
            {JOURS.map(function(j,i){return(
              <div key={i} style={{textAlign:"center",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:800,color:i>=5?"#F87171":"#B0A090",letterSpacing:0.3,paddingBottom:3}}>{j}</div>
            );})}
          </div>

          {/* Semaines */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {weeks.map(function(wk,wi){
              var hasEvts=wk.some(function(d){return d&&d.evts.length>0;});
              return(
                <div key={wi} style={{borderRadius:12,border:"1.5px solid "+(hasEvts?calPm.border+"AA":"#F0F0F8"),background:hasEvts?"#FAFBFF":"#FCFCFE",overflow:"hidden"}}>
                  {/* Grille jours + events */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
                    {wk.map(function(d,di){
                      if(!d)return <div key={di} style={{borderRight:"1px solid #F0F0F8"}}/>;
                      var isWE=di>=5;
                      var cc_day=d.isToday?calPm.accent:isWE?"#F87171":"#3D4A6A";
                      return(
                        <div key={di} style={{borderRight:di<6?"1px solid #F0F0F8":"none",minHeight:d.evts.length>0?60:32,display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 3px 5px"}}>
                          {/* Numéro jour */}
                          <div onClick={function(){setDayViewDate(d.ds);}} style={{width:22,height:22,borderRadius:"50%",background:d.isToday?calPm.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:3,flexShrink:0,cursor:"pointer"}}>
                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:d.isToday?800:500,color:d.isToday?"white":cc_day,lineHeight:1}}>{d.day}</span>
                          </div>
                          {/* Events de ce jour */}
                          {d.evts.sort(function(a,b){return (a.time||"")>(b.time||"")?1:-1;}).map(function(ev){
                            var cc=CAT_COLORS[ev.category||ev.category]||"#6B7280";
                            return(
                              <div key={ev.id} onClick={function(){setEditEvtId(ev.id);}} style={{width:"100%",marginBottom:2,padding:"2px 4px",borderRadius:5,background:cc+"18",border:"1px solid "+cc+"33",cursor:"pointer",overflow:"hidden"}}>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:cc,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",lineHeight:1.4}}>{ev.time?ev.time+" ":""}{ev.title}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if(tab==="mois") {
      var monthKey=yr+"-"+pad(mo+1);
      var mReview=moisReview[monthKey]||{wins:"",improve:"",focus:""};
      return (
        <div style={{padding:"10px 14px"}}>
          {/* Navigation mois */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={function(){setCalMon(new Date(yr,mo-1,1));}} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+pm.border,background:"#FFF",fontSize:18,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>{"‹"}</button>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,color:pm.accent,textTransform:"capitalize",lineHeight:1}}>{MFR_FULL[mo]}</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:600,letterSpacing:0.5}}>{yr}</p>
            </div>
            <button onClick={function(){setCalMon(new Date(yr,mo+1,1));}} style={{width:30,height:30,borderRadius:8,border:"1.5px solid "+pm.border,background:"#FFF",fontSize:18,color:pm.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>{"›"}</button>
          </div>

          {/* Scan mois papier */}
          <button onClick={function(){openScan("mois");}} style={{width:"100%",marginBottom:12,padding:"7px 12px",borderRadius:10,border:"1.5px dashed "+pm.border,background:pm.light,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}>
            <span style={{fontSize:14}}>📷</span>
            <p style={{fontSize:11,color:pm.text,fontWeight:600}}>Importer depuis un agenda papier</p>
          </button>

          {/* Monthly goals */}
          <div style={{marginBottom:12,padding:"10px 12px",borderRadius:12,background:pm.light,border:"1.5px solid "+pm.border}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>🎯 Objectifs du mois</p>
            {moisGoals.map(function(g){
              var pct=g.steps&&g.steps.length>0?Math.round(g.steps.filter(function(s){return s.done;}).length/g.steps.length*100):0;
              return(
                <div key={g.id} style={{marginBottom:8,padding:"8px 10px",borderRadius:10,background:g.done?pm.light+"88":"#FAFBFF",border:"1.5px solid "+(g.done?pm.border:"#E8EDF5")}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:pct>0?4:0}}>
                    <div onClick={function(){setMoisGoals(function(p){return p.map(function(x){return x.id===g.id?Object.assign({},x,{done:!x.done}):x;});});}} style={{width:20,height:20,borderRadius:6,border:"2px solid "+(g.done?pm.accent:"#FCA5A5"),background:g.done?pm.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,flexShrink:0,cursor:"pointer"}}>{g.done?"✓":""}</div>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:g.done?"#A0A0C0":pm.text,fontWeight:700,flex:1,textDecoration:g.done?"line-through":"none"}}>{g.text}</p>
                    {pct>0&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.accent,fontWeight:700}}>{pct+"%"}</span>}
                    <button onClick={function(){setMoisGoals(function(p){return p.filter(function(x){return x.id!==g.id;});});}} style={{border:"none",background:"none",color:"#CCC",fontSize:14,cursor:"pointer"}}>×</button>
                  </div>
                  {pct>0&&(
                    <div style={{height:4,background:"#F0F0F8",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:pm.accent,borderRadius:2,transition:"width 0.3s"}}/>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <input value={newMoisGoal} onChange={function(e){setNewMoisGoal(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newMoisGoal.trim()){setMoisGoals(function(p){return[...p,{id:gid(),text:newMoisGoal.trim(),done:false,steps:[]}];});setNewMoisGoal("");}}} placeholder="Nouvel objectif du mois..." style={{flex:1,border:"1.5px solid "+pm.border,borderRadius:8,padding:"5px 9px",fontSize:12,fontFamily:"'Inter',sans-serif",background:"#FFFFFF"}}/>
              <button onClick={function(){if(!newMoisGoal.trim())return;setMoisGoals(function(p){return[...p,{id:gid(),text:newMoisGoal.trim(),done:false,steps:[]}];});setNewMoisGoal("");}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:pm.accent,color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>+</button>
            </div>
          </div>

          {/* Monthly calendar mini-grid */}
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>📅 Apercu du mois</p>
          <div style={{marginBottom:12,padding:"8px",borderRadius:12,border:"1.5px solid #E8EDF5",background:"#FAFBFF"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:3}}>
              {["L","M","M","J","V","S","D"].map(function(d,i){return(<div key={i} style={{textAlign:"center",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:i>=5?"#F87171":"#B0A090"}}>{d}</div>);})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {Array.from({length:fd(yr,mo)}).map(function(_,i){return <div key={"e"+i}/>;  })}
              {Array.from({length:dim(yr,mo)}).map(function(_,i){
                var day=i+1;
                var ds=yr+"-"+pad(mo+1)+"-"+pad(day);
                var evts=byDate(ds);
                var isT=ds===TODAY;
                var isSel=ds===selDate;
                return(
                  <div key={day} onClick={function(){setMoisSelDay(function(prev){return prev===ds?null:ds;});}} style={{borderRadius:5,background:isT?pm.accent:isSel?pm.light:ds===moisSelDay?pm.light+"CC":"transparent",border:"1px solid "+(isT?pm.accent:isSel?pm.border:ds===moisSelDay?pm.accent+"66":evts.length>0?pm.border+"88":"transparent"),cursor:"pointer",padding:"2px 1px",minHeight:22,display:"flex",flexDirection:"column",alignItems:"center",transition:"all 0.1s"}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:isT?800:600,color:isT?"white":ds===moisSelDay?pm.accent:"#3D4A6A",lineHeight:1}}>{day}</span>
                    {evts.length>0&&<div style={{width:3,height:3,borderRadius:"50%",background:isT?"white":pm.accent,marginTop:1}}/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly review */}
          <div style={{borderRadius:12,border:"1.5px solid #FCA5A5",overflow:"hidden"}}>
            <div style={{background:pm.light,padding:"8px 12px",borderBottom:"1px solid #FCA5A5"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>📝 Bilan du mois</p>
            </div>
            {[["wins","✅ Ce que j'ai accompli"],["improve","🔄 Ce que j'améliore"],["focus","🎯 Mon intention pour le mois suivant"]].map(function(field){return(
              <div key={field[0]} style={{padding:"8px 12px",borderBottom:"1px solid #FEE2E2"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#EF4444",fontWeight:700,marginBottom:4}}>{field[1]}</p>
                <textarea
                  value={mReview[field[0]]||""}
                  onChange={function(e){var fld=field[0];var v=e.target.value;setMoisReview(function(prev){var o=Object.assign({},prev);var r=Object.assign({},o[monthKey]||{});r[fld]=v;o[monthKey]=r;return o;});}}
                  placeholder="..."
                  rows={2}
                  style={{width:"100%",border:"none",background:"transparent",fontSize:12,fontFamily:"'Inter',sans-serif",resize:"none",color:"#7F1D1D",lineHeight:1.6}}
                />
              </div>
            );})}
          </div>
        </div>
      );
    }

    // ─── COACH SECTION (chat) ────────────────────────────────
    if(tab==="coach"){
      var CPILLS=["J'ai du mal à commencer","Je suis épuisé, par quoi commencer ?","Aide-moi à prioriser mes tâches","Comment gérer les distractions ?","Je me sens submergé","Stratégie pour rester focus"];
      var ELABELS_F=["","Épuisé 🪫","Faible ⚡","Moyen 🔋","Élevé 🔥","Maximum 💥"];
      var PCOLS_F={urgente:"#DC2626",haute:"#EA580C",normale:"#4F46E5",basse:"#059669"};
      var PBGS_F={urgente:"#FEF2F2",haute:"#FFF7ED",normale:"#EEF2FF",basse:"#F0FDF4"};
      var PBORDERS_F={urgente:"#FCA5A5",haute:"#FED7AA",normale:"#C7D2FE",basse:"#BBF7D0"};
      return(
        <div style={{display:"flex",flexDirection:"column",height:"100%"}}>

          {/* ── MODE TABS ── */}
          <div style={{display:"flex",gap:0,background:"#F8F9FF",borderBottom:"1.5px solid #E8EDF5",flexShrink:0}}>
            {[{id:"chat",icon:"💬",label:"Chat"},{id:"plan",icon:"✨",label:"Plan du jour"},{id:"decompose",icon:"✂️",label:"Décomposer"}].map(function(m){
              var active=flowiMode===m.id;
              return(
                <button key={m.id} onClick={function(){setFlowiMode(m.id);}} style={{flex:1,padding:"10px 4px",border:"none",borderBottom:active?"2.5px solid #16A34A":"2.5px solid transparent",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",transition:"all 0.15s"}}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:active?800:500,color:active?"#16A34A":"#9CA3AF"}}>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── MODE : CHAT ── */}
          {flowiMode==="chat"&&(
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              <div ref={coachScrollRef} style={{flex:1,overflowY:"auto",padding:"14px 14px 8px",display:"flex",flexDirection:"column",gap:10}}>
                {coachMsgs.map(function(m,i){
                  var isUser=m.role==="user";
                  return(
                    <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start"}}>
                      {!isUser&&<div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#16A34A,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,alignSelf:"flex-end"}}>🌿</div>}
                      <div style={{maxWidth:"78%",padding:"9px 13px",borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isUser?"#16A34A":"#F9FAFB",border:isUser?"none":"1px solid #E5E7EB"}}>
                        <p style={{fontSize:12,color:isUser?"white":"#1F2937",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                {coachLoading&&(
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#16A34A,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌿</div>
                    <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:"#F9FAFB",border:"1px solid #E5E7EB"}}>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {[0,1,2].map(function(d){return(<div key={d} style={{width:6,height:6,borderRadius:"50%",background:"#9CA3AF"}}/>);})}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{padding:"0 12px 6px",display:"flex",gap:5,overflowX:"auto",flexShrink:0}}>
                {CPILLS.map(function(p){return(
                  <button key={p} onClick={function(){setCoachInput(p);}} style={{flexShrink:0,padding:"5px 10px",borderRadius:20,border:"1px solid #D1FAE5",background:"#F0FDF4",fontSize:10,color:"#065F46",cursor:"pointer",whiteSpace:"nowrap"}}>{p}</button>
                );})}
              </div>
              <div style={{padding:"8px 12px 14px",borderTop:"1px solid #F0F0F0",display:"flex",gap:8,alignItems:"flex-end",flexShrink:0}}>
                <textarea value={coachInput} onChange={function(e){setCoachInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendCoach();}}} placeholder="Parle à Flowi... (Entrée pour envoyer)" rows={2} style={{flex:1,padding:"9px 12px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:12,resize:"none",background:"white",color:"#1F2937",lineHeight:1.5}}/>
                <button onClick={sendCoach} disabled={coachLoading||!coachInput.trim()} style={{width:38,height:38,borderRadius:12,border:"none",background:coachLoading||!coachInput.trim()?"#E5E7EB":"#16A34A",color:"white",fontSize:18,cursor:coachLoading||!coachInput.trim()?"not-allowed":"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
              </div>
            </div>
          )}

          {/* ── MODE : PLAN DU JOUR ── */}
          {flowiMode==="plan"&&(
            <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#6B7280",lineHeight:1.6,marginBottom:12}}>Flowi analyse tes tâches et ton niveau d'énergie pour te proposer un plan adapté à aujourd'hui.</p>
              {(function(){
                var jourEnergy=energyLog[TODAY]||0;
                var pendingTasks=todos.filter(function(t){return !t.done;});
                var ELABELS=["","Épuisé 🪫","Faible ⚡","Moyen 🔋","Élevé 🔥","Maximum 💥"];
                var ECOLORS=["","#DC2626","#EA580C","#3B82F6","#059669","#7C3AED"];
                return(
                  <div>
                    {/* Contexte */}
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:"#F8F9FF",border:"1px solid #E8EDF5",textAlign:"center"}}>
                        <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:jourEnergy>0?ECOLORS[jourEnergy]:"#D1D5DB"}}>{jourEnergy>0?jourEnergy:"—"}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#9CA3AF"}}>Énergie</p>
                      </div>
                      <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:"#F8F9FF",border:"1px solid #E8EDF5",textAlign:"center"}}>
                        <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:"#4F46E5"}}>{pendingTasks.length}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#9CA3AF"}}>Tâches</p>
                      </div>
                    </div>
                    <button onClick={function(){
                      if(flowiPlanLoading)return;
                      setFlowiPlanLoading(true);
                      setFlowiPlanResult(null);
                      var PNAMES={urgente:"Urgente 🔴",haute:"Haute 🟠",normale:"Normale 🔵",basse:"Basse 🟢"};
                      var taskList=pendingTasks.map(function(t){return"- "+t.text+" ["+PNAMES[t.priority||"normale"]+"]"+(t.due?" (échéance: "+t.due+")":"");}).join("\n")||"(aucune tâche)";
                      var energyLabel=ELABELS[jourEnergy]||"Moyen";
                      var date=new Date(TODAY+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
                      fetch("https://api.anthropic.com/v1/messages",{
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({
                          model:"claude-sonnet-4-5",
                          max_tokens:1000,
                          messages:[{role:"user",content:"Tu es Flowi, coach chaleureux spécialisé en productivité. Tu tutoies toujours. Aujourd'hui: "+date+". Énergie: "+energyLabel+".\n\nTâches:\n"+taskList+"\n\nRéponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte avant ou après.\nFormat exact: {\"message\":\"encouragement court\",\"focus\":\"1 tâche prioritaire\",\"suggestions\":[{\"type\":\"faire\",\"task\":\"nom\",\"raison\":\"raison courte\"}],\"conseil\":\"conseil court\"}"}]
                        })
                      })
                      .then(function(r){
                        if(!r.ok)throw new Error("HTTP "+r.status);
                        return r.json();
                      })
                      .then(function(data){
                        var text=(data.content&&data.content[0]&&data.content[0].text)||"";
                        var clean=text.replace(/```json|```/g,"").trim();
                        // Extract JSON if wrapped in other text
                        var match=clean.match(/\{[\s\S]*\}/);
                        if(match)clean=match[0];
                        var result=JSON.parse(clean);
                        setFlowiPlanResult(result);
                        setFlowiPlanLoading(false);
                      })
                      .catch(function(err){
                        console.error("Plan error:",err);
                        setFlowiPlanResult({
                          message:"Oups, une erreur s'est produite. Réessaie dans un instant.",
                          focus:pendingTasks[0]?pendingTasks[0].text:null,
                          suggestions:[],
                          conseil:null
                        });
                        setFlowiPlanLoading(false);
                      });
                    }} disabled={flowiPlanLoading} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:flowiPlanLoading?"#D1FAE5":"#16A34A",color:"white",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:13,cursor:flowiPlanLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                      {flowiPlanLoading?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>:"✨"}{flowiPlanLoading?"Flowi analyse ta journée...":"Générer mon plan du jour"}
                    </button>
                    {flowiPlanResult&&(
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{padding:"10px 14px",borderRadius:12,background:"#F0FDF4",border:"1.5px solid #86EFAC"}}>
                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#166534",fontWeight:700,lineHeight:1.5}}>{"💬 "+flowiPlanResult.message}</p>
                        </div>
                        {flowiPlanResult.focus&&(
                          <div style={{padding:"10px 14px",borderRadius:12,background:"#EEF2FF",border:"1.5px solid #C7D2FE"}}>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4F46E5",fontWeight:800,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>🎯 Focus du jour</p>
                            <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:"#1E1B4B",fontWeight:700}}>{flowiPlanResult.focus}</p>
                          </div>
                        )}
                        {flowiPlanResult.suggestions&&flowiPlanResult.suggestions.length>0&&(
                          <div style={{borderRadius:12,border:"1px solid #E8EDF5",overflow:"hidden"}}>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#6B7280",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,padding:"8px 12px 4px"}}>📋 Ajustements</p>
                            {flowiPlanResult.suggestions.map(function(s,i){
                              var typeStyle={faire:{bg:"#F0FDF4",icon:"✅",color:"#166534"},reporter:{bg:"#FFF7ED",icon:"⏭",color:"#9A3412"},adapter:{bg:"#FAF5FF",icon:"🔄",color:"#6B21A8"}};
                              var st=typeStyle[s.type]||typeStyle.adapter;
                              return(
                                <div key={i} style={{display:"flex",gap:8,padding:"6px 12px",background:st.bg,borderTop:i>0?"1px solid #F0F0F0":"none",alignItems:"flex-start"}}>
                                  <span style={{fontSize:14,flexShrink:0}}>{st.icon}</span>
                                  <div><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:st.color,fontWeight:700}}>{s.task}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF"}}>{s.raison}</p></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {flowiPlanResult.conseil&&<div style={{padding:"8px 12px",borderRadius:10,background:"#FFFBEB",border:"1px solid #FDE68A"}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#92400E",lineHeight:1.5}}>{"💡 "+flowiPlanResult.conseil}</p></div>}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── MODE : DÉCOMPOSER ── */}
          {flowiMode==="decompose"&&(
            <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#6B7280",lineHeight:1.6,marginBottom:10}}>Colle une tâche qui te semble trop grosse — Flowi la découpe en étapes concrètes et actionnables.</p>
              <textarea value={flowiDecomposeText} onChange={function(e){setFlowiDecomposeText(e.target.value);}} placeholder="Ex: Préparer ma présentation pour jeudi..." rows={3} style={{width:"100%",border:"1.5px solid #E8EDF5",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"'Inter',sans-serif",resize:"none",background:"white",lineHeight:1.6,marginBottom:8}}/>
              <button onClick={function(){
                if(!flowiDecomposeText.trim()||flowiDecomposeLoading)return;
                setFlowiDecomposeLoading(true);
                setFlowiDecomposeResult(null);
                fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:800,system:"Tu es Flowi, coach bienveillant spécialisé en productivité et flow. Quand on te donne une tâche, décompose-la en 4-6 étapes très courtes, concrètes et immédiatement actionnables. Chaque étape doit prendre moins de 15 minutes. Réponds UNIQUEMENT en JSON valide. Format: {\"intro\":\"phrase courte naturelle (max 15 mots)\",\"steps\":[{\"label\":\"action concrète\",\"dur\":\"durée estimée\",\"emoji\":\"emoji\"}]}. Tu tutoies toujours. En français.",messages:[{role:"user",content:flowiDecomposeText.trim()}]})}).then(function(r){return r.json();}).then(function(data){var text=(data.content&&data.content[0]&&data.content[0].text)||"{}";var clean=text.replace(/```json|```/g,"").trim();setFlowiDecomposeResult(JSON.parse(clean));setFlowiDecomposeLoading(false);}).catch(function(){setFlowiDecomposeLoading(false);});
              }} disabled={flowiDecomposeLoading||!flowiDecomposeText.trim()} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:flowiDecomposeLoading||!flowiDecomposeText.trim()?"#D1FAE5":"#16A34A",color:"white",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:12,cursor:flowiDecomposeLoading||!flowiDecomposeText.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:14}}>
                {flowiDecomposeLoading?<span>⟳</span>:"✂️"}{flowiDecomposeLoading?"Flowi découpe ta tâche...":"Décomposer"}
              </button>
              {flowiDecomposeResult&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {flowiDecomposeResult.intro&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#166534",fontWeight:700,fontStyle:"italic",marginBottom:4}}>{"💬 "+flowiDecomposeResult.intro}</p>}
                  {(flowiDecomposeResult.steps||[]).map(function(s,i){return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:"#F8F9FF",border:"1.5px solid #E8EDF5"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#16A34A,#059669)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"white",fontWeight:900}}>{i+1}</span>
                      </div>
                      <span style={{fontSize:18,flexShrink:0}}>{s.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#1F2937",fontWeight:700,lineHeight:1.3}}>{s.label}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#9CA3AF",marginTop:1}}>{s.dur}</p>
                      </div>
                      <button onClick={function(){var step=s;setTodos(function(p){return[...p,{id:gid(),text:step.label,done:false,priority:"normale",due:"",scheduledDate:TODAY}];});}} style={{padding:"3px 8px",borderRadius:7,border:"1px solid #D1FAE5",background:"#F0FDF4",fontFamily:"'Inter',sans-serif",fontSize:9,color:"#166534",fontWeight:700,cursor:"pointer",flexShrink:0}}>+ Tâche</button>
                    </div>
                  );})}
                  <button onClick={function(){(flowiDecomposeResult.steps||[]).forEach(function(s){setTodos(function(p){return[...p,{id:gid(),text:s.label,done:false,priority:"normale",due:"",scheduledDate:TODAY}];});});setTab("todos");}} style={{width:"100%",padding:"9px",borderRadius:10,border:"1.5px solid #D1FAE5",background:"#F0FDF4",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,color:"#166534",cursor:"pointer",marginTop:2}}>↗ Toutes les étapes → Tâches</button>
                </div>
              )}
            </div>
          )}

        </div>
      );
    }

    // ─── XP SECTION (niveau + badges) ────────────────────────
    if(tab==="recompenses"){
      var XPS_LEVELS=[
        {lvl:1,label:"Débutant",min:0,emoji:"🌱"},
        {lvl:2,label:"Curieux",min:50,emoji:"🌿"},
        {lvl:3,label:"Régulier",min:150,emoji:"⚡"},
        {lvl:4,label:"Motivé",min:300,emoji:"🔥"},
        {lvl:5,label:"Focalisé",min:500,emoji:"🎯"},
        {lvl:6,label:"Champion",min:800,emoji:"💪"},
        {lvl:7,label:"Expert",min:1200,emoji:"🧠"},
        {lvl:8,label:"Maître",min:1800,emoji:"💎"},
        {lvl:9,label:"Légende",min:2500,emoji:"🌟"},
        {lvl:10,label:"Flow Master",min:3500,emoji:"🏆"},
      ];
      var ALL_BDGS=[
        {id:"first50",threshold:50,emoji:"⭐",label:"Premier pas",desc:"50 XP"},
        {id:"lvl3",threshold:300,emoji:"🔥",label:"En feu",desc:"300 XP"},
        {id:"lvl5",threshold:800,emoji:"💜",label:"Régulier",desc:"800 XP"},
        {id:"lvl7",threshold:1800,emoji:"💎",label:"Diamant",desc:"1800 XP"},
        {id:"lvl10",threshold:5000,emoji:"🏆",label:"Légende",desc:"5000 XP"},
        {id:"task10",threshold:-1,emoji:"✅",label:"Taskmaster",desc:"10 tâches"},
        {id:"focus5",threshold:-2,emoji:"⏱",label:"Zone de flow",desc:"5 sessions"},
        {id:"routine7",threshold:-3,emoji:"🔁",label:"Automatique",desc:"7 routines"},
      ];
      var curLvl=XPS_LEVELS.filter(function(l){return xp>=l.min;}).pop()||XPS_LEVELS[0];
      var nextLvl=XPS_LEVELS[curLvl.lvl]||null;
      var prgPct=nextLvl?Math.min(100,Math.round((xp-curLvl.min)/(nextLvl.min-curLvl.min)*100)):100;
      return(
        <div style={{padding:"14px 16px",overflowY:"auto"}}>
          <div style={{marginBottom:16,padding:"16px",borderRadius:16,background:"linear-gradient(135deg,#FEFCE8,#FEF9C3)",border:"2px solid #FDE047",textAlign:"center"}}>
            <p style={{fontSize:40,marginBottom:4}}>{curLvl.emoji}</p>
            <p style={{fontSize:20,color:"#92400E",fontWeight:800}}>{curLvl.label}</p>
            <p style={{fontSize:11,color:"#B45309",marginBottom:12}}>{"Niveau "+curLvl.lvl+" · "+xp+" XP"}</p>
            {nextLvl&&(
              <div>
                <div style={{height:10,background:"#FEF9C3",borderRadius:5,overflow:"hidden",marginBottom:5,border:"1px solid #FDE047"}}>
                  <div style={{height:"100%",width:prgPct+"%",background:"linear-gradient(to right,#F59E0B,#EAB308)",borderRadius:5,transition:"width 0.5s"}}/>
                </div>
                <p style={{fontSize:10,color:"#92400E"}}>{(nextLvl.min-xp)+" XP avant "+nextLvl.label+" "+nextLvl.emoji}</p>
              </div>
            )}
          </div>
          <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>🏅 Badges</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {ALL_BDGS.map(function(b){
              var earned=badges.find(function(x){return x.id===b.id;});
              return(
                <div key={b.id} style={{padding:"10px",borderRadius:12,background:earned?"#FEF9C3":"#F9FAFB",border:"1.5px solid "+(earned?"#FDE047":"#E5E7EB"),textAlign:"center",position:"relative",opacity:earned?1:0.5}}>
                  <p style={{fontSize:22,marginBottom:3}}>{b.emoji}</p>
                  <p style={{fontSize:10,color:earned?"#92400E":"#6B7280",fontWeight:700,lineHeight:1.2}}>{b.label}</p>
                  <p style={{fontSize:9,color:earned?"#B45309":"#9CA3AF",marginTop:1}}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

  };


  var renderRight=function(){
    var pm=PM[tab]||PM.agenda;
    var noLines=["accueil","focus","agenda","semaine","coach","mois","cal","budget","wellness","defis","voyage","creativite"].indexOf(tab)>=0;

    // ─── AGENDA ─────────────────────────────────────────────
    if(tab==="agenda"){
      var jourDate=new Date(selDate+"T12:00:00");
      var dayEvts=byDate(selDate);
      var mId=moods[selDate];
      var mObj=mId?MOODS.find(function(m){return m.id===mId;}):null;
      return(
        <div style={{padding:"12px 16px"}}>
          {/* Mood badge */}
          {mObj&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",borderRadius:10,background:mObj.bg||mObj.color+"18",border:"1px solid "+mObj.color+"33",marginBottom:10}}>
              <MoodBlob mood={mObj} sel={true} size={40}/>
              <p style={{fontSize:14,color:mObj.color,fontWeight:800,flex:1}}>{mObj.label}</p>
            </div>
          )}
        </div>
      );
    }

    // ─── TACHES ──────────────────────────────────────────────
    if(tab==="todos"){
      var doneTodos=todos.filter(function(t){return t.done;});
      var pendTodos=todos.filter(function(t){return !t.done;});
      var pct=todos.length>0?Math.round(doneTodos.length/todos.length*100):0;
      var todayKey=selDate;
      var todoDump=brainDump[todayKey]||"";
      var todoDumpResult=brainDumpResult[todayKey]||null;
      var todoEnergy=energyLog[todayKey]||3;
      var TODOLABELS=["","Épuisé","Faible","Moyen","Élevé","Maximum"];
      return(
        <div style={{padding:"12px 16px"}}>
          {/* Brain Dump panel */}
          <div style={{marginBottom:14,borderRadius:12,border:"1.5px solid #C7D2FE",background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",overflow:"hidden"}}>
            <div style={{padding:"8px 12px",borderBottom:"1px solid #C7D2FE",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:16}}>🧠</span>
              <div style={{flex:1}}>
                <p style={{fontSize:11,color:"#3730A3",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>Coach</p>
                <p style={{fontSize:9,color:"#818CF8",marginTop:1}}>Liste tout — l'IA organise et décompose en sous-tâches</p>
              </div>
            </div>
            <div style={{padding:"8px 10px"}}>
              <textarea
                value={todoDump}
                onChange={function(e){var v=e.target.value;var d=todayKey;setBrainDump(function(p){var o=Object.assign({},p);o[d]=v;return o;});}}
                placeholder={"Ex:\n- Appeler le dentiste\n- Finir le rapport Q3\n- Préparer présentation jeudi..."}
                rows={4}
                style={{width:"100%",border:"1.5px solid #C7D2FE",borderRadius:9,padding:"8px 10px",fontSize:12,resize:"none",background:"white",color:"#1E1B4B",lineHeight:1.6,marginBottom:7}}
              />
              <button onClick={function(){
                if(!todoDump.trim()||brainDumpLoading)return;
                setBrainDumpLoading(true);
                var eDateStr=new Date(todayKey+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
                var energyLabel=TODOLABELS[todoEnergy]||"Moyen";
                var existingTasks=todos.filter(function(t){return !t.done;}).map(function(t){return t.text;}).join(", ")||"aucune";
                fetch("https://api.anthropic.com/v1/messages",{
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({
                    model:"claude-sonnet-4-5",
                    max_tokens:1500,
                    messages:[{role:"user",content:"Tu es Flowi, coach chaleureux spécialisé en productivité, flow et bien-être. Tu tutoies toujours l'utilisateur. Date : "+eDateStr+". Niveau d'énergie : "+energyLabel+". Tâches déjà dans la liste : "+existingTasks+".\n\nVoici le vide-cerveau de l'utilisateur :\n"+todoDump+"\n\nOrganise tout cela en horaire structuré pour la journée. Pour chaque tâche, décompose-la en sous-tâches concrètes et actionables. Réponds UNIQUEMENT en JSON valide sans markdown. Format:\n{\"resume\":\"phrase courte sur la journée planifiée (max 15 mots)\",\"blocs\":[{\"heure\":\"9h00\",\"titre\":\"Nom de la tâche principale\",\"duree\":\"30 min\",\"priorite\":\"urgente|haute|normale|basse\",\"emoji\":\"emoji adapté\",\"sousTaches\":[\"sous-tâche 1 concrète\",\"sous-tâche 2 concrète\",\"sous-tâche 3 concrète\"]}],\"conseil\":\"conseil de flow pour cette journée (max 25 mots)\"}"}]
                  })
                }).then(function(r){return r.json();}).then(function(data){
                  var text=(data.content&&data.content[0]&&data.content[0].text)||"{}";
                  var clean=text.replace(/```json|```/g,"").trim();
                  var parsed=JSON.parse(clean);
                  var d=todayKey;
                  setBrainDumpResult(function(p){var o=Object.assign({},p);o[d]=parsed;return o;});
                  setBrainDumpLoading(false);
                }).catch(function(){setBrainDumpLoading(false);});
              }} disabled={brainDumpLoading||!todoDump.trim()} style={{width:"100%",padding:"8px",borderRadius:9,border:"none",background:brainDumpLoading?"#C7D2FE":"#4F46E5",color:"white",fontWeight:700,fontSize:12,cursor:brainDumpLoading||!todoDump.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {brainDumpLoading?"⟳  Analyse en cours...":"✨  Organiser"}
              </button>

              {todoDumpResult&&!brainDumpLoading&&(
                <div style={{marginTop:10}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <p style={{fontSize:11,color:"#3730A3",fontWeight:600,fontStyle:"italic"}}>{"💬 "+todoDumpResult.resume}</p>
                    <button onClick={function(){var d=todayKey;setBrainDumpResult(function(p){var o=Object.assign({},p);delete o[d];return o;});}} style={{border:"none",background:"none",color:"#C7D2FE",fontSize:14,cursor:"pointer",padding:0}}>×</button>
                  </div>

                  {(todoDumpResult.blocs||[]).map(function(bloc,bi){
                    var PCOLS={urgente:"#DC2626",haute:"#EA580C",normale:"#4F46E5",basse:"#059669"};
                    var PBGS={urgente:"#FEF2F2",haute:"#FFF7ED",normale:"#EEF2FF",basse:"#F0FDF4"};
                    var PBORDERS={urgente:"#FCA5A5",haute:"#FED7AA",normale:"#C7D2FE",basse:"#BBF7D0"};
                    var pc=PCOLS[bloc.priorite]||PCOLS.normale;
                    var pbg=PBGS[bloc.priorite]||PBGS.normale;
                    var pbd=PBORDERS[bloc.priorite]||PBORDERS.normale;
                    var isOpen=openBlocIdx===bi;
                    return(
                      <div key={bi} style={{marginBottom:6,borderRadius:10,border:"1.5px solid "+pbd,background:pbg,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",cursor:"pointer"}} onClick={function(){var idx=bi;setOpenBlocIdx(function(prev){return prev===idx?null:idx;});}}>
                          <span style={{fontSize:16,flexShrink:0}}>{bloc.emoji||"📌"}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12,color:pc,fontWeight:700,lineHeight:1.2}}>{bloc.titre}</p>
                            <p style={{fontSize:9,color:"#94A3B8"}}>{(bloc.heure||"")+(bloc.duree?" · "+bloc.duree:"")}</p>
                          </div>
                          <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                            <button onClick={function(e){e.stopPropagation();var bIdx=bi;setTodos(function(p){var blc=todoDumpResult.blocs[bIdx];return[...p,{id:gid(),text:blc.titre,done:false,priority:blc.priorite||"normale",due:todayKey}];});}} style={{padding:"2px 7px",borderRadius:6,border:"1px solid "+pc+"44",background:"white",fontSize:9,color:pc,fontWeight:700,cursor:"pointer"}}>+ Tâche</button>
                            <span style={{fontSize:11,color:"#94A3B8"}}>{isOpen?"▲":"▼"}</span>
                          </div>
                        </div>
                        {isOpen&&(
                          <div style={{padding:"4px 10px 10px 38px",borderTop:"1px solid "+pbd}}>
                            {(bloc.sousTaches||[]).map(function(st,si){return(
                              <div key={si} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:4}}>
                                <div style={{width:5,height:5,borderRadius:"50%",background:pc,flexShrink:0,marginTop:5}}/>
                                <p style={{fontSize:11,color:"#374151",lineHeight:1.4}}>{st}</p>
                              </div>
                            );})}
                            <button onClick={function(){var bIdx=bi;var blc=todoDumpResult.blocs[bIdx];setTodos(function(p){var newTasks=(blc.sousTaches||[]).map(function(st){return{id:gid(),text:st,done:false,priority:blc.priorite||"normale",due:todayKey};});return[...p,...newTasks];});}} style={{marginTop:6,padding:"4px 10px",borderRadius:7,border:"1px solid "+pbd,background:"white",fontSize:9,color:pc,fontWeight:700,cursor:"pointer",width:"100%"}}>↗ Ajouter les sous-tâches</button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {todoDumpResult.conseil&&(
                    <div style={{padding:"6px 10px",borderRadius:9,background:"#F0FDF4",border:"1px solid #BBF7D0",marginTop:4}}>
                      <p style={{fontSize:10,color:"#166534",lineHeight:1.5}}>{"💡 "+todoDumpResult.conseil}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{marginBottom:14,padding:"12px 14px",borderRadius:14,background:pm.light,border:"1.5px solid "+pm.border,textAlign:"center"}}>
            <p style={{fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Progression</p>
            <div style={{height:10,background:"#E8F4EC",borderRadius:5,overflow:"hidden",marginBottom:6}}>
              <div style={{height:"100%",width:pct+"%",background:pm.accent,borderRadius:5,transition:"width 0.4s"}}/>
            </div>
            <p style={{fontSize:28,color:pm.accent,fontWeight:700}}>{pct+"%"}</p>
            <p style={{fontSize:12,color:"#8090B0"}}>{doneTodos.length+" / "+todos.length+" tâches"}</p>
          </div>
        </div>
      );
    }

    // ─── NOTES ───────────────────────────────────────────────
    if(tab==="notes"){
      var sortedNotes=notes.slice().reverse();
      return(
        <div style={{padding:"12px 16px"}}>
          
          {sortedNotes.length===0&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#D0C8E0",textAlign:"center",paddingTop:24}}>Pas encore de notes 📝</p>}
          {sortedNotes.map(function(n){return(
            <div key={n.id} style={{padding:"10px 12px",marginBottom:8,borderRadius:12,background:pm.light,border:"1.5px solid "+pm.border,position:"relative"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{new Date(n.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#2D3A5A",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{n.text}</p>
              <button onClick={function(){setNotes(function(p){return p.filter(function(x){return x.id!==n.id;});});}} style={{position:"absolute",top:6,right:8,border:"none",background:"rgba(0,0,0,0.06)",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",color:"#888",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          );})}
        </div>
      );
    }

    // ─── EPICERIE ────────────────────────────────────────────

    // ─── FOCUS ───────────────────────────────────────────────
    if(tab==="focus"){
      var totalFocusMin=Math.round((focusTotal-focusSecs)/60);
      return(
        <div style={{padding:"12px 16px"}}>
          <div style={{marginBottom:14,padding:"16px",borderRadius:14,background:pm.light,border:"1.5px solid "+pm.border,textAlign:"center"}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Session en cours</p>
            {focusActive?(
              <div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:42,color:pm.accent,fontWeight:700,lineHeight:1}}>{Math.floor(focusSecs/60)+":"+(focusSecs%60<10?"0":"")+focusSecs%60}</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#8090B0",marginTop:4}}>{"sur "+Math.floor(focusTotal/60)+" minutes"}</p>
              </div>
            ):(
              <div>
                <p style={{fontSize:36,marginBottom:4}}>⏱</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#B0A090"}}>Choisis un preset et lance !</p>
              </div>
            )}
          </div>
          <div style={{padding:"12px",borderRadius:12,background:"#FFF8F0",border:"1.5px solid #FFD8B0",textAlign:"center"}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#B05010",fontWeight:700,marginBottom:4}}>Technique Pomodoro</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#C07030",lineHeight:1.5}}>25 min focus → 5 min pause<br/>Apres 4 cycles : pause longue 30 min</p>
          </div>
        </div>
      );
    }

    // ─── BUDGET ──────────────────────────────────────────────

    // ─── BIEN-ETRE ───────────────────────────────────────────
    if(tab==="wellness"){
      var last7=[];
      for(var wi=6;wi>=0;wi--){var d2=new Date(TODAY+"T12:00:00");d2.setDate(d2.getDate()-wi);last7.push(d2.toISOString().slice(0,10));}
      return(
        <div style={{padding:"12px 16px"}}>
          
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:14}}>
            {last7.map(function(d){
              var dayHabits=habits.filter(function(h){return h.done&&h.done[d];});
              var pct=habits.length>0?Math.round(dayHabits.length/habits.length*100):0;
              var isT=d===TODAY;
              return(
                <div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:isT?pm.accent:"#B0A090",fontWeight:700,textTransform:"uppercase"}}>
                    {new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"narrow"})}
                  </p>
                  <div style={{width:26,height:26,borderRadius:"50%",background:pct===100?pm.accent:pct>0?pm.light:"#F0F4FF",border:"2px solid "+(pct===100?pm.accent:pct>0?pm.border:"#E8EDF5"),display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:pct===100?"white":pm.accent}}>{pct+"%"}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{height:1,background:"#E8EDF5",margin:"10px 0"}}/>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Energie & hydratation</p>
          {(function(){
            var energyEntries=Object.entries(energyLog).sort(function(a,b){return b[0]<a[0]?-1:1;}).slice(0,7);
            var energyLabels=["","Epuise 😵","Fatigue 😴","Normal 😐","Energise 💪","Maximum 💥"];
            if(energyEntries.length===0) return <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#D0D8E0",textAlign:"center",paddingTop:8}}>Aucune donnee encore ⚡</p>;
            return energyEntries.map(function(entry){
              var d=entry[0];var e=entry[1];var w=waterLog[d]||0;
              return(
                <div key={d} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",marginBottom:4,borderRadius:10,background:pm.light,border:"1px solid "+pm.border}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#8090B0",width:50,flexShrink:0}}>{new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})}</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:pm.text,flex:1}}>{energyLabels[e]||""}</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#38BDF8",flexShrink:0}}>{"💧 "+w+"/8"}</p>
                </div>
              );
            });
          })()}
        </div>
      );
    }

    // ─── DEFIS ───────────────────────────────────────────────
    if(tab==="defis"){
      return(
        <div style={{padding:"12px 16px"}}>
          
          {defis.length===0&&(
            <div style={{textAlign:"center",padding:"24px 16px"}}>
              <p style={{fontSize:28,marginBottom:10}}>🎯</p>
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:"#B0C090",fontStyle:"italic",marginBottom:8,lineHeight:1.6}}>Aucun défi en cours.</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#C8D0B8",lineHeight:1.6}}>Un défi, c'est un engagement simple avec toi-même.<br/>30 jours de marche, 7 jours sans sucre, lire chaque soir...</p>
            </div>
          )}
          {defis.map(function(d){
            var done=Object.values(d.days||{}).filter(Boolean).length;
            var pct=Math.round(done/d.total*100);
            return(
              <div key={d.id} style={{marginBottom:10,padding:"10px 12px",borderRadius:12,background:pm.light,border:"1.5px solid "+pm.border}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:pm.text,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</p>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:pm.accent,fontWeight:800,flexShrink:0,marginLeft:8}}>{pct+"%"}</span>
                </div>
                <div style={{height:6,background:"#E8EDF5",borderRadius:3,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:pct+"%",background:pm.accent,borderRadius:3,transition:"width 0.4s"}}/>
                </div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#8090B0"}}>{done+" / "+d.total+" jours"}</p>
              </div>
            );
          })}
        </div>
      );
    }

    // ─── VOYAGE ──────────────────────────────────────────────

    // ─── CREATIVITE ──────────────────────────────────────────

    // ─── SEMAINE ─────────────────────────────────────────────
    if(tab==="semaine"){
      var doneGoals=semaineGoals.filter(function(g){return g.done;}).length;
      return(
        <div style={{padding:"12px 16px"}}>
          <div style={{marginBottom:12,padding:"12px 14px",borderRadius:14,background:pm.light,border:"1.5px solid "+pm.border,textAlign:"center"}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Objectifs accomplis</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:38,color:pm.accent,fontWeight:700,lineHeight:1}}>{doneGoals+"/"+semaineGoals.length}</p>
            {semaineGoals.length>0&&(
              <div style={{height:6,background:"#EDE9FE",borderRadius:3,overflow:"hidden",marginTop:8}}>
                <div style={{height:"100%",width:(semaineGoals.length>0?Math.round(doneGoals/semaineGoals.length*100):0)+"%",background:pm.accent,borderRadius:3}}/>
              </div>
            )}
          </div>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>📝 Bilan de semaine</p>
          <textarea
            placeholder="Ce qui a bien fonctionne, ce que j’ameliore la semaine prochaine..."
            rows={6}
            style={{width:"100%",border:"1.5px solid "+pm.border,borderRadius:12,padding:"10px 12px",fontSize:13,fontFamily:"'Inter',sans-serif",resize:"none",background:pm.light,color:pm.text,lineHeight:1.7}}
          />
        </div>
      );
    }

    // ─── MOIS ────────────────────────────────────────────────
    if(tab==="mois"){
      var monthKey2=yr+"-"+pad(mo+1);
      var mReview2=moisReview[monthKey2]||{wins:"",improve:"",focus:""};
      var doneMois=moisGoals.filter(function(g){return g.done;}).length;
      return(
        <div style={{padding:"12px 16px"}}>
          <div style={{marginBottom:12,padding:"12px 14px",borderRadius:14,background:pm.light,border:"1.5px solid "+pm.border,textAlign:"center"}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:pm.text,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Objectifs du mois</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:38,color:pm.accent,fontWeight:700,lineHeight:1}}>{doneMois+"/"+moisGoals.length}</p>
            {moisGoals.length>0&&(
              <div style={{height:6,background:"#FEE2E2",borderRadius:3,overflow:"hidden",marginTop:8}}>
                <div style={{height:"100%",width:(moisGoals.length>0?Math.round(doneMois/moisGoals.length*100):0)+"%",background:pm.accent,borderRadius:3}}/>
              </div>
            )}
          </div>
          {[["wins","✅ Ce que j'ai accompli"],["improve","🔄 Ce que j’ameliore"],["focus","🎯 Intention mois suivant"]].map(function(f){return(
            <div key={f[0]} style={{marginBottom:10,padding:"10px 12px",borderRadius:12,background:"#FFF5F5",border:"1.5px solid #FCA5A5"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#EF4444",fontWeight:700,marginBottom:5}}>{f[1]}</p>
              <textarea
                value={mReview2[f[0]]||""}
                onChange={function(e){var fld=f[0];var v=e.target.value;setMoisReview(function(prev){var o=Object.assign({},prev);var r=Object.assign({},o[monthKey2]||{});r[fld]=v;o[monthKey2]=r;return o;});}}
                placeholder="..."
                rows={3}
                style={{width:"100%",border:"none",background:"transparent",fontSize:12,fontFamily:"'Inter',sans-serif",resize:"none",color:"#7F1D1D",lineHeight:1.6}}
              />
            </div>
          );})}
        </div>
      );
    }


    // ─── ROUTINES RIGHT ──────────────────────────────────────
    if(tab==="routines"){
      var cur=activeRoutine;
      var curBlock=cur&&cur.blocks[routineBlockIdx];
      var totalSecs=curBlock?curBlock.dur*60:0;
      var pct=totalSecs>0?Math.round((totalSecs-routineBlockSecs)/totalSecs*100):0;
      var nextBlock=cur&&cur.blocks[routineBlockIdx+1];
      var circumference=2*3.14159*52;
      var dashOff=circumference*(1-pct/100);
      var BLOCK_COLORS=["#FED7AA","#C4B5FD","#A7F3D0","#BAE6FD","#FCE7F3","#FDE68A","#FECDD3","#D9F99D"];
      var ROUTINE_COLORS=["#F97316","#8B5CF6","#3B82F6","#10B981","#E11D48","#F59E0B","#06B6D4","#84CC16"];
      var EMOJIS=["🌅","🌙","🧘","💪","📚","🎯","☀️","🌿","🏃","✨","🍳","🧹"];
      return(
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>

          {/* ── TIMER ACTIF ── */}
          {cur&&routineRunning?(
            <div>
              <div style={{textAlign:"center",marginBottom:12,padding:"16px",borderRadius:16,background:"linear-gradient(135deg,#FFF7ED,#FEF3C7)",border:"2px solid #FED7AA"}}>
                <p style={{fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{cur.name}</p>
                <div style={{position:"relative",width:120,height:120,margin:"0 auto 10px"}}>
                  <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F0ECE8" strokeWidth="10"/>
                    <circle cx="60" cy="60" r="52" fill="none" stroke={curBlock?curBlock.color:"#F97316"} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOff} style={{transition:"stroke-dashoffset 1s linear"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <p style={{fontSize:28}}>{curBlock?curBlock.emoji:"⏱"}</p>
                    <p style={{fontSize:16,color:"#2D3A5A",fontWeight:700}}>{Math.floor(routineBlockSecs/60)+":"+(routineBlockSecs%60<10?"0":"")+routineBlockSecs%60}</p>
                  </div>
                </div>
                <p style={{fontSize:15,color:"#2D3A5A",fontWeight:800,marginBottom:3}}>{curBlock?curBlock.label:"Terminé !"}</p>
                <p style={{fontSize:11,color:"#8090B0"}}>Bloc {routineBlockIdx+1} / {cur.blocks.length}</p>
              </div>
              {nextBlock&&(
                <div style={{padding:"10px 14px",borderRadius:12,background:"#FFFFF8",border:"1.5px solid #FED7AA",display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:nextBlock.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{nextBlock.emoji}</div>
                  <div>
                    <p style={{fontSize:10,color:"#B0A090",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6}}>Prochain</p>
                    <p style={{fontSize:13,color:"#2D3A5A",fontWeight:700}}>{nextBlock.label}</p>
                    <p style={{fontSize:10,color:"#8090B0"}}>{nextBlock.dur+" min"}</p>
                  </div>
                </div>
              )}
              <button onClick={stopRoutine} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:"#EF4444",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>⏹ Arrêter la routine</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* ── ROUTINE RAPIDE 5 MIN ── */}
              {(function(){
                var quickRoutine={id:"quick5",name:"Routine rapide",emoji:"⚡",color:"#F59E0B",blocks:[
                  {id:"q1",label:"4 grandes respirations",emoji:"🌬️",dur:1,color:"#BAE6FD"},
                  {id:"q2",label:"Écris 1 chose à faire maintenant",emoji:"✏️",dur:1,color:"#C4B5FD"},
                  {id:"q3",label:"Bois un verre d'eau",emoji:"💧",dur:1,color:"#A7F3D0"},
                  {id:"q4",label:"Lance-toi sur cette 1 chose",emoji:"🚀",dur:2,color:"#FDE68A"},
                ]};
                return(
                  <button onClick={function(){startRoutine(quickRoutine);}} style={{width:"100%",padding:"12px 16px",borderRadius:14,border:"2px dashed #F59E0B",background:"linear-gradient(135deg,#FFFBEB,#FFF7ED)",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"#F59E0B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚡</div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,color:"#92400E",fontWeight:800,marginBottom:2}}>Routine rapide · 5 min</p>
                      <p style={{fontSize:10,color:"#B45309"}}>Pour les jours où tout déraille 🌬️ 🎯 💧 🚀</p>
                    </div>
                    <span style={{fontSize:22,color:"#F59E0B"}}>▶</span>
                  </button>
                );
              })()}

              {/* ── SUGGESTIONS FLOWI ── */}
              {(function(){
                var nowH=new Date().getHours();
                var energy=energyLog[selDate]||0;
                var suggestion=null;
                if(nowH>=5&&nowH<11){
                  suggestion=energy<=2
                    ?{text:"Matin calme détecté 🌤️ — ta routine du matin en douceur ?",routineId:"r1"}
                    :{text:"Belle énergie ce matin ⚡ — parfait pour lancer ta routine !",routineId:"r1"};
                } else if(nowH>=20||nowH<5){
                  suggestion={text:"C'est l'heure de décompresser 🌙 — ta routine du soir t'attend.",routineId:"r2"};
                }
                if(!suggestion)return null;
                var suggestedR=routines.find(function(r){return r.id===suggestion.routineId;});
                if(!suggestedR)return null;
                return(
                  <div style={{borderRadius:13,background:"linear-gradient(135deg,#F0FDF4,#ECFDF5)",border:"1.5px solid #6EE7B7",padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20,flexShrink:0}}>🌿</span>
                    <div style={{flex:1}}>
                      <p style={{fontSize:11,color:"#065F46",fontWeight:700,marginBottom:3}}>{suggestion.text}</p>
                      <button onClick={function(){startRoutine(suggestedR);}} style={{padding:"4px 12px",borderRadius:8,border:"none",background:"#10B981",color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>{"▶ "+suggestedR.name}</button>
                    </div>
                  </div>
                );
              })()}

              {/* ── VOIX FLOWI ── */}
              {(function(){
                var nowH=new Date().getHours();
                var totalStreak=routines.reduce(function(max,r){
                  var dates=routineLog[r.id]||[];var s=0;var d=new Date(TODAY+"T12:00:00");
                  while(true){var ds=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());if(dates.indexOf(ds)>=0){s++;d.setDate(d.getDate()-1);}else break;}
                  return Math.max(max,s);
                },0);
                var msg=null;
                if(totalStreak>=7)msg="7 jours d'affilée — tu construis quelque chose de solide. 🔥";
                else if(totalStreak>=3)msg="3 jours consécutifs. La régularité commence à s'installer. 🌿";
                else if(nowH>=20)msg="Avant de terminer la journée — ta routine du soir t'attend. 🌙";
                else if(nowH>=5&&nowH<10)msg="Commencer la journée avec une routine, c'est lui donner une direction. ☀️";
                if(!msg)return null;
                return <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#8B5CF6",fontStyle:"italic",lineHeight:1.7,textAlign:"center",padding:"0 4px 8px",opacity:0.85}}>{msg}</p>;
              })()}

              {/* ── MES ROUTINES ── */}
              <div>
                <p style={{fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Mes routines</p>
                {routines.length===0&&(
                  <div style={{textAlign:"center",padding:"16px 8px"}}>
                    <p style={{fontSize:24,marginBottom:8}}>🔁</p>
                    <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:"#D1D5DB",fontStyle:"italic",marginBottom:10}}>Aucune routine pour l'instant.</p>
                    <button onClick={function(){setCreatingRoutine(true);}} style={{padding:"6px 16px",borderRadius:20,border:"1.5px solid #E5E7EB",background:"#F9FAFB",fontFamily:"'Inter',sans-serif",fontSize:11,color:"#6B7280",cursor:"pointer",fontWeight:600}}>Créer ma première routine →</button>
                  </div>
                )}
                {routines.map(function(r){
                  var totalMin=r.blocks.reduce(function(s,b){return s+b.dur;},0);
                  var rColor=r.color||"#F97316";
                  var completedDates=routineLog[r.id]||[];
                  // Streak
                  var streak=0;
                  var d=new Date(TODAY+"T12:00:00");
                  while(true){
                    var ds=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
                    if(completedDates.indexOf(ds)>=0){streak++;d.setDate(d.getDate()-1);}
                    else break;
                  }
                  // 7 derniers jours
                  var last7=[];
                  for(var di=6;di>=0;di--){
                    var dd=new Date();dd.setDate(dd.getDate()-di);
                    var dds=dd.getFullYear()+"-"+pad(dd.getMonth()+1)+"-"+pad(dd.getDate());
                    last7.push({date:dds,done:completedDates.indexOf(dds)>=0,isToday:dds===TODAY});
                  }
                  var WD=["L","M","M","J","V","S","D"];
                  return(
                    <div key={r.id} style={{marginBottom:8,borderRadius:14,background:"#FFFFFF",border:"1.5px solid "+rColor+"33",overflow:"hidden",boxShadow:"0 2px 8px "+rColor+"11"}}>
                      {/* Header */}
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"linear-gradient(135deg,"+rColor+"10,"+rColor+"05)",cursor:"pointer"}} onClick={function(){startRoutine(r);}}>
                        <div style={{width:42,height:42,borderRadius:12,background:rColor+"22",border:"2px solid "+rColor+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{r.emoji||"🔁"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,color:"#1F2937",fontWeight:700,marginBottom:1}}>{r.name}</p>
                          <p style={{fontSize:10,color:"#9CA3AF"}}>{r.blocks.length+" étapes · "+totalMin+" min"}</p>
                        </div>
                        {streak>0&&<div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                          <span style={{fontSize:14}}>🔥</span>
                          <span style={{fontSize:13,color:"#F97316",fontWeight:800}}>{streak}</span>
                        </div>}
                        <button onClick={function(e){e.stopPropagation();setRoutines(function(p){return p.filter(function(x){return x.id!==r.id;});});}} style={{border:"none",background:"none",color:"#D1D5DB",fontSize:14,cursor:"pointer",padding:"4px",flexShrink:0}}>×</button>
                        <span style={{fontSize:20,color:rColor,flexShrink:0}}>▶</span>
                      </div>
                      {/* Block pills */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"6px 12px",borderTop:"1px solid "+rColor+"18"}}>
                        {r.blocks.map(function(b,bi){return(
                          <div key={bi} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:20,background:b.color||"#F3F4F6",border:"1px solid "+(b.color||"#E5E7EB")+"88"}}>
                            <span style={{fontSize:11}}>{b.emoji}</span>
                            <span style={{fontSize:9,color:"#374151",fontWeight:600}}>{b.label}</span>
                            <span style={{fontSize:9,color:"#9CA3AF"}}>{b.dur+"m"}</span>
                          </div>
                        );})}
                      </div>
                      {/* Week dots */}
                      <div style={{display:"flex",gap:3,padding:"6px 12px 8px",alignItems:"center"}}>
                        {last7.map(function(day,i){return(
                          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                            <span style={{fontSize:8,color:day.isToday?rColor:"#D1D5DB",fontWeight:day.isToday?800:400}}>{WD[(new Date(day.date+"T12:00:00").getDay()+6)%7]}</span>
                            <div style={{width:10,height:10,borderRadius:"50%",background:day.done?rColor:day.isToday?"#E5E7EB":"#F3F4F6",border:"1.5px solid "+(day.done?rColor:day.isToday?rColor+"66":"#E5E7EB"),transition:"background 0.2s"}}/>
                          </div>
                        );})}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── CRÉER ── */}
              <div style={{borderRadius:14,border:"1.5px solid #E5E7EB",overflow:"hidden"}}>
                <button onClick={function(){setCreatingRoutine(function(v){return !v;});}} style={{width:"100%",padding:"10px 14px",display:"flex",alignItems:"center",gap:8,background:creatingRoutine?"#FFF7ED":"#FAFAFA",border:"none",cursor:"pointer",borderBottom:creatingRoutine?"1px solid #FED7AA":"none"}}>
                  <span style={{fontSize:16}}>{creatingRoutine?"▲":"＋"}</span>
                  <p style={{fontSize:12,color:creatingRoutine?"#9A3412":"#374151",fontWeight:600}}>Créer une routine</p>
                </button>
                {creatingRoutine&&(
                  <div style={{padding:"12px 14px",background:"#FFFDF8"}}>
                    {/* Nom + emoji + couleur */}
                    <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                      <input value={newRoutineEmoji} onChange={function(e){setNewRoutineEmoji(e.target.value);}} style={{width:40,fontSize:20,textAlign:"center",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"6px 2px",background:"white"}}/>
                      <input value={newRoutineName} onChange={function(e){setNewRoutineName(e.target.value);}} placeholder="Nom de la routine..." style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:8,padding:"7px 10px",fontSize:12,background:"white"}}/>
                    </div>
                    {/* Couleur de la routine */}
                    <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                      {ROUTINE_COLORS.map(function(c){return(
                        <button key={c} onClick={function(){setNewRoutineColor(c);}} style={{width:22,height:22,borderRadius:"50%",background:c,border:newRoutineColor===c?"3px solid #1F2937":"2px solid transparent",cursor:"pointer",flexShrink:0}}/>
                      );})}
                    </div>
                    {/* Blocs existants */}
                    {draftBlocks.length>0&&(
                      <div style={{marginBottom:10}}>
                        {draftBlocks.map(function(b,bi){return(
                          <div key={bi} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",marginBottom:4,borderRadius:8,background:b.color+"33",border:"1px solid "+b.color+"66"}}>
                            <span style={{fontSize:14}}>{b.emoji}</span>
                            <p style={{flex:1,fontSize:11,color:"#374151",fontWeight:500}}>{b.label}</p>
                            <p style={{fontSize:10,color:"#6B7280"}}>{b.dur+"min"}</p>
                            <button onClick={function(){var idx=bi;setDraftBlocks(function(p){return p.filter(function(_,i){return i!==idx;});});}} style={{border:"none",background:"none",color:"#D1D5DB",fontSize:12,cursor:"pointer"}}>×</button>
                          </div>
                        );})}
                      </div>
                    )}
                    {/* ── IA ── */}
                    <div style={{padding:"8px 10px",borderRadius:10,background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1.5px solid #C7D2FE",marginBottom:10}}>
                      <p style={{fontSize:10,color:"#3730A3",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>🧠 Coach</p>
                      <textarea
                        value={routineAiPrompt}
                        onChange={function(e){setRoutineAiPrompt(e.target.value);}}
                        placeholder={"Ex: Routine du matin avec méditation et sport..."}
                        rows={3}
                        style={{width:"100%",border:"1.5px solid #C7D2FE",borderRadius:8,padding:"7px 9px",fontSize:11,resize:"none",background:"white",color:"#1E1B4B",lineHeight:1.5,marginBottom:6}}
                      />
                      <button onClick={function(){
                        if(!routineAiPrompt.trim()||routineAiLoading)return;
                        setRoutineAiLoading(true);
                        fetch("https://api.anthropic.com/v1/messages",{
                          method:"POST",
                          headers:{"Content-Type":"application/json"},
                          body:JSON.stringify({
                            model:"claude-sonnet-4-5",
                            max_tokens:1000,
                            messages:[{role:"user",content:"Tu es un expert en routines, productivité et bien-être. Génère une routine structurée basée sur cette description : "+routineAiPrompt+"\n\nRéponds UNIQUEMENT en JSON valide sans markdown. Format:\n{\"name\":\"Nom de la routine\",\"emoji\":\"emoji unique\",\"color\":\"code hexadécimal parmi: #F97316 #8B5CF6 #3B82F6 #10B981 #E11D48 #F59E0B\",\"blocks\":[{\"label\":\"Nom du bloc\",\"emoji\":\"emoji\",\"dur\":nombre_entier_minutes,\"color\":\"code hex parmi: #FED7AA #C4B5FD #A7F3D0 #BAE6FD #FCE7F3 #FDE68A #FECDD3 #D9F99D\"}]}"}]
                          })
                        }).then(function(r){return r.json();}).then(function(data){
                          var text=(data.content&&data.content[0]&&data.content[0].text)||"{}";
                          var clean=text.replace(/```json|```/g,"").trim();
                          var parsed=JSON.parse(clean);
                          if(parsed.name)setNewRoutineName(parsed.name);
                          if(parsed.emoji)setNewRoutineEmoji(parsed.emoji);
                          if(parsed.color)setNewRoutineColor(parsed.color);
                          if(parsed.blocks&&parsed.blocks.length>0){
                            setDraftBlocks(parsed.blocks.map(function(b){return Object.assign({},b,{id:gid(),dur:parseInt(b.dur)||5});})
                          );}
                          setRoutineAiLoading(false);
                          setRoutineAiPrompt("");
                        }).catch(function(){setRoutineAiLoading(false);});
                      }} disabled={routineAiLoading||!routineAiPrompt.trim()} style={{width:"100%",padding:"6px",borderRadius:8,border:"none",background:routineAiLoading||!routineAiPrompt.trim()?"#C7D2FE":"#4F46E5",color:"white",fontSize:11,fontWeight:700,cursor:routineAiLoading||!routineAiPrompt.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                        {routineAiLoading?"⟳  Génération...":"✨  Créer la routine"}
                      </button>
                    </div>

                    {/* Ajouter un bloc */}
                    <div style={{padding:"8px 10px",borderRadius:10,background:"white",border:"1.5px dashed #E5E7EB",marginBottom:10}}>
                      <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Ajouter un bloc</p>
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        <input value={newBlock.emoji} onChange={function(e){var v=e.target.value;setNewBlock(function(p){return Object.assign({},p,{emoji:v});});}} style={{width:36,fontSize:16,textAlign:"center",border:"1.5px solid #E5E7EB",borderRadius:7,padding:"5px 2px",background:"#FAFAFA"}}/>
                        <input value={newBlock.label} onChange={function(e){var v=e.target.value;setNewBlock(function(p){return Object.assign({},p,{label:v});});}} placeholder="Nom du bloc..." style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:7,padding:"5px 8px",fontSize:11,background:"#FAFAFA"}}/>
                        <input type="number" value={newBlock.dur} min={1} max={120} onChange={function(e){var v=parseInt(e.target.value)||5;setNewBlock(function(p){return Object.assign({},p,{dur:v});});}} style={{width:44,border:"1.5px solid #E5E7EB",borderRadius:7,padding:"5px 4px",fontSize:11,textAlign:"center",background:"#FAFAFA"}}/>
                        <span style={{fontSize:10,color:"#9CA3AF",alignSelf:"center",flexShrink:0}}>min</span>
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
                        {BLOCK_COLORS.map(function(c){return(
                          <button key={c} onClick={function(){setNewBlock(function(p){return Object.assign({},p,{color:c});});}} style={{width:18,height:18,borderRadius:"50%",background:c,border:newBlock.color===c?"2.5px solid #1F2937":"2px solid transparent",cursor:"pointer"}}/>
                        );})}
                      </div>
                      <button onClick={function(){
                        if(!newBlock.label.trim())return;
                        setDraftBlocks(function(p){return[...p,Object.assign({},newBlock,{id:gid()})];});
                        setNewBlock({label:"",emoji:"⭐",dur:10,color:"#FED7AA"});
                      }} style={{width:"100%",padding:"5px",borderRadius:7,border:"none",background:"#F3F4F6",fontSize:11,fontWeight:600,color:"#374151",cursor:"pointer"}}>+ Ajouter ce bloc</button>
                    </div>
                    {/* Sauvegarder la routine */}
                    <button onClick={function(){
                      if(!newRoutineName.trim()||draftBlocks.length===0)return;
                      var newR={id:gid(),name:newRoutineName,emoji:newRoutineEmoji||"🔁",color:newRoutineColor,blocks:draftBlocks};
                      setRoutines(function(p){return[...p,newR];});
                      setNewRoutineName("");setNewRoutineEmoji("🌅");setNewRoutineColor("#F97316");setDraftBlocks([]);setCreatingRoutine(false);
                    }} disabled={!newRoutineName.trim()||draftBlocks.length===0} style={{width:"100%",padding:"9px",borderRadius:10,border:"none",background:(!newRoutineName.trim()||draftBlocks.length===0)?"#E5E7EB":"#F97316",color:"white",fontSize:12,fontWeight:700,cursor:(!newRoutineName.trim()||draftBlocks.length===0)?"not-allowed":"pointer"}}>💾 Enregistrer la routine</button>
                  </div>
                )}
              </div>

              {/* Astuce */}
              <div style={{padding:"10px 12px",borderRadius:12,background:"#F0FDF4",border:"1.5px solid #86EFAC"}}>
                <p style={{fontSize:10,color:"#14532D",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>💡 Astuce focus</p>
                <p style={{fontSize:11,color:"#166534",lineHeight:1.5}}>Commence par le plus facile. Chaque bloc accompli = dopamine ! Les routines construisent des automatismes.</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─── ROUTINES RIGHT ──────────────────────────────────────
    if(tab==="routines"){
      var JOURS=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
      var JOUR_LABELS={lundi:"Lun",mardi:"Mar",mercredi:"Mer",jeudi:"Jeu",vendredi:"Ven",samedi:"Sam",dimanche:"Dim"};
      var todayJour=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][new Date().getDay()];
      return(
        <div style={{padding:"14px 16px"}}>
          <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:14}}>📅 Calendrier des routines</p>

          {/* Ajouter au calendrier */}
          <div style={{marginBottom:16,padding:"12px 14px",borderRadius:14,background:"#F9FAFB",border:"1.5px solid #E5E7EB"}}>
            <p style={{fontSize:11,color:"#374151",fontWeight:600,marginBottom:10}}>Planifier une routine</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <select value={scheduleRoutineId} onChange={function(e){setScheduleRoutineId(e.target.value);}} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:11,background:"white",color:"#374151"}}>
                <option value="">Choisir une routine...</option>
                {routines.map(function(r){return(<option key={r.id} value={r.id}>{r.emoji+" "+r.name}</option>);})}
              </select>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {JOURS.map(function(j){return(
                  <button key={j} onClick={function(){setScheduleDay(j);}} style={{padding:"4px 8px",borderRadius:7,border:"1.5px solid "+(scheduleDay===j?"#F97316":"#E5E7EB"),background:scheduleDay===j?"#FFF7ED":"white",fontSize:10,fontWeight:scheduleDay===j?700:400,color:scheduleDay===j?"#9A3412":"#6B7280",cursor:"pointer"}}>{JOUR_LABELS[j]}</button>
                );})}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="time" value={scheduleTime} onChange={function(e){setScheduleTime(e.target.value);}} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:12,background:"white"}}/>
                <button onClick={function(){
                  if(!scheduleRoutineId)return;
                  var key=scheduleDay;
                  var entry={id:gid(),routineId:scheduleRoutineId,time:scheduleTime};
                  setRoutineSchedule(function(p){var o=Object.assign({},p);o[key]=(o[key]||[]).concat(entry);return o;});
                  setScheduleRoutineId("");
                }} disabled={!scheduleRoutineId} style={{padding:"7px 14px",borderRadius:8,border:"none",background:scheduleRoutineId?"#F97316":"#E5E7EB",color:"white",fontSize:11,fontWeight:700,cursor:scheduleRoutineId?"pointer":"not-allowed"}}>+ Ajouter</button>
              </div>
            </div>
          </div>

          {/* Vue hebdomadaire */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {JOURS.map(function(jour){
              var slots=(routineSchedule[jour]||[]).sort(function(a,b){return a.time>b.time?1:-1;});
              var isToday=jour===todayJour;
              return(
                <div key={jour} style={{borderRadius:12,border:"1.5px solid "+(isToday?"#FED7AA":"#E5E7EB"),background:isToday?"#FFFDF8":"#FAFAFA",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:slots.length>0?"1px solid "+(isToday?"#FED7AA":"#F0F0F0"):"none"}}>
                    <div style={{width:28,height:28,borderRadius:8,background:isToday?"#F97316":"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:700,color:isToday?"white":"#6B7280"}}>{JOUR_LABELS[jour]}</span>
                    </div>
                    <p style={{fontSize:11,fontWeight:isToday?700:500,color:isToday?"#9A3412":"#6B7280",flex:1}}>{isToday?"Aujourd'hui":jour.charAt(0).toUpperCase()+jour.slice(1)}</p>
                    {slots.length===0&&<p style={{fontSize:9,color:"#D1D5DB"}}>Aucune routine</p>}
                  </div>
                  {slots.map(function(slot){
                    var r=routines.find(function(x){return x.id===slot.routineId;});
                    if(!r)return null;
                    var totalMin=r.blocks.reduce(function(s,b){return s+b.dur;},0);
                    return(
                      <div key={slot.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",borderBottom:"1px solid "+(isToday?"#FEF3C7":"#F5F5F5")}}>
                        <span style={{fontSize:14,flexShrink:0}}>{r.emoji}</span>
                        <div style={{flex:1}}>
                          <p style={{fontSize:11,color:"#1F2937",fontWeight:600}}>{r.name}</p>
                          <p style={{fontSize:9,color:"#9CA3AF"}}>{slot.time+" · "+totalMin+" min · "+r.blocks.length+" étapes"}</p>
                        </div>
                        <div style={{display:"flex",gap:5,alignItems:"center"}}>
                          <button onClick={function(){startRoutine(r);setTab("routines");}} style={{padding:"3px 9px",borderRadius:7,border:"none",background:(r.color||"#F97316")+"22",fontSize:9,fontWeight:700,color:r.color||"#F97316",cursor:"pointer"}}>▶ Lancer</button>
                          <button onClick={function(){var sid=slot.id;var j=jour;setRoutineSchedule(function(p){var o=Object.assign({},p);o[j]=(o[j]||[]).filter(function(s){return s.id!==sid;});return o;});}} style={{border:"none",background:"none",color:"#D1D5DB",fontSize:12,cursor:"pointer"}}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Lien vers agenda */}
          <button onClick={function(){
            var todaySlots=(routineSchedule[todayJour]||[]);
            todaySlots.forEach(function(slot){
              var r=routines.find(function(x){return x.id===slot.routineId;});
              if(!r)return;
              var totalMin=r.blocks.reduce(function(s,b){return s+b.dur;},0);
              var h=slot.time?parseInt(slot.time.split(":")[0]):8;
              if(h>=6&&h<=21){
                setJourBlocks(function(p){var o=Object.assign({},p);var d=selDate;var b=Object.assign({},o[d]||{});b[String(h)]=(b[String(h)]?b[String(h)]+" · ":"")+r.emoji+" "+r.name+" ("+totalMin+"min)";o[d]=b;return o;});
              }
            });
            setTab("agenda");
          }} style={{marginTop:14,width:"100%",padding:"9px",borderRadius:11,border:"1.5px solid #FED7AA",background:"#FFF7ED",fontSize:11,fontWeight:700,color:"#9A3412",cursor:"pointer"}}>📅 Injecter aujourd'hui dans l'agenda</button>
        </div>
      );
    }

    // ─── COACH RIGHT ─────────────────────────────────────────
    if(tab==="coach"){
      var pendingCount=todos.filter(function(t){return !t.done;}).length;
      var urgentCount=todos.filter(function(t){return !t.done&&t.priority==="urgente";}).length;
      var energyNow=energyLog[TODAY]||0;
      var ELABELS=["—","Épuisé 🪫","Faible ⚡","Moyen 🔋","Élevé 🔥","Maximum 💥"];
      var FOCUS_TIPS=[
        {emoji:"🎯",title:"Une tâche à la fois",tip:"Le cerveau actif prospère dans le focus unique. Ferme les autres onglets."},
        {emoji:"⏱",title:"Sprints de 25 min",tip:"Bloque des plages courtes. Le cerveau fonctionne par sprints, pas en marathon."},
        {emoji:"🏃",title:"Body doubling",tip:"Travaille avec quelqu'un (même en silence). La présence stimule la concentration."},
        {emoji:"🎵",title:"Son blanc ou lofi",tip:"Brown noise, binaural beats ou Spotify lofi aident à créer une bulle de focus."},
        {emoji:"🌊",title:"Surfe les vagues",tip:"Identifie tes heures de pic d'énergie et place tes tâches importantes alors."},
      ];
      return(
        <div style={{padding:"14px 16px"}}>
          {/* Contexte du jour */}
          <div style={{marginBottom:14,padding:"12px 14px",borderRadius:14,background:"#F0FDF4",border:"1.5px solid #86EFAC"}}>
            <p style={{fontSize:10,color:"#14532D",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>📊 Ton contexte aujourd'hui</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontSize:11,color:"#374151"}}>Énergie</p>
                <p style={{fontSize:11,color:"#16A34A",fontWeight:600}}>{ELABELS[energyNow]}</p>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontSize:11,color:"#374151"}}>Tâches en attente</p>
                <p style={{fontSize:11,color:pendingCount>5?"#DC2626":"#16A34A",fontWeight:600}}>{pendingCount}</p>
              </div>
              {urgentCount>0&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <p style={{fontSize:11,color:"#374151"}}>Urgentes</p>
                  <p style={{fontSize:11,color:"#DC2626",fontWeight:700}}>{"🔴 "+urgentCount}</p>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontSize:11,color:"#374151"}}>XP total</p>
                <p style={{fontSize:11,color:"#CA8A04",fontWeight:600}}>{"⭐ "+xp+" XP"}</p>
              </div>
            </div>
            <button onClick={function(){
              var ctx="Contexte: "+pendingCount+" tâches en attente (dont "+urgentCount+" urgentes), énergie "+ELABELS[energyNow]+", "+xp+" XP. Donne-moi un encouragement personnalisé et 1 conseil concret pour commencer ma journée.";
              setCoachInput(ctx);
            }} style={{marginTop:10,width:"100%",padding:"6px",borderRadius:8,border:"none",background:"#16A34A",color:"white",fontSize:10,fontWeight:700,cursor:"pointer"}}>🤖 Analyse mon contexte</button>
          </div>

          {/* Astuces focus */}
          <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>💡 Stratégies focus</p>
          {FOCUS_TIPS.map(function(t){return(
            <div key={t.emoji} style={{marginBottom:8,padding:"9px 12px",borderRadius:11,background:"#FAFAFA",border:"1px solid #E5E7EB"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <span style={{fontSize:16}}>{t.emoji}</span>
                <p style={{fontSize:11,color:"#1F2937",fontWeight:700}}>{t.title}</p>
              </div>
              <p style={{fontSize:10,color:"#6B7280",lineHeight:1.5,paddingLeft:23}}>{t.tip}</p>
            </div>
          );})}

          <div style={{marginTop:4,padding:"10px 12px",borderRadius:11,background:"#FFFBEB",border:"1px solid #FDE68A"}}>
            <p style={{fontSize:10,color:"#92400E",lineHeight:1.6,fontStyle:"italic"}}>💛 Ce n'est pas un manque de volonté. Chaque cerveau a son propre rythme. Tu fais de ton mieux, et c'est suffisant.</p>
          </div>
        </div>
      );
    }
    // ─── RECOMPENSES RIGHT (historique XP) ───────────────────
    if(tab==="recompenses"){
      var todayXp=xpLog.filter(function(e){return e.date===TODAY;}).reduce(function(s,e){return s+e.amount;},0);
      var weekXp=(function(){var w=new Date();w.setDate(w.getDate()-7);return xpLog.filter(function(e){var d=new Date(e.date+"T12:00:00");return d>=w;}).reduce(function(s,e){return s+e.amount;},0);})();
      var XP_SOURCES=[
        {icon:"✅",label:"Tâche accomplie",val:"+5 XP"},
        {icon:"⏱",label:"Session Focus",val:"+15 XP"},
        {icon:"🔁",label:"Routine complète",val:"+20 XP"},
        {icon:"💪",label:"Séance sportive",val:"+5 XP"},
        {icon:"💧",label:"Habitude quotidienne",val:"+3 XP"},
      ];
      return(
        <div style={{padding:"14px 16px",overflowY:"auto",height:"100%"}}>
          {/* Stats rapides */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[["Aujourd'hui","⚡",todayXp+" XP","#F59E0B"],["Cette semaine","📅",weekXp+" XP","#3B82F6"],["Total","🏆",xp+" XP","#CA8A04"]].map(function(s){return(
              <div key={s[0]} style={{padding:"10px 6px",borderRadius:12,background:"#FAFAFA",border:"1px solid #E5E7EB",textAlign:"center"}}>
                <p style={{fontSize:18,marginBottom:2}}>{s[1]}</p>
                <p style={{fontSize:12,color:s[3],fontWeight:800}}>{s[2]}</p>
                <p style={{fontSize:9,color:"#9CA3AF",marginTop:1}}>{s[0]}</p>
              </div>
            );})}
          </div>

          {/* Comment gagner des XP */}
          <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>⚡ Comment gagner des XP</p>
          {XP_SOURCES.map(function(s){return(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",marginBottom:4,borderRadius:9,background:"#FAFAFA",border:"1px solid #E5E7EB"}}>
              <span style={{fontSize:15,flexShrink:0}}>{s.icon}</span>
              <p style={{flex:1,fontSize:11,color:"#374151"}}>{s.label}</p>
              <p style={{fontSize:11,color:"#CA8A04",fontWeight:700,flexShrink:0}}>{s.val}</p>
            </div>
          );})}

          {/* Historique */}
          <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,margin:"14px 0 8px"}}>📋 Historique</p>
          {xpLog.length===0&&(
            <div style={{textAlign:"center",paddingTop:20}}>
              <p style={{fontSize:32,marginBottom:8}}>🌱</p>
              <p style={{fontSize:12,color:"#D1D5DB"}}>Complète des actions pour gagner des XP !</p>
            </div>
          )}
          {xpLog.slice(0,30).map(function(entry){return(
            <div key={entry.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",marginBottom:4,borderRadius:9,background:"#FAFAFA",border:"1px solid #F0F0F0"}}>
              <div style={{width:30,height:30,borderRadius:9,background:"#FEF9C3",border:"1px solid #FDE047",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <p style={{fontSize:10,color:"#92400E",fontWeight:800}}>+{entry.amount}</p>
              </div>
              <p style={{fontSize:11,color:"#374151",flex:1,lineHeight:1.4}}>{entry.reason}</p>
              <p style={{fontSize:9,color:"#D1D5DB",flexShrink:0}}>{new Date(entry.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>
            </div>
          );})}
        </div>
      );
    }

    return <div/>;


  };

  var allTabs=NAV_GROUPS.reduce(function(acc,g){return acc.concat(g.tabs);}, [{id:"accueil",label:"Accueil",icon:"🏠"}]);
  var sectionInfo=allTabs.find(function(x){return x.id===tab;})||{label:"Section",icon:"📋"};

  return (
    <div style={{display:"flex",width:"100vw",height:"100vh",overflow:"hidden",background:"#F3F4F6",filter:darkMode?"invert(1) hue-rotate(180deg)":"none",transition:"filter 0.3s"}}>
      <style>{`
        @keyframes blobPop{0%{transform:scale(0.7);opacity:0.4}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        body,input,textarea,button,select{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;}
        .serif{font-family:'Playfair Display',Georgia,serif;}
        @keyframes breathIn{from{transform:translate(-50%,-50%) scale(0.7)}to{transform:translate(-50%,-50%) scale(1.2)}}
        @keyframes breathOut{from{transform:translate(-50%,-50%) scale(1.2)}to{transform:translate(-50%,-50%) scale(0.7)}}
        @keyframes ringFill{from{stroke-dashoffset:var(--circ)}to{stroke-dashoffset:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes lotusReveal{0%{clip-path:inset(0% 0% 100% 0%)}100%{clip-path:inset(0% 0% 0% 0%)}}
        .pop{animation:pop 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px}
        .dark-emoji{display:inline-block}
      `}</style>

      {/* ── ONBOARDING ── */}
      {!onboarded&&(function(){
        var OB_DEFIS_OPTIONS=[
          {id:"procrastination",label:"Procrastination",icon:"⏳"},
          {id:"focus",label:"Difficultés de focus",icon:"🎯"},
          {id:"organisation",label:"Organisation",icon:"📋"},
          {id:"memoire",label:"Mémoire & oublis",icon:"🧠"},
          {id:"motivation",label:"Manque de motivation",icon:"🔋"},
          {id:"temps",label:"Gestion du temps",icon:"⏱"},
          {id:"priorites",label:"Prioriser les tâches",icon:"🚀"},
          {id:"stress",label:"Stress & anxiété",icon:"😤"},
        ];
        var OB_OBJECTIFS=[
          {id:"quotidien",label:"Mieux planifier mon quotidien",icon:"📅"},
          {id:"habitudes",label:"Construire de bonnes habitudes",icon:"✅"},
          {id:"focus_obj",label:"Améliorer mon focus",icon:"⏱"},
          {id:"focus-mode",label:"Mieux gérer mon focus",icon:"🧠"},
          {id:"stress_obj",label:"Réduire mon stress",icon:"🌿"},
        ];
        var toggleDefi=function(id){
          setObDefis(function(p){return p.includes(id)?p.filter(function(x){return x!==id;}):p.length<4?[...p,id]:p;});
        };
        var finishOnboarding=function(){
          var habitMap={
            procrastination:[{label:"Décomposer une tâche",icon:"✂️"},{label:"Règle des 2 minutes",icon:"⚡"}],
            focus:[{label:"Session focus 25min",icon:"⏱"},{label:"Téléphone en mode silence",icon:"📵"}],
            organisation:[{label:"Planifier la journée",icon:"📋"},{label:"Vider ma tête le soir",icon:"🌙"}],
            memoire:[{label:"Revoir mes notes",icon:"📖"},{label:"Préparer mes affaires la veille",icon:"🎒"}],
            motivation:[{label:"Célébrer une petite victoire",icon:"🎉"},{label:"Écouter ma playlist motivation",icon:"🎵"}],
            temps:[{label:"Vérifier mon agenda matin",icon:"📅"},{label:"Estimations de temps",icon:"⏰"}],
            priorites:[{label:"Définir ma 1 priorité du jour",icon:"🎯"},{label:"Revue hebdomadaire",icon:"📊"}],
            stress:[{label:"Exercice de respiration",icon:"🌬️"},{label:"Marche de 10 minutes",icon:"🚶"}],
          };
          var newHabits=[];
          obDefis.forEach(function(d){
            var h=habitMap[d];
            if(h){h.forEach(function(x){newHabits.push({id:gid(),label:x.label,icon:x.icon,done:{}});});}
          });
          if(newHabits.length>0)setHabits(newHabits.slice(0,6));
          if(obName.trim()){
            setCoachMsgs([{role:"assistant",text:"Bonjour "+obName.trim()+" ! 👋 Je suis ton coach Flowi. Je connais tes défis et je suis là pour t'aider à avancer, une étape à la fois. Par où veux-tu commencer ?"}]);
          }
          setOnboarded(true);
        };

        /* ── ÉCRAN INTRO (step -1) ── */
        if(obStep===-1){
          return(
            <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#0F172A 0%,#1E1B4B 50%,#1E3A5F 100%)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto"}}>
              <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:24}}>
                {/* Logo */}
                <div style={{marginBottom:12}}>
                  <LotusIcon size={160} animated={true} col="#A78BFA" bg="rgba(255,255,255,0.08)"/>
                </div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:36,fontWeight:800,color:"#FFFFFF",marginBottom:4,textAlign:"center",letterSpacing:-1}}>Flowi</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:500,background:"linear-gradient(90deg,#60A5FA,#A78BFA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8,textAlign:"center",letterSpacing:0.5}}>Trouve ton flow.</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"rgba(255,255,255,0.6)",marginBottom:36,textAlign:"center",lineHeight:1.6}}>Ton planificateur intelligent,<br/>conçu pour les cerveaux actifs.</p>

                {/* Features */}
                <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12,marginBottom:36}}>
                  {[
                    {icon:"📅",title:"Agenda intelligent",desc:"Planifie ta journée, ta semaine et ton mois en un coup d'œil"},
                    {icon:"⏱",title:"Focus sans friction",desc:"Timer Pomodoro lié à tes tâches, avec récompenses XP"},
                    {icon:"✅",title:"Tâches & habitudes",desc:"Décompose, priorise et suis tes habitudes quotidiennes"},
                    {icon:"🧠",title:"Coach IA intégré",desc:"Disponible partout dans l'app pour t'aider à avancer"},
                  ].map(function(f,i){
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(10px)"}}>
                        <div style={{width:44,height:44,borderRadius:13,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{f.icon}</div>
                        <div>
                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{f.title}</p>
                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.4}}>{f.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={function(){setObStep(0);}} style={{width:"100%",padding:"16px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"white",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(99,102,241,0.4)",fontFamily:"'Inter',sans-serif",letterSpacing:0.2}}>
                  Commencer avec Flowi →
                </button>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:12,textAlign:"center"}}>2 minutes · 4 questions · 100% personnalisé</p>
                <button onClick={function(){setOnboarded(true);ss("onboarded",true);}} style={{marginTop:16,padding:"8px 20px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  Accéder directement →
                </button>
              </div>
            </div>
          );
        }

        /* ── QUESTIONNAIRE (steps 0-3) ── */
        var steps=[
          /* 0 — Prénom */
          <div key="s0" style={{textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:10}}>👋</div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,color:"#1E3A8A",marginBottom:6}}>Commençons !</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:24,lineHeight:1.6}}>L'app va se personnaliser selon tes réponses.</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:"#374151",marginBottom:8,textAlign:"left"}}>Comment tu t'appelles ?</p>
            <input
              value={obName}
              onChange={function(e){setObName(e.target.value);}}
              onKeyDown={function(e){if(e.key==="Enter"&&obName.trim())setObStep(1);}}
              placeholder="Ton prénom..."
              autoFocus
              style={{width:"100%",border:"2px solid #BFDBFE",borderRadius:12,padding:"13px 16px",fontSize:16,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",background:"#F8FBFF"}}
            />
          </div>,
          /* 1 — Profil focus */
          <div key="s1">
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:21,fontWeight:800,color:"#1E3A8A",marginBottom:4}}>{"Hey"+(obName.trim()?" "+obName.trim():"")+" 👋"}</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:18,lineHeight:1.6}}>À quoi ressemble ta journée type ?</p>
            {[
              {id:"diagnostique",label:"🌀 Pleine d'idées, mais difficile à structurer",desc:"Mon cerveau tourne vite — l'organisation suit difficilement",icon:""},
              {id:"soupcon",label:"⚡ Productive par moments, dispersée à d'autres",desc:"Je travaille par vagues d'énergie, pas de façon linéaire",icon:""},
              {id:"curiosite",label:"🎯 Efficace quand tout est clair",desc:"Je performe bien — je veux juste un meilleur système",icon:""},
            ].map(function(o){
              var sel=obTdah===o.id;
              return(
                <button key={o.id} onClick={function(){setObTdah(o.id);}} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"2px solid "+(sel?"#3B82F6":"#E5E7EB"),background:sel?"#EFF6FF":"#FAFAFA",marginBottom:10,textAlign:"left",cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:sel?"#1E40AF":"#374151",marginBottom:2}}>{o.label}</p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF",lineHeight:1.4}}>{o.desc}</p>
                  </div>
                  {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:"#3B82F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"white",fontSize:11,fontWeight:800}}>✓</span></div>}
                </button>
              );
            })}
          </div>,
          /* 2 — Défis */
          <div key="s2">
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:21,fontWeight:800,color:"#1E3A8A",marginBottom:4}}>Tes principaux défis</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:16,lineHeight:1.5}}>Choisis jusqu'à 4 défis — tes habitudes seront créées automatiquement.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {OB_DEFIS_OPTIONS.map(function(o){
                var sel=obDefis.includes(o.id);
                var maxed=obDefis.length>=4&&!sel;
                return(
                  <button key={o.id} onClick={function(){if(!maxed)toggleDefi(o.id);}} style={{padding:"12px 10px",borderRadius:12,border:"2px solid "+(sel?"#3B82F6":maxed?"#F3F4F6":"#E5E7EB"),background:sel?"#EFF6FF":maxed?"#F9FAFB":"#FAFAFA",cursor:maxed?"default":"pointer",display:"flex",alignItems:"center",gap:8,transition:"all 0.15s",opacity:maxed?0.5:1}}>
                    <span style={{fontSize:18}}>{o.icon}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:sel?700:500,color:sel?"#1E40AF":"#374151",textAlign:"left",lineHeight:1.3}}>{o.label}</span>
                  </button>
                );
              })}
            </div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF",marginTop:10,textAlign:"center"}}>{obDefis.length+"/4 sélectionnés"}</p>
          </div>,
          /* 3 — Objectif */
          <div key="s3">
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:21,fontWeight:800,color:"#1E3A8A",marginBottom:4}}>Ton objectif principal</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:16}}>Qu'est-ce que tu veux améliorer en premier ?</p>
            {OB_OBJECTIFS.map(function(o){
              var sel=obObjectif===o.id;
              return(
                <button key={o.id} onClick={function(){setObObjectif(o.id);}} style={{width:"100%",padding:"13px 16px",borderRadius:13,border:"2px solid "+(sel?"#3B82F6":"#E5E7EB"),background:sel?"#EFF6FF":"#FAFAFA",marginBottom:9,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
                  <span style={{fontSize:20}}>{o.icon}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:sel?700:500,color:sel?"#1E40AF":"#374151",flex:1}}>{o.label}</span>
                  {sel&&<div style={{width:18,height:18,borderRadius:"50%",background:"#3B82F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"white",fontSize:10,fontWeight:800}}>✓</span></div>}
                </button>
              );
            })}
          </div>,
          /* 4 — Récap */
          <div key="s4" style={{textAlign:"center"}}>
            <div style={{fontSize:58,marginBottom:10}}>🚀</div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,color:"#1E3A8A",marginBottom:6}}>{"Tout est prêt"+(obName.trim()?" "+obName.trim():"")+" !"}</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#6B7280",marginBottom:18,lineHeight:1.7}}>Tes habitudes personnalisées ont été créées. Ton coach te connaît déjà.</p>
            {obDefis.length>0&&(
              <div style={{padding:"12px 16px",borderRadius:14,background:"#F0FDF4",border:"1.5px solid #86EFAC",marginBottom:14,textAlign:"left"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#15803D",marginBottom:8}}>✅ Habitudes créées pour toi :</p>
                {obDefis.map(function(d){
                  var icons={procrastination:"✂️",focus:"⏱",organisation:"📋",memoire:"📖",motivation:"🎉",temps:"📅",priorites:"🎯",stress:"🌬️"};
                  var labels={procrastination:"Procrastination",focus:"Focus",organisation:"Organisation",memoire:"Mémoire",motivation:"Motivation",temps:"Gestion du temps",priorites:"Priorités",stress:"Stress"};
                  return <p key={d} style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#374151",marginBottom:3}}>{(icons[d]||"⭐")+" "+labels[d]}</p>;
                })}
              </div>
            )}
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF",lineHeight:1.6}}>Tu peux tout modifier dans l'app à tout moment.</p>
          </div>,
        ];
        var canNext=[
          obName.trim().length>0,
          obTdah!=="",
          obDefis.length>0,
          obObjectif!=="",
          true,
        ];
        return(
          <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:"#FFFFFF",borderRadius:24,padding:28,width:"100%",maxWidth:400,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}>
              {/* Progress dots — 4 étapes questionnaire uniquement */}
              <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:22}}>
                {[0,1,2,3,4].map(function(i){
                  return <div key={i} style={{width:i===obStep?24:8,height:8,borderRadius:4,background:i<=obStep?"#3B82F6":"#E5E7EB",transition:"all 0.3s"}}/>;
                })}
              </div>
              {steps[obStep]}
              <div style={{display:"flex",gap:10,marginTop:22}}>
                <button onClick={function(){setObStep(function(s){return s>0?s-1:-1;});}} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#F9FAFB",color:"#6B7280",fontSize:14,fontWeight:600,cursor:"pointer"}}>← Retour</button>
                {obStep<4?(
                  <button onClick={function(){if(canNext[obStep])setObStep(function(s){return s+1;});}} style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:canNext[obStep]?"linear-gradient(135deg,#1E40AF,#6D28D9)":"#E5E7EB",color:canNext[obStep]?"white":"#9CA3AF",fontSize:14,fontWeight:700,cursor:canNext[obStep]?"pointer":"default",transition:"all 0.2s"}}>Continuer →</button>
                ):(
                  <button onClick={finishOnboarding} style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#1E40AF,#6D28D9)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>🚀 Démarrer !</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── BOUTON COACH FLOTTANT ── */}
      {tab!=="coach"&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:100}}>
          {coachOpen&&(
            <div style={{position:"absolute",bottom:60,right:0,width:320,background:"#FFFFFF",borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",border:"1.5px solid #E5E7EB",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              {/* Header */}
              <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#1E40AF,#6D28D9)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🧠</span>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:"white"}}>Coach</p>
                </div>
                <button onClick={function(){setCoachOpen(false);}} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.2)",color:"white",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
              {/* Messages */}
              <div ref={coachScrollRef} style={{flex:1,overflowY:"auto",padding:"12px",maxHeight:260,display:"flex",flexDirection:"column",gap:8}}>
                {coachMsgs.map(function(m,i){
                  var isUser=m.role==="user";
                  return(
                    <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:isUser?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isUser?"linear-gradient(135deg,#3B82F6,#6D28D9)":"#F3F4F6"}}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:isUser?"white":"#374151",lineHeight:1.5}}>{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                {coachLoading&&(
                  <div style={{display:"flex",gap:4,padding:"8px 12px",borderRadius:"14px 14px 14px 4px",background:"#F3F4F6",width:"fit-content"}}>
                    {[0,1,2].map(function(i){return <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#9CA3AF",animation:"bounce 1.2s infinite",animationDelay:(i*0.2)+"s"}}/>;})}</div>
                )}
              </div>
              {/* Input */}
              <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6",display:"flex",gap:6}}>
                <input
                  value={coachInput}
                  onChange={function(e){setCoachInput(e.target.value);}}
                  onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendCoach();}}}
                  placeholder="Écris un message..."
                  style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:10,padding:"7px 10px",fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none",background:"#F9FAFB"}}
                />
                <button onClick={sendCoach} disabled={coachLoading||!coachInput.trim()} style={{width:34,height:34,borderRadius:10,border:"none",background:coachInput.trim()?"linear-gradient(135deg,#3B82F6,#6D28D9)":"#E5E7EB",color:"white",fontSize:16,cursor:coachInput.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>↑</button>
              </div>
            </div>
          )}
          {/* Bouton flottant */}
          <button onClick={function(){setCoachOpen(function(o){return !o;});}} style={{width:50,height:50,borderRadius:"50%",border:"none",background:coachOpen?"#EF4444":"linear-gradient(135deg,#1E40AF,#6D28D9)",color:"white",fontSize:22,cursor:"pointer",boxShadow:"0 4px 20px rgba(99,102,241,0.5)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {coachOpen?"×":"🧠"}
          </button>
        </div>
      )}

      {/* ── MODE MAUVAISE JOURNÉE ── */}
      {badDay&&(function(){
        var pendingTodos=todos.filter(function(t){return !t.done;});
        var elapsed=badDayTimer;
        var remaining=badDayTotal-elapsed;
        var pct=elapsed/badDayTotal*100;
        var isDone=elapsed>=badDayTotal;
        var DURATIONS=[[5,"5 min"],[10,"10 min"],[25,"25 min"]];
        return(
          <div style={{position:"fixed",inset:0,zIndex:800,background:"linear-gradient(160deg,#0F1729 0%,#1a1040 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
            {/* Exit */}
            <button onClick={function(){setBadDay(false);setBadDayActive(false);setBadDayTimer(0);clearInterval(badDayRef.current);}} style={{position:"absolute",top:20,right:20,width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>

            <div style={{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",alignItems:"center",gap:28}}>

              {/* Header */}
              <div style={{textAlign:"center"}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:28,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>Une chose à la fois. 🌿</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>Tu n'as pas besoin de tout faire.<br/>Juste la prochaine étape.</p>
              </div>

              {/* Tâche */}
              {!badDayActive&&(
                <div style={{width:"100%"}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:10,textAlign:"center"}}>Sur quoi tu travailles ?</p>
                  {pendingTodos.length>0?(
                    <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:180,overflowY:"auto"}}>
                      {pendingTodos.slice(0,6).map(function(t){
                        var sel=badDayTask===t.id;
                        return(
                          <button key={t.id} onClick={function(){setBadDayTask(t.id);}} style={{padding:"12px 16px",borderRadius:14,border:"2px solid "+(sel?"#818CF8":"rgba(255,255,255,0.1)"),background:sel?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.05)",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
                            <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(sel?"#818CF8":"rgba(255,255,255,0.2)"),background:sel?"#6366F1":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {sel&&<span style={{color:"white",fontSize:10,fontWeight:800}}>✓</span>}
                            </div>
                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:sel?"#C7D2FE":"rgba(255,255,255,0.7)",fontWeight:sel?700:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ):(
                    <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.05)",textAlign:"center"}}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,0.4)"}}>Aucune tâche en attente 🎉</p>
                    </div>
                  )}
                  {/* Durée */}
                  <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"center"}}>
                    {DURATIONS.map(function(d){
                      var sel=badDayTotal===d[0]*60;
                      return(
                        <button key={d[0]} onClick={function(){setBadDayTotal(d[0]*60);setBadDayTimer(0);}} style={{padding:"8px 16px",borderRadius:20,border:"2px solid "+(sel?"#818CF8":"rgba(255,255,255,0.1)"),background:sel?"rgba(99,102,241,0.25)":"transparent",color:sel?"#C7D2FE":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:sel?700:400,cursor:"pointer"}}>
                          {d[1]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timer */}
              <div style={{textAlign:"center"}}>
                {/* Cercle de progression */}
                <div style={{position:"relative",width:180,height:180,margin:"0 auto"}}>
                  <svg width={180} height={180} style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
                    <circle cx={90} cy={90} r={80} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}/>
                    <circle cx={90} cy={90} r={80} fill="none" stroke={isDone?"#34D399":"#818CF8"} strokeWidth={6}
                      strokeDasharray={2*Math.PI*80}
                      strokeDashoffset={2*Math.PI*80*(1-pct/100)}
                      strokeLinecap="round"
                      style={{transition:"stroke-dashoffset 1s linear,stroke 0.5s"}}
                    />
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    {isDone?(
                      <div style={{textAlign:"center"}}>
                        <p style={{fontSize:40,marginBottom:4}}>🎉</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"#34D399",fontWeight:700}}>Bravo !</p>
                      </div>
                    ):(
                      <div>
                        <p style={{fontFamily:"monospace",fontSize:44,fontWeight:800,color:"#FFFFFF",lineHeight:1}}>{fmtTime(remaining)}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:4}}>{Math.round(badDayTotal/60)+" min"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tâche sélectionnée */}
                {badDayActive&&badDayTask&&(function(){
                  var t=todos.find(function(x){return x.id===badDayTask;});
                  return t?(
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:12,maxWidth:280,lineHeight:1.5,textAlign:"center"}}>{"🎯 "+t.text}</p>
                  ):null;
                })()}

                {/* Boutons */}
                <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"center"}}>
                  {!isDone?(
                    <button onClick={function(){setBadDayActive(function(a){return !a;});}} style={{padding:"13px 32px",borderRadius:30,border:"none",background:badDayActive?"rgba(239,68,68,0.8)":"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(99,102,241,0.4)"}}>
                      {badDayActive?"⏸ Pause":"▶ Démarrer"}
                    </button>
                  ):(
                    <button onClick={function(){
                      if(badDayTask){setTodos(function(p){return p.map(function(t){return t.id===badDayTask?Object.assign({},t,{done:true}):t;});});}
                      earnXp(Math.round(badDayTotal/60),"Mode mauvaise journée");
                      setBadDay(false);setBadDayActive(false);setBadDayTimer(0);
                    }} style={{padding:"13px 28px",borderRadius:30,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>
                      ✅ Terminer
                    </button>
                  )}
                  <button onClick={function(){setBadDayActive(false);setBadDayTimer(0);}} style={{padding:"13px 16px",borderRadius:30,border:"1.5px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:18,cursor:"pointer"}}>↺</button>
                </div>
              </div>

              {/* Message de soutien */}
              {!badDayActive&&!isDone&&(
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.25)",textAlign:"center",lineHeight:1.7,maxWidth:300}}>
                  {"C'est correct d'avancer lentement. Une minute de travail vaut mieux que zéro."}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── MODAL SYNC ── */}
      {syncOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#FFFFFF",borderRadius:20,padding:24,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>☁️</span>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:17,fontWeight:800,color:"#1E3A8A"}}>Synchronisation</p>
              </div>
              <button onClick={function(){setSyncOpen(false);setSyncStatus("");setSyncInput("");}} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#F0F0F0",fontSize:16,cursor:"pointer"}}>×</button>
            </div>

            {/* Ton code */}
            <div style={{padding:"14px 16px",borderRadius:14,background:"#F0F9FF",border:"1.5px solid #BAE6FD",marginBottom:16}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#0369A1",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>💾 Sauvegarder mes données</p>
              {syncCode?(
                <div style={{textAlign:"center",marginBottom:10}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#6B7280",marginBottom:6}}>Ton code de synchronisation :</p>
                  <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:8}}>
                    {syncCode.split("").map(function(c,i){
                      return <div key={i} style={{width:36,height:44,borderRadius:10,background:"#1E40AF",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"monospace",fontSize:22,fontWeight:800,color:"white"}}>{c}</span></div>;
                    })}
                  </div>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF"}}>Note ce code — il te permettra de retrouver tes données sur n'importe quel appareil.</p>
                </div>
              ):(
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#6B7280",marginBottom:10,lineHeight:1.5}}>Un code à 6 caractères sera généré et tes données sauvegardées dans le cloud.</p>
              )}
              <button onClick={syncSave} disabled={syncLoading} style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:syncLoading?"#E5E7EB":"#1E40AF",color:"white",fontSize:13,fontWeight:700,cursor:syncLoading?"default":"pointer"}}>
                {syncLoading?"Sauvegarde...":(syncCode?"🔄 Mettre à jour":"💾 Sauvegarder maintenant")}
              </button>
              {syncStatus==="saved"&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#16A34A",textAlign:"center",marginTop:8,fontWeight:600}}>✅ Sauvegarde réussie !</p>}
            </div>

            {/* Charger depuis un code */}
            <div style={{padding:"14px 16px",borderRadius:14,background:"#F5F3FF",border:"1.5px solid #DDD6FE"}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#6D28D9",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>📲 Charger depuis un autre appareil</p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#6B7280",marginBottom:10,lineHeight:1.5}}>Entre le code de synchronisation de ton autre appareil :</p>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input
                  value={syncInput}
                  onChange={function(e){setSyncInput(e.target.value.toUpperCase().slice(0,6));setSyncStatus("");}}
                  onKeyDown={function(e){if(e.key==="Enter")syncLoad();}}
                  placeholder="Ex: AB3K9Z"
                  maxLength={6}
                  style={{flex:1,border:"2px solid #DDD6FE",borderRadius:10,padding:"10px 12px",fontSize:16,fontFamily:"monospace",fontWeight:700,textAlign:"center",letterSpacing:4,outline:"none",background:"white",textTransform:"uppercase"}}
                />
                <button onClick={syncLoad} disabled={syncLoading||syncInput.length!==6} style={{padding:"10px 14px",borderRadius:10,border:"none",background:(syncLoading||syncInput.length!==6)?"#E5E7EB":"#7C3AED",color:"white",fontSize:13,fontWeight:700,cursor:(syncLoading||syncInput.length!==6)?"default":"pointer"}}>
                  {syncLoading?"...":"Charger"}
                </button>
              </div>
              {syncStatus==="loaded"&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#16A34A",fontWeight:600}}>✅ Données chargées avec succès !</p>}
              {syncStatus==="notfound"&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#EF4444",fontWeight:600}}>❌ Code introuvable. Vérifie et réessaie.</p>}
              {syncStatus==="invalid"&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#EF4444",fontWeight:600}}>❌ Le code doit contenir 6 caractères.</p>}
              {syncStatus==="error"&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#EF4444",fontWeight:600}}>❌ Erreur réseau. Vérifie ta connexion.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST "PAS AUJOURD'HUI" ── */}
      {postponeToast&&(
        <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"linear-gradient(135deg,#1E1B4B,#3730A3)",color:"white",borderRadius:16,padding:"12px 20px",boxShadow:"0 8px 32px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",gap:10,maxWidth:280,animation:"fadeInUp 0.3s ease"}}>
          <span style={{fontSize:22}}>🌙</span>
          <div>
            <p style={{fontSize:12,fontWeight:800,marginBottom:2}}>Pas aujourd'hui — et c'est correct.</p>
            <p style={{fontSize:10,opacity:0.8,lineHeight:1.4}}>{"«\u00a0"+postponeToast+(postponeToast.length>=30?"…":"")+" \u00a0» sera là demain."}</p>
          </div>
        </div>
      )}

      {/* ── MODAL HORAIRE DU JOUR ── */}
      {dayViewDate&&(function(){
        var dvEvts=byDate(dayViewDate).sort(function(a,b){return (a.time||"")>(b.time||"")?1:-1;});
        var dvLabel=new Date(dayViewDate+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
        var dvBlocks=jourBlocks[dayViewDate]||{};
        var CATS_DV={travail:{label:"Travail",color:"#3B82F6",bg:"#EFF6FF"},sante:{label:"Santé",color:"#10B981",bg:"#ECFDF5"},social:{label:"Social",color:"#F59E0B",bg:"#FFFBEB"},perso:{label:"Perso",color:"#8B5CF6",bg:"#F5F3FF"},autre:{label:"Autre",color:"#6B7280",bg:"#F9FAFB"}};
        return(
          <div style={{position:"fixed",inset:0,zIndex:950,background:"rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={function(){setDayViewDate(null);}}>
            <div style={{background:"white",borderRadius:"20px 20px 0 0",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",animation:"pop 0.25s ease"}} onClick={function(e){e.stopPropagation();}}>
              {/* Handle + header */}
              <div style={{padding:"12px 20px 10px",borderBottom:"1px solid #F0F0F8",flexShrink:0}}>
                <div style={{width:36,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 12px"}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:900,color:"#1F2937",textTransform:"capitalize"}}>{dvLabel}</p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9CA3AF",marginTop:2}}>{dvEvts.length===0?"Aucun rendez-vous":dvEvts.length+" rendez-vous"}</p>
                  </div>
                  <button onClick={function(){setDayViewDate(null);}} style={{border:"none",background:"#F3F4F6",borderRadius:"50%",width:32,height:32,fontSize:16,cursor:"pointer",color:"#6B7280",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              </div>
              {/* Horaire scrollable */}
              <div style={{flex:1,overflowY:"auto",padding:"10px 16px 24px"}}>
                {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(function(h){
                  var hKey=String(h);
                  var hStr=pad(h)+":";
                  var hEvts=dvEvts.filter(function(ev){return ev.time&&ev.time.startsWith(hStr);});
                  var val=dvBlocks[hKey]||"";
                  var hasContent=hEvts.length>0||val;
                  var timeColor=h<12?"#3B82F6":h<18?"#8B5CF6":"#1E3A8A";
                  var isCurrentHour=dayViewDate===TODAY&&new Date().getHours()===h;
                  return(
                    <div key={h} style={{display:"flex",gap:12,minHeight:44,position:"relative"}}>
                      {/* Heure */}
                      <div style={{width:28,flexShrink:0,paddingTop:6,textAlign:"right"}}>
                        <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:isCurrentHour?"#EF4444":hasContent?timeColor:"#D1D5DB"}}>{h+"h"}</span>
                      </div>
                      {/* Ligne verticale */}
                      <div style={{width:2,background:isCurrentHour?"#EF4444":hasContent?timeColor+"55":"#F0F0F8",borderRadius:1,flexShrink:0,alignSelf:"stretch",minHeight:44}}/>
                      {/* Contenu */}
                      <div style={{flex:1,paddingTop:4,paddingBottom:8,minWidth:0}}>
                        {hEvts.map(function(ev){
                          var cat=CATS_DV[ev.category||ev.category]||CATS_DV.autre;
                          return(
                            <div key={ev.id} onClick={function(){setEditEvtId(ev.id);setDayViewDate(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:ev.done?"#F8F8F8":cat.bg,border:"1.5px solid "+(ev.done?"#E5E7EB":cat.color+"33"),cursor:"pointer",marginBottom:4,transition:"all 0.15s"}}>
                              <div style={{width:3,borderRadius:2,alignSelf:"stretch",background:ev.done?"#D1D5DB":cat.color,flexShrink:0,minHeight:20}}/>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:ev.done?"#9CA3AF":"#1F2937",fontWeight:600,textDecoration:ev.done?"line-through":"none"}}>{ev.title}</p>
                                {ev.time&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:cat.color,marginTop:1,fontWeight:600}}>{ev.time}</p>}
                                {ev.note&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",marginTop:1}}>📝 {ev.note}</p>}
                              </div>
                              <span style={{fontSize:10,color:"#D1D5DB"}}>›</span>
                            </div>
                          );
                        })}
                        {val&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:timeColor,fontWeight:500,padding:"4px 0"}}>{val}</p>}
                        {!hasContent&&<div style={{height:1,background:"#F5F5F8",borderRadius:1,marginTop:8}}/>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Bouton ouvrir l'agenda */}
              <div style={{padding:"12px 16px",borderTop:"1px solid #F0F0F8",flexShrink:0}}>
                <button onClick={function(){setSelDate(dayViewDate);setTab("agenda");setDayViewDate(null);}} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:"#4F46E5",color:"white",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  Ouvrir dans l'agenda →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL ÉDITION RDV ── */}
      {editEvtId&&(function(){
        var ev=events.find(function(e){return e.id===editEvtId;});
        if(!ev)return null;
        var CATS_E={travail:{label:"Travail",color:"#3B82F6"},sante:{label:"Santé",color:"#10B981"},social:{label:"Social",color:"#F59E0B"},perso:{label:"Perso",color:"#8B5CF6"},autre:{label:"Autre",color:"#6B7280"}};
        var update=function(patch){setEvents(function(p){return p.map(function(e){return e.id===editEvtId?Object.assign({},e,patch):e;});});};
        return(
          <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(){setEditEvtId(null);}}>
            <div style={{width:"100%",maxWidth:480,borderRadius:"20px 20px 0 0",background:"white",padding:"20px 20px 32px",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",animation:"pop 0.2s ease"}} onClick={function(e){e.stopPropagation();}}>
              {/* Drag handle */}
              <div style={{width:36,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 16px"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:900,color:"#1F2937"}}>Modifier le rendez-vous</p>
                <button onClick={function(){setEditEvtId(null);}} style={{border:"none",background:"none",color:"#9CA3AF",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
              </div>
              {/* Titre */}
              <div style={{marginBottom:12}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Titre</p>
                <input value={ev.title||""} onChange={function(e){update({title:e.target.value});}} style={{width:"100%",border:"1.5px solid #E8EDF5",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:"'Inter',sans-serif",color:"#1F2937",fontWeight:600}}/>
              </div>
              {/* Heure */}
              <div style={{marginBottom:12}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Heure</p>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="time" value={ev.time||""} onChange={function(e){update({time:e.target.value});}} style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:9,padding:"7px 10px",fontSize:13,color:"#1F2937"}}/>
                  <span style={{fontSize:11,color:"#D1D5DB",flexShrink:0}}>→</span>
                  <input type="time" value={ev.endTime||""} onChange={function(e){update({endTime:e.target.value});}} style={{flex:1,border:"1.5px solid #E8EDF5",borderRadius:9,padding:"7px 10px",fontSize:13,color:"#1F2937"}}/>
                </div>
              </div>
              {/* Catégorie */}
              <div style={{marginBottom:12}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Catégorie</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.entries(CATS_E).map(function(entry){
                    var key=entry[0];var cat=entry[1];
                    var sel=(ev.category||ev.category||"autre")===key;
                    return(
                      <button key={key} onClick={function(){update({category:key,cat:key});}} style={{padding:"4px 12px",borderRadius:20,border:"1.5px solid "+(sel?cat.color:"#E8EDF5"),background:sel?cat.color+"18":"transparent",fontFamily:"'Inter',sans-serif",fontSize:11,color:sel?cat.color:"#9CA3AF",fontWeight:sel?700:400,cursor:"pointer"}}>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Note */}
              <div style={{marginBottom:16}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Note</p>
                <textarea value={ev.note||""} onChange={function(e){update({note:e.target.value});}} placeholder="Ajoute une note, une adresse, un lien..." rows={3} style={{width:"100%",border:"1.5px solid #E8EDF5",borderRadius:9,padding:"8px 12px",fontSize:12,fontFamily:"'Inter',sans-serif",resize:"none",color:"#374151",lineHeight:1.6}}/>
              </div>
              {/* Accompli + Fermer */}
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){update({done:!ev.done});}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(ev.done?"#86EFAC":"#E8EDF5"),background:ev.done?"#F0FDF4":"transparent",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:ev.done?"#15803D":"#6B7280",cursor:"pointer"}}>
                  {ev.done?"✓ Accompli":"Marquer accompli"}
                </button>
                <button onClick={function(){setEvents(function(p){return p.filter(function(e){return e.id!==editEvtId;});});setEditEvtId(null);}} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #FCA5A5",background:"#FEF2F2",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#DC2626",cursor:"pointer"}}>
                  🗑
                </button>
                <button onClick={function(){setEditEvtId(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:"#4F46E5",color:"white",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CHECK-IN ÉNERGIE ── */}
      {showCheckin&&(
        <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(15,14,26,0.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(4px)"}}>
          <div style={{width:"100%",maxWidth:320,borderRadius:24,background:"linear-gradient(160deg,#1E1B4B,#312E81)",padding:"32px 24px",boxShadow:"0 24px 64px rgba(0,0,0,0.4)",animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:"white",marginBottom:6}}>
                {checkinSlot==="matin"?"Comment tu commences la journée ?":checkinSlot==="apresmidi"?"Comment tu te sens en ce moment ?":"Comment s'est passée ta journée ?"}
              </p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
                {checkinSlot==="matin"?"Matin · Flowi adapte ton expérience.":checkinSlot==="apresmidi"?"Après-midi · On ajuste ensemble.":"Soir · Prends un moment pour toi."}
              </p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {level:5,emoji:"💥",label:"Au maximum"},
                {level:4,emoji:"🔥",label:"Bonne énergie"},
                {level:3,emoji:"🔋",label:"Moyen — ça ira"},
                {level:2,emoji:"⚡",label:"Un peu fatigué"},
                {level:1,emoji:"🪫",label:"Épuisé"},
              ].map(function(e){return(
                <button key={e.level} onClick={function(){
                  var key=TODAY+"-"+checkinSlot;
                  setEnergyLog(function(p){var o=Object.assign({},p);o[key]=e.level;o[TODAY]=e.level;return o;});
                  setShowCheckin(false);
                }} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 16px",borderRadius:14,border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.05)",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{e.emoji}</span>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:600}}>{e.label}</p>
                </button>
              );})}
            </div>
            <button onClick={function(){setShowCheckin(false);}} style={{width:"100%",marginTop:14,padding:"8px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",fontSize:11,cursor:"pointer"}}>Passer pour l'instant</button>
          </div>
        </div>
      )}

      {scanOpen && (
        <ScanModal
          closeScan={function(){setScanOpen(false);}}
          scanTarget={scanTarget}
          scanPhase={scanPhase}
          scanImg={scanImg}
          scanErr={scanErr}
          scanResults={scanResults}
          scanSel={scanSel}
          setScanSel={setScanSel}
          setScanImg={setScanImg}
          setScanPhase={setScanPhase}
          analyzePhoto={analyzePhoto}
          importScan={importScan}
          photoRef={photoRef}
          galleryRef={galleryRef}
          loadPhoto={loadPhoto}
        />
      )}

      <div style={{width:navW,flexShrink:0,display:"flex",flexDirection:"column",alignSelf:"stretch",background:"#FFFFFF",borderRight:"1px solid #E5E7EB",paddingTop:12,paddingBottom:16,zIndex:30,gap:1,transition:"width 0.2s"}}>
        {/* Logo */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:"1px solid #F0F0F0"}}>
          <div style={{marginBottom:3}}>
            <LotusIcon size={40} col="#7C3AED"/>
          </div>
          <span style={{fontSize:11,fontWeight:800,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:0.5}}>Flowi</span>
        </div>
        {NAV_GROUPS.map(function(g){
          var active=groupOfTab(tab).id===g.id;
          var p=PM[g.tabs[0].id]||PM.agenda;
          return (
            <button key={g.id} onClick={function(){setTab(g.tabs[0].id);}} title={g.label} style={{margin:"0 4px",padding:isPhone?"5px 2px":"7px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:active?p.light:"transparent",borderRadius:10,border:"none",cursor:"pointer",outline:"none",transition:"all 0.15s",position:"relative"}}>
              {active&&<div style={{position:"absolute",left:-4,top:"50%",transform:"translateY(-50%)",width:3,height:18,background:p.accent,borderRadius:"0 3px 3px 0"}}/>}
              <span style={{fontSize:active?tabIconSize:tabIconSize-3,lineHeight:1,transition:"font-size 0.15s"}}>{g.icon}</span>
              <span style={{fontSize:tabFontSize,fontWeight:active?700:400,color:active?p.accent:"#9CA3AF",letterSpacing:0.1,lineHeight:1.2,maxWidth:navW-10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center",transition:"color 0.15s"}}>{g.label}</span>
            </button>
          );
        })}
        {/* Dark mode + Sync + Bad day toggles */}
        <div style={{flex:1}}/>
        <button onClick={function(){setBadDay(true);setBadDayTimer(0);setBadDayActive(false);}} title="Mode mauvaise journée" style={{margin:"0 4px",padding:"6px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"transparent",borderRadius:10,border:"none",cursor:"pointer",outline:"none"}}>
          <span style={{fontSize:tabIconSize-2,lineHeight:1}}>🌿</span>
          <span style={{fontSize:tabFontSize,color:"#9CA3AF",letterSpacing:0.1,lineHeight:1.2,textAlign:"center"}}>Priorité</span>
        </button>
        <button onClick={function(){setSyncOpen(true);}} title="Synchronisation" style={{margin:"0 4px",padding:"6px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:syncCode?"#EFF6FF":"transparent",borderRadius:10,border:"none",cursor:"pointer",outline:"none"}}>
          <span style={{fontSize:tabIconSize-2,lineHeight:1}}>☁️</span>
          <span style={{fontSize:tabFontSize,color:syncCode?"#3B82F6":"#9CA3AF",letterSpacing:0.1,lineHeight:1.2,textAlign:"center",fontWeight:syncCode?700:400}}>Sync</span>
        </button>
        <button onClick={function(){setDarkMode(function(d){return !d;});}} title={darkMode?"Mode clair":"Mode sombre"} style={{margin:"0 4px",padding:"6px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"transparent",borderRadius:10,border:"none",cursor:"pointer",outline:"none"}}>
          <span style={{fontSize:tabIconSize-2,lineHeight:1}}>{darkMode?"☀️":"🌙"}</span>
          <span style={{fontSize:tabFontSize,color:"#9CA3AF",letterSpacing:0.1,lineHeight:1.2,textAlign:"center"}}>{darkMode?"Clair":"Sombre"}</span>
        </button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",background:"#FFFFFF",position:"relative",zIndex:10,overflow:"hidden"}}>
        {/* ── SOUS-NAVIGATION ── */}
        {(function(){
          var grp=groupOfTab(tab);
          if(!grp||grp.tabs.length<=1)return null;
          var p=PM[tab]||PM.agenda;
          return(
            <div style={{display:"flex",gap:4,padding:"8px 12px 0",background:"#FFFFFF",borderBottom:"1px solid #F0F2F5",flexShrink:0,overflowX:"auto"}}>
              {grp.tabs.map(function(s){
                var isActive=tab===s.id;
                var sp=PM[s.id]||PM.agenda;
                return(
                  <button key={s.id} onClick={function(){setTab(s.id);}} style={{padding:"5px 14px",borderRadius:"8px 8px 0 0",border:"none",background:isActive?sp.light:"transparent",color:isActive?sp.accent:"#9CA3AF",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:isActive?700:500,cursor:"pointer",whiteSpace:"nowrap",borderBottom:isActive?"2px solid "+sp.accent:"2px solid transparent",transition:"all 0.15s"}}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          );
        })()}
        <div className="pop" key={tab} ref={mainScrollRef} onScroll={function(e){scrollPositions.current[tab]=e.target.scrollTop;}} style={{flex:1,overflowY:"auto",overflowX:"hidden",position:"relative",background:"#FFFFFF"}}>
          {renderSection()}
          {(function(){
            var content=renderRight();
            if(!content)return null;
            return(
              <div style={{borderTop:"2px solid #F0F0F0",marginTop:8,background:"#F9FAFB"}}>
                {content}
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
