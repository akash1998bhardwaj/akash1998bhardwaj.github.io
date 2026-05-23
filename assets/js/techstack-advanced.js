document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.querySelector('.advanced-techstack-wrap');
    const sticky = document.querySelector('.advanced-techstack-sticky');
    const mainTitle = document.querySelector('.adv-main-title');
    const splitTitleWrap = document.querySelector('.adv-split-title-wrap');
    const leftTitle = document.querySelector('.adv-left-title');
    const rightTitle = document.querySelector('.adv-right-title');
    const headerTag = document.querySelector('.adv-header-tag');
    const tiltedCardWrap = document.querySelector('.tilted-neon-card-wrap');
    const tiltedCard = document.querySelector('.tilted-neon-card');
    const tunnelContainer = document.querySelector('.tunnel-container');
    const chakriContainer = document.querySelector('.chakri-container');
    const chakriWheel = document.querySelector('.chakri-wheel');
    const cards = document.querySelectorAll('.chakri-card');
    const dotsContainer = document.querySelector('.chakri-nav-indicators');

    if (!wrap || !sticky) return;

    // Create nav dots dynamically for the 8 cards
    cards.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = 'chakri-dot' + (idx === 0 ? ' active' : '');
        dotsContainer.appendChild(dot);
    });
    const dots = document.querySelectorAll('.chakri-dot');

    // 3D placement parameters
    let radius = window.innerWidth < 768 ? 210 : 360;

    // Handle screen resize to adjust 3D radius
    window.addEventListener('resize', () => {
        radius = window.innerWidth < 768 ? 210 : 360;
        positionCards();
    });

    function positionCards() {
        cards.forEach((card, idx) => {
            const angle = idx * 45; // 8 cards = 360 / 8 = 45deg
            card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
            // Store base angle on element for active card calculation
            card.dataset.angle = angle;
        });
    }
    positionCards();

    // Mouse movement interactive tilt for Phase 1 Card
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    sticky.addEventListener('mousemove', (e) => {
        const rect = sticky.getBoundingClientRect();
        // Get normalized values between -1 and 1
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetX = x * 20; // max 20deg tilt
        targetY = y * -20;
    });

    sticky.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });

    // LERP animation loop for mouse tilt
    function updateTilt() {
        mouseX += (targetX - mouseX) * 0.1;
        mouseY += (targetY - mouseY) * 0.1;

        if (tiltedCard) {
            // Combine scroll tilt with mouse interactive tilt
            tiltedCard.style.transform = `rotateX(${25 + mouseY}deg) rotateY(${-20 + mouseX}deg) rotateZ(8deg)`;
        }

        requestAnimationFrame(updateTilt);
    }
    updateTilt();

    // Setup Perspective Tunnel frames (5 frames)
    const numFrames = 5;
    for (let i = 0; i < numFrames; i++) {
        const frame = document.createElement('div');
        frame.className = 'tunnel-frame';
        tunnelContainer.appendChild(frame);
    }
    const frames = document.querySelectorAll('.tunnel-frame');

    // Main scroll handler
    window.addEventListener('scroll', handleScroll);
    // Initial call to set positions
    handleScroll();

    function handleScroll() {
        const rect = wrap.getBoundingClientRect();
        const scrollHeight = rect.height;
        const viewportHeight = window.innerHeight;

        // Calculate scroll progress within the 400vh wrap
        const scrolled = -rect.top;
        const maxScroll = scrollHeight - viewportHeight;
        let progress = scrolled / maxScroll;
        progress = Math.max(0, Math.min(1, progress));

        // Coordinate the three phases based on progress (0.0 to 1.0)
        
        // ----------------------------------------------------
        // PHASE 1: Frontend Developer Title + Tilted Card (0.0 - 0.28)
        // ----------------------------------------------------
        if (progress <= 0.28) {
            const p1 = progress / 0.28;
            
            // Text values
            mainTitle.style.display = 'block';
            mainTitle.style.opacity = Math.max(0, 1 - p1 * 1.5);
            mainTitle.style.transform = `translateZ(50px) scale(${1 - p1 * 0.1})`;

            // Card values
            tiltedCardWrap.style.display = 'block';
            tiltedCardWrap.style.opacity = Math.max(0, 1 - p1 * 1.5);
            tiltedCardWrap.style.transform = `translateZ(${p1 * 150}px) scale(${1 + p1 * 0.15})`;

            // Hide Phase 2/3
            splitTitleWrap.style.opacity = '0';
            tunnelContainer.style.opacity = '0';
            chakriContainer.style.opacity = '0';
            headerTag.style.opacity = '0';
            headerTag.style.transform = 'translateY(-20px)';
            dotsContainer.style.opacity = '0';
        }
        
        // ----------------------------------------------------
        // PHASE 2: "tech" / "stack" Title + 3D Tunnel (0.28 - 0.58)
        // ----------------------------------------------------
        else if (progress > 0.28 && progress <= 0.58) {
            const p2 = (progress - 0.28) / 0.3; // 0.0 to 1.0 within phase

            // Hide Phase 1
            mainTitle.style.display = 'none';
            tiltedCardWrap.style.display = 'none';
            chakriContainer.style.opacity = '0';
            headerTag.style.opacity = '0';
            headerTag.style.transform = 'translateY(-20px)';
            dotsContainer.style.opacity = '0';

            // Show Phase 2 Elements
            splitTitleWrap.style.opacity = p2 < 0.85 ? Math.min(1, p2 * 5) : Math.max(0, (1 - p2) * 6);
            tunnelContainer.style.opacity = p2 < 0.85 ? Math.min(1, p2 * 4) : Math.max(0, (1 - p2) * 6);

            // Animate title splitting outwards
            const splitDistance = p2 * 12; // percentage displacement
            leftTitle.style.transform = `translateX(${-splitDistance}vw)`;
            rightTitle.style.transform = `translateX(${splitDistance}vw)`;

            // Render Perspective Tunnel loop
            frames.forEach((frame, idx) => {
                // Space frames out along Z-axis (0px to 800px)
                const frameOffset = idx * (800 / numFrames);
                let z = ((p2 * 1200) + frameOffset) % 800;

                // Scale increases as frame flies closer
                // Prevent divide by zero: scale is capped
                const scale = 0.05 + (z / 800) * 2.2;
                
                // Calculate opacity: fade in at distance, fade out as it approaches camera
                let opacity = 0;
                if (z > 50 && z <= 650) {
                    opacity = (z - 50) / 100; // fade in quickly
                    opacity = Math.min(1, opacity);
                } else if (z > 650) {
                    opacity = (780 - z) / 130; // fade out as it flies past
                    opacity = Math.max(0, opacity);
                }

                frame.style.transform = `translateZ(${-800 + z}px)`;
                frame.style.scale = scale;
                frame.style.opacity = opacity;
            });
        }
        
        // ----------------------------------------------------
        // PHASE 3: 3D Chakri (Rotating Tech Stack Wheel) (0.58 - 1.0)
        // ----------------------------------------------------
        else {
            const p3 = (progress - 0.58) / 0.42; // 0.0 to 1.0 within phase

            // Hide Phase 1 / 2
            mainTitle.style.display = 'none';
            tiltedCardWrap.style.display = 'none';
            splitTitleWrap.style.opacity = '0';
            tunnelContainer.style.opacity = '0';

            // Show Phase 3 Elements
            chakriContainer.style.opacity = Math.min(1, p3 * 4);
            chakriContainer.style.transform = `scale(${0.8 + p3 * 0.2}) translateZ(${0}px)`;

            headerTag.style.opacity = Math.min(1, p3 * 4);
            headerTag.style.transform = 'translateY(0)';

            dotsContainer.style.opacity = Math.min(1, p3 * 4);
            dotsContainer.style.transform = 'translateY(0)';

            // Spin the 3D wheel based on scroll
            // 360 * 1.5 makes it spin 1.5 full rotations through the scroll phase
            const spin = -p3 * 360 * 1.5; 
            chakriWheel.style.transform = `rotateY(${spin}deg) rotateX(10deg)`;

            // Determine which card is closest to the front (angle = 0deg relative to screen)
            // The screen center is at 0deg. A card is at the front when (cardAngle + spin) % 360 === 0.
            let minDiff = Infinity;
            let activeIdx = 0;

            cards.forEach((card, idx) => {
                const cardBaseAngle = parseFloat(card.dataset.angle);
                // Calculate current angle of the card in world space
                let worldAngle = (cardBaseAngle + spin) % 360;
                if (worldAngle < 0) worldAngle += 360;

                // Distance to front (which is 0deg or 360deg)
                const diff = Math.min(worldAngle, 360 - worldAngle);
                
                // Add Y-rotation offset variables so CSS can adjust face alignment on hover
                card.style.setProperty('--hover-rot-y', `${-cardBaseAngle}deg`);

                if (diff < minDiff) {
                    minDiff = diff;
                    activeIdx = idx;
                }
            });

            // Update active state classes on cards and indicator dots
            cards.forEach((card, idx) => {
                if (idx === activeIdx) {
                    if (!card.classList.contains('active')) {
                        card.classList.add('active');
                    }
                } else {
                    card.classList.remove('active');
                }
            });

            dots.forEach((dot, idx) => {
                if (idx === activeIdx) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
});
