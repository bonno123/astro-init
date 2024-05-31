export default class MorphBackgroundClass {
    element: HTMLElement;
    wrapper: HTMLElement;
    elementId: string | null;
    targets: NodeListOf<Element>;
    bgTargets: Element[];
    action: string | null;
    targetIndex: number | false;
    defaultIndex: number | false;

    constructor(element: HTMLElement) {
        this.element = element;
        this.wrapper = this.element.closest('.js-morph-bg-wrapper') as HTMLElement;
        this.elementId = this.element.getAttribute('id');
        this.targets = document.querySelectorAll('[data-morph-bg="'+this.elementId+'"]');
        this.bgTargets = [];
        this.action = this.element.getAttribute('data-morph-bg-event');
        this.targetIndex = false;
        this.defaultIndex = false;

        if(!this.action) this.action = 'click';
        this.initMorphBg();
    }
    
    initMorphBg() {
        // update the element.bgTargets - array of the elements whose size will be used for the morphing transformation
        this.getBgTargets();
        // see if we need to set the element visible
        this.setInitialState();
        // add listeners
        if(this.action == 'click') {
            this.initClickEvent();
        } else {
            this.initHoverEvent();
        }
        // on window resize/fonts loaded - reset background element size
        window.addEventListener('update-morphbg', () => {
            this.morphBgResize();
        });
        window.addEventListener('hide-morphbg', () => {
            this.morphBgHide();
        });
    }
    
    getBgTargets() {
        for(var i = 0; i < this.targets.length; i++) {
            var bgTarget = this.targets[i].querySelector('[data-morph-bg-target]') || this.targets[i];
            this.bgTargets.push(bgTarget);            
        }
    }
    
    setInitialState() {
        for(var i = 0; i < this.targets.length; i++) {
            if(this.targets[i].hasAttribute('data-morph-bg-active')) {

                this.setPosition(i);
                this.defaultIndex = i;
                break;
            }
        }
    }
    
    initClickEvent() {
        for(let i = 0; i < this.targets.length; i++) {           
            this.targets[i].addEventListener('click', (event) => {
                this.setPosition(i);
            })
        }
    }
    
    initHoverEvent() {
        for(let i = 0; i < this.targets.length; i++) {
            this.targets[i].addEventListener('mouseenter', (event) => {
                this.setPosition(i);
            })

            this.element.addEventListener('mouseleave', (event) => {
                this.resetBgPosition(event);
            })
        }

        // if there's [data-morph-bg-preserve] element - detect mouseleave
        var preserveElement = this.element.querySelector('[data-morph-bg-preserve]') as HTMLElement;
        if(preserveElement) {
            preserveElement.addEventListener('mouseleave', (event) => {
                this.resetBgPosition(event);
            })
        }

    }
    
    setPosition(index: number) {      
        // get size + position target
        var targetInfo = this.bgTargets[index].getBoundingClientRect();
        var targetRadius = getComputedStyle(this.bgTargets[index]).borderRadius;

        // get the wrapper parent info
        var wrapperInfo = this.wrapper.getBoundingClientRect();

        // modify element position and size
        this.element.style.width = targetInfo.width + 'px';
        this.element.style.height = targetInfo.height + 'px';
        this.element.style.transform = 'translateX('+(targetInfo.left - wrapperInfo.left)+'px) translateY('+(targetInfo.top - wrapperInfo.top)+'px) translateZ(-0.1px)';

        // modify element radius
        this.element.style.borderRadius = targetRadius;

        // show item
        this.element.classList.add('morph-bg--visible');

        setTimeout(() =>{
            if(!this.element.classList.contains('morph-bg--has-transition')) {
                this.element.classList.add('morph-bg--has-transition');
        }},10);

        // update targetIndex
        this.targetIndex = index;

     
    }

    resetBgPosition(event: MouseEvent) {
        if(
            (event.relatedTarget as Element)?.closest('[data-morph-bg="' + this.elementId + '"]') 
            || (event.relatedTarget as Element)?.closest('[data-morph-bg-preserve]')
        ) {
            // mouse is inside another target
            return; 
        }

        // check if there was a default index
        if(this.defaultIndex !== false) {
            this.targetIndex = this.defaultIndex;            
            this.setPosition(this.targetIndex);

            return;
        }

        this.element.classList.remove('morph-bg--visible', 'morph-bg--has-transition');

        // reset target index
        this.targetIndex = false;
    }

    morphBgResize() {
        if(this.targetIndex === false) return;
        this.setPosition(this.targetIndex);

        this.element.style.display = '';
    }

    morphBgHide() {
        this.element.style.display = 'none';
    }

    //initialize the MorphBg objects
    // static init() {
    //     var morphBg = document.getElementsByClassName('js-morph-bg');
    //     for(var i = 0; i < morphBg.length; i++) {
    //         new MorphBackgroundClass(morphBg[i] as HTMLElement);
    //     }
    // }


}
