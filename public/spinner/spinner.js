// TODO: refactor to use a the overlays as a single element

// Create a spinner element
export function startSpinner(targetElementOrSelector) {
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
    // spinnerOverlay.innerHTML = `<div class="spinner_icon"></div>`;

    // Set initial styles for spinnerOverlay to cover the full viewport
    spinnerOverlay.style.position = 'fixed'; // Use fixed to cover the full viewport
    spinnerOverlay.style.top = 0;
    spinnerOverlay.style.left = 0;
    spinnerOverlay.style.width = '100vw';
    spinnerOverlay.style.height = '100vh';
    spinnerOverlay.style.display = 'flex';
    spinnerOverlay.style.justifyContent = 'center';
    spinnerOverlay.style.alignItems = 'center';
    spinnerOverlay.style.opacity = 0; // Set initial opacity to 0 to avoid flashing

    // Create an extra overlay for the target element
    const extraOverlay = document.createElement('div');
    extraOverlay.classList.add('extra-overlay');
    extraOverlay.innerHTML = `<div class="spinner_icon"></div>`;

    // Style the extra overlay as needed, e.g., full width and height, semi-transparent background
    extraOverlay.style.position = 'absolute';
    extraOverlay.style.top = 0;
    extraOverlay.style.left = 0;
    extraOverlay.style.width = '100%';
    extraOverlay.style.height = '100%';
    extraOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'; // Example: semi-transparent white
    extraOverlay.style.opacity = 0;
    extraOverlay.style.display = 'flex';
    extraOverlay.style.justifyContent = 'center';
    extraOverlay.style.alignItems = 'center';

    // Append both overlays to the target element
    // targetElement.appendChild(spinnerOverlay);
    document.body.appendChild(spinnerOverlay);
    targetElement.appendChild(extraOverlay);

    // Ensure the target element is positioned relatively or absolutely
    if (getComputedStyle(targetElement).position === 'static') {
        targetElement.style.position = 'relative';
    }

    // Use requestAnimationFrame to ensure spinnerOverlay is in the DOM
    requestAnimationFrame(() => {
        // Transition opacity to 1 for a smooth fade-in effect
        spinnerOverlay.style.transition = 'opacity 0.3s ease';
        spinnerOverlay.style.opacity = '1';
        extraOverlay.style.transition = 'opacity 0.3s ease';
        extraOverlay.style.opacity = '1';
    });    

    
    return function stopSpinner() {
        // Smoothly fade out before removing
        spinnerOverlay.style.opacity = '0';
        extraOverlay.style.opacity = '0';

        spinnerOverlay.addEventListener('transitionend', () => {
            spinnerOverlay.remove();
        }, { once: true });

        extraOverlay.addEventListener('transitionend', () => {
            extraOverlay.remove();
        }, { once: true });
    };
}


