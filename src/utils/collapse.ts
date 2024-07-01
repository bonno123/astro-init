type AnimationCallback = () => void;

export default class Collapse {
    element: HTMLElement;
    areaControllers: NodeListOf<Element> | null = null;

    shouldAnimate = false;
    isAnimationInProgress = false;

    // Add callback properties
    private onExpandedCallback?: () => void;
    private onCollapsedCallback?: () => void;
   
    constructor(element: HTMLElement) {
        this.element! = element;
        this.areaControllers = document.querySelectorAll('[aria-controls="' + this.element.getAttribute('id') + '"]');

        this.shouldAnimate = this.element.getAttribute('data-collapse-animate') == 'on';

        // set initial 'aria-expanded' attribute for trigger elements
        this.updateAreaControllers();

        this.initCollapse();
    }

    isAreaExpanded() {
        return !this.element?.classList.contains('hide');
    }

    updateAreaControllers() {
        const isExpanded = this.isAreaExpanded();

        // set 'aria-expanded' attribute for trigger elements
        for(var i = 0; i < (this.areaControllers?.length ?? 1); i++) {
            this.areaControllers?.[i].setAttribute(
                'aria-expanded', 
                String(isExpanded)
            );
        }
    }

    // Add methods to set callbacks
    setOnExpanded(callback: () => void) {
        this.onExpandedCallback = callback;
    }

    setOnCollapsed(callback: () => void) {
        this.onCollapsedCallback = callback;
    }

    initCollapse() {
        if ( !this.areaControllers ) {
            return;
        }

        // detect click on trigger elements
        for(var i = 0; i < this.areaControllers.length; i++) {
            this.areaControllers[i].addEventListener('click', 
                (event: Event) => {
                    event.preventDefault();
                    this.toggleVisibility();
            });
        }

        // custom event
        // this.element?.addEventListener('collapseToggle', (event: Event) =>{
        //     this.toggleVisibility();
        // });
    }

    toggleVisibility() {
        const action = this.prepareAnimation();
        if(!action) return;

        this.initiateAnimateHeight(
            action,
            200,
            () => {
                this.updateAreaControllers();
                if(action === 'expand') {
                    this.onExpandedCallback?.();
                } else {
                    this.onCollapsedCallback?.();
                }
            }
        )
    }

    prepareAnimation(){
        if(this.isAnimationInProgress) return;
        this.isAnimationInProgress = true;

        let shouldExpandContent = !this.isAreaExpanded();

        // shouldShowContent === true -> show content
        if(!this.shouldAnimate || !window.requestAnimationFrame) {
            this.element?.classList.toggle('hide', shouldExpandContent);
            this.isAnimationInProgress = false;
            return;
        }

        // prepare for expansion
        this.element?.classList.remove('hide');
        this.element.classList.add('overflow-hidden');

        return shouldExpandContent ? 'expand' : 'collapse';
    }

    initiateAnimateHeight( 
        action: 'expand' | 'collapse',
        duration: number, 
        callback?: AnimationCallback, 
        // easing?: 'easeInOutQuad'
    ) {
        let startTime: number | null = null;

        const isExpanding = action === 'expand';    // Determine initial and final heights based on the action

        // For expanding, initial height should be 0 and final height should be the element's offsetHeight
        // For collapsing, initial height should be the element's offsetHeight and final height should be 0
        const initialHeight = isExpanding ? 0 : this.element.offsetHeight;
        const finalHeight = isExpanding ? this.element.offsetHeight : 0;

        const heightDifference = finalHeight - initialHeight;

        // Prepare the element for animation -> fix bug on Safari
        this.element.style.height = `${initialHeight}px`;

        const performAnimation = (currentTime: number) => {
            if (!startTime) startTime = currentTime; 
        
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1); // Ensure progress doesn't exceed 1
            const currentHeight = initialHeight + progress * heightDifference;

            this.element.style.height = `${currentHeight}px`;

            if(elapsedTime < duration) {
                window.requestAnimationFrame(performAnimation);
            } else {
                // Animation is complete -> clean up
                if(action === 'collapse') this.element.classList.add('hide');

                this.element.classList.remove('overflow-hidden');
                this.element.removeAttribute("style");

                this.isAnimationInProgress = false;
                callback?.();
            }
        };

        window.requestAnimationFrame(performAnimation);
    }
}