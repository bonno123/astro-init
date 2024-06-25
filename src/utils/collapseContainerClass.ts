// import morphBackground from "~/utils/morphBackground";

export default class Collapse {
    element: HTMLElement;
    canvasContainer: HTMLElement | null = null;
    triggers: NodeListOf<Element> | null = null; // trigger elements that control the visibility of the container
    shouldAnimate= false;
    isAnimating = false;

    // Canvas height and width before collapsing
    originalCanvasHeight: number | null = null;
    originalCanvasWidth: number | null = null;

    private isItemExpandedAtLeastOnce = false;
    initCallback?: Function;
   
    constructor(element: HTMLElement) {
        this.element! = element;
        this.triggers = document.querySelectorAll('[aria-controls="' + this.element.getAttribute('id') + '"]');
        this.shouldAnimate = this.element.getAttribute('data-collapse-animate') == 'on';
        this.isAnimating = false;
        this.initCollapse();
        // this.onInitialized;

        // If the element contains a canvas, store its original dimensions
        this.canvasContainer = this.element?.querySelector('.canvas-container');

        const canvas = this.canvasContainer?.querySelector('canvas');
        if (!canvas) {
            console.warn('No canvas element found in the container');

            return;
        }

        if (canvas instanceof HTMLCanvasElement) {
            // console.log('canvas', canvas.height, canvas.width);
            
            this.originalCanvasHeight = canvas.height ;
            this.originalCanvasWidth = canvas.width ;
        }

        // Immediately adjust the canvas size if the container is initially expanded
        if (this.canvasContainer && !this.canvasContainer.classList.contains('collapsed')) {
            // console.log('canvas expanded');
            
            
            const targetWidth = window.innerWidth;
            const targetHeight = this.originalCanvasHeight ? this.originalCanvasHeight : 0; // Use your logic to determine the initial height
            console.log({targetHeight, targetWidth});

            this.adjustCanvasSizeForDPR(canvas, targetWidth, targetHeight);
        }
    }

    initCollapse() {
        if ( this.triggers ) {
            // set initial 'aria-expanded' attribute for trigger elements
            this.updateTriggers(!this.element?.classList.contains('hide'));

            // detect click on trigger elements
            for(let i = 0; i < this.triggers.length; i++) {
                this.triggers[i].addEventListener('click', (event: Event) => {
                    event.preventDefault();
                    this.toggleVisibility();
                });
            }
        }

        // custom event
        // this.element?.addEventListener('collapseToggle', (event: Event) =>{
        //     this.toggleVisibility();
        // });
    }

    toggleVisibility() {
        let isContainerCollapsed = this.element?.classList.contains('hide');
        if(this.isAnimating) return;
        this.isAnimating = true;
        this.animateElement(isContainerCollapsed);
        this.updateTriggers(isContainerCollapsed);

        if (!this.isItemExpandedAtLeastOnce){
            if(this.initCallback){
                this.initCallback();    // Call the first time the item is expanded
            }
            this.isItemExpandedAtLeastOnce = true
        }

        // // If the element contains a canvas, store its original height before collapsing
        // const canvas = this.canvasContainer?.querySelector('canvas');
        // if (canvas instanceof HTMLCanvasElement && !isContainerCollapsed) {
        //     console.log('canvas', canvas.height, canvas.width);
            
        //     this.originalCanvasHeight = canvas.height;
        //     this.originalCanvasWidth = canvas.width;
        // }
    }

    animateElement(shouldShowContent: boolean) {
        // shouldShowContent === true -> show content
        if((!this.shouldAnimate || !window.requestAnimationFrame)) {
            this.element?.classList.toggle('hide', !shouldShowContent);
            this.isAnimating = false;
            console.log('no animation');
            
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

                // If the element contains a canvas and it's being expanded, animate its dimensions
                const canvasElement = this.canvasContainer?.querySelector('canvas');
                const dpr = window.devicePixelRatio || 1;

                if (this.canvasContainer && shouldShowContent) {
                    this.canvasContainer.classList.remove('collapsed'); // Remove the collapsed class to expand the container
                    
                    // TODO: investigate why the canvas is getting cut off if it is expanded initially ==========>>>>>>

                    // Add 5px to the original height to ensure the container is a little larger than the canvas
                    this.canvasContainer.style.height = ((this.originalCanvasHeight ?? 0) /*+5 */) + 'px';  
                        // Adjust the canvas width according to the window's innerWidth and DPR
                    if (canvasElement) {
                        const targetWidth = window.innerWidth;
                        const targetHeight = (this.originalCanvasHeight ?? 0); // Fallback to 0 if undefined
                        this.adjustCanvasSizeForDPR(canvasElement, targetWidth, targetHeight);
                    }
                  
                } else {
                    // Add the collapsed class to collapse the container
                    this.canvasContainer?.classList.add('collapsed');

                    // Animate the canvas dimensions
                    this.setHeight(
                        (this.originalCanvasHeight  ?? 0), 
                        (this.originalCanvasHeight ?? 0)  - 200,  
                        200, 
                        () => {
                                // Adjust the canvas width according to the window's innerWidth and DPR
                                if (canvasElement) {
                                    const targetWidth = window.innerWidth ;
                                    const targetHeight = (this.originalCanvasHeight ?? 0) ; // Fallback to 0 if undefined
                                    this.adjustCanvasSizeForDPR(canvasElement, targetWidth, targetHeight);
                                }
                        },
                        'easeInOutQuad'
                        
                    );
                }
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
                this.adjustCanvasAfterExpansion();
            }
        };
  
        //set the height of the element before starting animation -> fix bug on Safari
        this.element.style.height = start+"px";
        window.requestAnimationFrame(animateHeight);
    }

    // New method to adjust the canvas size after expansion
    adjustCanvasAfterExpansion() {
        const canvas = this.element?.querySelector('canvas');
        if (canvas instanceof HTMLCanvasElement) {
            // Delay the adjustment slightly to ensure it happens after the container has resized
            setTimeout(() => {
                this.adjustCanvasSizeForDPR(canvas, this.element.offsetWidth, canvas.offsetHeight);
            }, 0); // Adjust the timeout as needed based on your application's behavior
        }
    }

    // TODO: use this for window resize
    updateCanvasWidth() {
        const canvas = this.element?.querySelector('canvas');
        if (canvas instanceof HTMLCanvasElement) {
            canvas.setAttribute('width', window.innerWidth.toString());
        }
    }

    // Function to adjust the canvas size according to the device's DPR
    private adjustCanvasSizeForDPR(canvasElement: HTMLCanvasElement, width: number, height: number) {
        const dpr = window.devicePixelRatio || 1; // Get the device pixel ratio, defaulting to 1
        // Adjust the canvas drawing buffer size
        canvasElement.width = width * dpr;
        canvasElement.height = height * dpr;
        // Adjust the canvas display size (via CSS) to match the logical size
        canvasElement.style.width = `${width}px`;
        canvasElement.style.height = `${height}px`;
        // If additional adjustments are needed (e.g., for WebGL), they can be done here
        
    }

    onInitialized(callback: Function) {
        this.initCallback = callback;
        this.initCallback();
    }
}