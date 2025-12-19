
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Redesign Buttons
    const wrappers = document.querySelectorAll('.minimal-img-wrapper');

    wrappers.forEach(wrapper => {
        const btn = wrapper.querySelector('.redesign-btn');
        const overlay = wrapper.querySelector('.generating-overlay');
        const img = wrapper.querySelector('img');

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent other clicks if any

            // 1. Show Generating State
            overlay.classList.add('active');

            // 2. Simulate AI Processing Delay (2 seconds)
            setTimeout(() => {
                // 3. Swap Image
                // We add a random parameter to force a new image from loremflickr
                const currentSrc = img.src.split('?')[0];
                const cleanSrc = currentSrc.includes('random=') ? currentSrc.split('?')[0] : currentSrc;
                // Add a unique timestamp to force refresh
                const newSrc = `${cleanSrc}?random=${Date.now()}`;

                img.src = newSrc;

                // Image load handler to remove overlay only when new image is ready
                img.onload = () => {
                    overlay.classList.remove('active');
                };

                // Fallback in case onload fails
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 1000);

            }, 2000);
        });
    });
});
