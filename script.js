const countDuration=3500;
let counterObserver;
let revealObserver;
let revealItems=[];
let isPageTransitioning=false;

const animateCounter=counter=>{
const target=Number(counter.dataset.count);
const suffix=counter.dataset.suffix||"";
const start=performance.now();

const update=now=>{
const progress=Math.min((now-start)/countDuration,1);
const eased=1-Math.pow(1-progress,3);
counter.textContent=Math.floor(target*eased)+suffix;
if(progress<1) requestAnimationFrame(update);
};

requestAnimationFrame(update);
};

const revealItem=item=>{
item.classList.add("is-visible");
if(revealObserver) revealObserver.unobserve(item);
};

const revealVisibleItems=()=>{
const viewportHeight=window.innerHeight||document.documentElement.clientHeight;
const triggerLine=viewportHeight*.76;
const atPageBottom=window.scrollY+viewportHeight>=document.documentElement.scrollHeight-24;
revealItems.forEach(item=>{
if(item.classList.contains("is-visible")) return;
const rect=item.getBoundingClientRect();
if((rect.top<triggerLine&&rect.bottom>0)||atPageBottom) revealItem(item);
});
};

const initCounters=()=>{
if(counterObserver) counterObserver.disconnect();

counterObserver=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(!entry.isIntersecting) return;
entry.target.querySelectorAll("[data-count]").forEach(animateCounter);
counterObserver.unobserve(entry.target);
});
},{threshold:.35});

const stats=document.querySelector(".stats");
if(stats) counterObserver.observe(stats);
};

const initReveals=()=>{
if(revealObserver) revealObserver.disconnect();

const revealSelectors=[
"main > section",
".hero-content > *",
".home-intro > *",
".page-card",
".stats > div",
".page-hero > *",
".grid-section > *",
".kit-feature > *",
".video-feature > *",
".instructions-intro",
".instruction-step",
".support-section > *",
".contact-section form",
".contact-section form > *"
];

revealItems=[...new Set(document.querySelectorAll(revealSelectors.join(",")))];

revealObserver=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(!entry.isIntersecting) return;
revealItem(entry.target);
});
},{threshold:.08,rootMargin:"0px 0px -22% 0px"});

revealItems.forEach(item=>{
const parent=item.parentElement;
const siblingIndex=parent?[...parent.children].indexOf(item):0;
const staggerGroup=item.closest(".page-cards,.stats,.instruction-steps,form");
const delay=staggerGroup?Math.min(siblingIndex,5)*140:0;
item.classList.add("reveal");
if(item.matches("main > section")) item.classList.add("reveal-section");
else if(item.matches(".page-card,.stats > div,.instruction-step")) item.classList.add("reveal-pop");
else item.classList.add("reveal-child");
item.style.setProperty("--reveal-delay",`${delay}ms`);
revealObserver.observe(item);
});

setTimeout(revealVisibleItems,120);
setTimeout(revealVisibleItems,500);
};

const initMenu=()=>{
const menuButton=document.querySelector("#menuBtn");
const navigation=document.querySelector("#navMenu");

if(menuButton&&navigation){
menuButton.addEventListener("click",()=>{
navigation.classList.toggle("open");
});
}
};

const initContactForm=()=>{
const contactForm=document.querySelector(".page-contact form");

if(contactForm){
contactForm.addEventListener("submit",event=>{
event.preventDefault();
const formData=new FormData(contactForm);
const name=String(formData.get("name")||"").trim();
const email=String(formData.get("email")||"").trim();
const message=String(formData.get("message")||"").trim();
const subject=encodeURIComponent("SparkOn STEM Inquiry");
const body=encodeURIComponent(`Name: ${name||"Not provided"}
Email: ${email||"Not provided"}

Message:
${message||"Not provided"}`);

window.location.href=`mailto:contact@sparkonstem.com?subject=${subject}&body=${body}`;
});
}
};

const initPage=()=>{
initCounters();
initReveals();
initMenu();
initContactForm();
};

const getTransitionFlag=()=>{
try{return sessionStorage.getItem("sparkonPageTransition");}
catch{return null;}
};

const setTransitionFlag=()=>{
try{sessionStorage.setItem("sparkonPageTransition","1");}
catch{}
};

const clearTransitionFlag=()=>{
try{sessionStorage.removeItem("sparkonPageTransition");}
catch{}
};

const clearTransitionClasses=()=>{
document.documentElement.classList.remove("transition-preload","transition-ready","transition-covering","transition-revealing");
document.documentElement.style.background="";
};

const revealIncomingPage=()=>{
if(getTransitionFlag()==="1"){
clearTransitionFlag();
setTimeout(()=>{
document.documentElement.classList.add("transition-revealing");
setTimeout(clearTransitionClasses,950);
},260);
}
};

const fetchPageMarkup=async url=>{
try{
const response=await fetch(url.href,{cache:"no-store"});
if(response.ok) return await response.text();
}catch{}

return new Promise((resolve,reject)=>{
const frame=document.createElement("iframe");
frame.style.display="none";
frame.onload=()=>{
try{
const html=frame.contentDocument.documentElement.outerHTML;
frame.remove();
resolve(html);
}catch(error){
frame.remove();
reject(error);
}
};
frame.onerror=()=>{
frame.remove();
reject(new Error("Page preload failed"));
};
document.body.appendChild(frame);
frame.src=url.href;
});
};

const swapPage=async(destination,addHistory=true)=>{
const html=await fetchPageMarkup(destination);
const parser=new DOMParser();
const nextDocument=parser.parseFromString(html,"text/html");
const nextBody=nextDocument.body;

nextBody.querySelectorAll("script").forEach(script=>script.remove());
document.title=nextDocument.title||document.title;
document.body.innerHTML=nextBody.innerHTML;

if(addHistory) history.pushState({sparkonPage:true},"",destination.href);
window.scrollTo(0,0);
initPage();
};

const finishPageTransition=()=>{
document.documentElement.classList.add("transition-revealing");
setTimeout(()=>{
clearTransitionClasses();
isPageTransitioning=false;
},950);
};

const navigateWithTransition=async(destination,addHistory=true)=>{
if(isPageTransitioning) return;
isPageTransitioning=true;

document.documentElement.classList.add("transition-ready");
requestAnimationFrame(()=>document.documentElement.classList.add("transition-covering"));

setTimeout(async()=>{
try{
await swapPage(destination,addHistory);
finishPageTransition();
}catch{
setTransitionFlag();
window.location.href=destination.href;
}
},840);
};

document.addEventListener("click",event=>{
const link=event.target.closest('a[href$=".html"]');
if(!link) return;
if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
if(link.target&&link.target!=="_self") return;

const destination=new URL(link.getAttribute("href"),window.location.href);
if(destination.href===window.location.href) return;

event.preventDefault();
navigateWithTransition(destination,true);
});

window.addEventListener("popstate",()=>{
navigateWithTransition(new URL(window.location.href),false);
});

window.addEventListener("load",()=>{
initPage();
revealIncomingPage();
});

window.addEventListener("scroll",revealVisibleItems,{passive:true});
window.addEventListener("resize",revealVisibleItems);
setTimeout(revealVisibleItems,500);
