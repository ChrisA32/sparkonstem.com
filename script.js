const counters=document.querySelectorAll("[data-count]");

counters.forEach(counter=>{

const target=Number(counter.dataset.count);

let current=0;

const update=()=>{

current++;

counter.textContent=current;

if(current<target){
requestAnimationFrame(update);
}

};

update();

});
