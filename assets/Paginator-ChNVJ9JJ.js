import{u as l,b as o}from"./Hero-DNEnZt7q.js";import{b as d,a as u,j as e}from"./chunk-JZWAC4HX-CrGT90sy.js";
/* Lapozo: elozo gomb | oldalszamok (az aktualis felkover, alahuzott) | kovetkezo gomb.
   A stilus az a11y-fixes.css-ben (.ms-pager). Az oldalszamok valodi linkek (href), a kattintas ugyanoda navigal. */
const LABEL={hu:"Lapozás",en:"Pagination",de:"Seitennavigation",fr:"Pagination",es:"Paginación",it:"Paginazione",zh:"分页"};
const chevron=(dir)=>e.jsx("svg",{viewBox:"0 0 24 24",width:24,height:24,"aria-hidden":"true",focusable:"false",children:e.jsx("path",{d:dir==="left"?"M14.5 6.5L9 12l5.5 5.5":"M9.5 6.5L15 12l-5.5 5.5",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round"})});
const pagesOf=(cur,total)=>{if(!(total>=cur)){const last=cur+1,st=Math.max(1,last-6);return Array.from({length:last-st+1},(_,i)=>st+i)}if(total<=7)return Array.from({length:total},(_,i)=>i+1);const s=new Set([1,total,cur-1,cur,cur+1]);if(cur<=3)[2,3,4].forEach(x=>s.add(x));if(cur>=total-2)[total-3,total-2,total-1].forEach(x=>s.add(x));const a=[...s].filter(x=>x>=1&&x<=total).sort((x,y)=>x-y);const out=[];a.forEach((x,i)=>{if(i&&x-a[i-1]>1)out.push("…");out.push(x)});return out};
const b=({pager:a,param:n="oldal"})=>{const t=l(o),s=d(),i=u();
const hrefFor=(p)=>{const q=new URLSearchParams(s.search);p<=1?q.delete(n):q.set(n,String(p));const qs=q.toString();return qs?`${s.pathname}?${qs}`:s.pathname};
const lang=(typeof document<"u"&&document.documentElement.getAttribute("lang")||"hu").toLowerCase().split("-")[0];
const go=(p)=>(ev)=>{ev.preventDefault();i(hrefFor(p))};
const urlPage=parseInt(new URLSearchParams(s.search).get(n),10),cur=urlPage>0?urlPage:a.current_page,total=a.total_pages,known=total>=cur&&total>0;
const btn=(dir,disabled,target,label)=>disabled
 ?e.jsx("span",{className:"ms-pager-btn is-disabled","aria-disabled":"true","aria-label":label,role:"link",children:chevron(dir)})
 :e.jsx("a",{className:"ms-pager-btn",href:hrefFor(target),"aria-label":label,onClick:go(target),children:chevron(dir)});
return e.jsxs("nav",{className:"ms-pager","aria-label":LABEL[lang]||LABEL.hu,children:[
 btn("left",cur===1,cur-1,t.prev.value),
 e.jsx("ol",{className:"ms-pager-list",children:pagesOf(cur,total).map((p,idx)=>e.jsx("li",{children:p==="…"?e.jsx("span",{className:"ms-pager-gap","aria-hidden":"true",children:"…"}):e.jsx("a",{className:"ms-pager-num"+(p===cur?" is-current":""),href:hrefFor(p),"aria-current":p===cur?"page":void 0,"aria-label":`${p}`,onClick:go(p),children:p})},idx))}),
 btn("right",known&&cur===total,cur+1,t.next.value)]})};
export{b as P};
