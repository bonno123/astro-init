import morphBackground from "~/utils/morphBackground";

export default class Collapse {
    element: HTMLElement;
    triggers: NodeListOf<Element> | null = null;
    shouldAnimate= false;
    isAnimating = false;

    private isItemExpandedAtLeastOnce = false;
   
    constructor(element: HTMLElement) {
        this.element! = element;
        this.triggers = document.querySelectorAll('[aria-controls="' + this.element.getAttribute('id') + '"]');
        this.shouldAnimate = this.element.getAttribute('data-collapse-animate') == 'on';
        this.isAnimating = false;
        this.initCollapse();
    }

    initCollapse() {
        if ( this.triggers ) {
            // set initial 'aria-expanded' attribute for trigger elements
            this.updateTriggers(!this.element?.classList.contains('hide'));

            // detect click on trigger elements
            for(var i = 0; i < this.triggers.length; i++) {
                this.triggers[i].addEventListener('click', (event: Event) => {
                    event.preventDefault();
                    this.toggleVisibility();
                });
            }
        }

        // custom event
        this.element?.addEventListener('collapseToggle', (event: Event) =>{
            this.toggleVisibility();
        });
    }

    toggleVisibility() {
        var isContainerCollapsed = this.element?.classList.contains('hide');
        if(this.isAnimating) return;
        this.isAnimating = true;
        this.animateElement(isContainerCollapsed);
        this.updateTriggers(isContainerCollapsed);

        if (!this.isItemExpandedAtLeastOnce){
            morphBackground()
            this.isItemExpandedAtLeastOnce = true
        }
    }

    animateElement(shouldShowContent: boolean) {
        // shouldShowContent === true -> show content
        if(!this.shouldAnimate || !window.requestAnimationFrame) {
            this.element?.classList.toggle('hide', !shouldShowContent);
            this.isAnimating = false;
            return;
        }

        // animate content height
        this.element?.classList.remove('hide');
        var initHeight = !shouldShowContent ? this.element.offsetHeight: 0,
        finalHeight = !shouldShowContent ? 0 : this.element.offsetHeight;

        this.element.classList.add('overflow-hidden');

        this.setHeight(
            initHeight, 
            finalHeight,  
            200, 
            () =>{
                if(!shouldShowContent) this.element.classList.add('hide');

                this.element.removeAttribute("style");
                this.element.classList.remove('overflow-hidden');
                this.isAnimating = false;
            }, 
            'easeInOutQuad'
        );


    }

    updateTriggers( isCollapsed: boolean) {
        if(!this.triggers) return;
        for(var i = 0; i < this.triggers.length; i++) {
            this.triggers[i].setAttribute('aria-expanded', !isCollapsed ? 'true' : 'false');
        }
    }

    setHeight(start: number, end: number, duration: number, callback: Function, easing: 'easeInOutQuad') {
        var change = end - start,
        currentTime: number | null = null;
  
        var animateHeight = (timestamp: number) =>{
            if (!currentTime) currentTime = timestamp; 
        
            var progress = timestamp - currentTime;

            if(progress > duration) progress = duration;

            var val = (progress/duration)*change + start;

            if(typeof val === 'string') val = parseInt(val);   // TODO: check if this is necessary

            // if(easing && easing in Math && typeof Math[easing] === 'function') {
            //     console.log('easing', easing, Math[easing]);
            //     val = Math[easing](progress, start, end - start, duration);
            // }

            this.element.style.height = val+"px";
            if(progress < duration) {
                window.requestAnimationFrame(animateHeight);
            } else {
                if(callback) callback();
            }
        };
  
        //set the height of the element before starting animation -> fix bug on Safari
        this.element.style.height = start+"px";
        window.requestAnimationFrame(animateHeight);
    }
}