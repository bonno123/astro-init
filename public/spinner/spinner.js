// Create a spinner element
export function startSpinner(targetElementOrSelector) {
    // Dynamically load the CSS for the spinner from the public folder
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/public/spinner/spinner.css';
    link.onload = () => {
        // Make the spinner visible only after the CSS has loaded
        spinnerOverlay.style.display = 'flex';
    };
    document.head.appendChild(link);

    // Determine the target element
    let targetElement;
    if (typeof targetElementOrSelector === 'string') {
        targetElement = document.querySelector(targetElementOrSelector);
    } else {
        targetElement = targetElementOrSelector;
    }

    if (!targetElement) {
        console.warn('Target element for spinner not found.');
        targetElement = document.body;
    }

   // Create the spinner overlay and append it to the target element
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.classList.add('spinner-overlay');
    spinnerOverlay.innerHTML = `<div class="spinner_icon"></div>`;

    // Set initial opacity to 0 to avoid flashing
    spinnerOverlay.style.opacity = 0;
    spinnerOverlay.style.display = 'flex';

    targetElement.appendChild(spinnerOverlay);

    // Use requestAnimationFrame to ensure spinnerOverlay is in the DOM
    requestAnimationFrame(() => {
        // Transition opacity to 1 for a smooth fade-in effect
        spinnerOverlay.style.transition = 'opacity 0.3s ease';
        spinnerOverlay.style.opacity = '1';
    });    

    
    return function stopSpinner() {
        // Smoothly fade out before removing
        spinnerOverlay.style.opacity = '0';
        spinnerOverlay.addEventListener('transitionend', () => {
            spinnerOverlay.remove();
        }, { once: true });
    };
}


