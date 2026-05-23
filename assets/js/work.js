/* All Work Page JS - Premium Creative Agency Portfolio */

document.addEventListener('DOMContentLoaded', () => {
    const customCursor = document.getElementById('custom-cursor');
    const curtain = document.getElementById('page-curtain');
    const loaderPercent = document.getElementById('loader-percent');
    const loaderBar = document.getElementById('loader-bar-fill');
    let mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ring = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // ----------------------------------------------------
    // 1. Loader Curtain Animation (Simulated Asset Loading)
    // ----------------------------------------------------
    let loadProgress = 0;
    const interval = setInterval(() => {
        loadProgress += Math.floor(Math.random() * 8) + 4;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(interval);
            
            // Wait slightly at 100% for smooth transition feel
            setTimeout(() => {
                curtain.classList.add('hidden');
                // Trigger reveal animations for cards in viewport
                revealGridCards();
            }, 600);
        }
        loaderPercent.textContent = `${loadProgress}%`;
        loaderBar.style.width = `${loadProgress}%`;
    }, 80);

    // ----------------------------------------------------
    // 2. Custom Cursor Tracking (Lerp)
    // ----------------------------------------------------
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Normalized coordinates [-1, 1] for Three.js camera rotation
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    function updateCursor() {
        cursor.x += (mouse.x - cursor.x) * 0.25;
        cursor.y += (mouse.y - cursor.y) * 0.25;
        ring.x += (mouse.x - ring.x) * 0.12;
        ring.y += (mouse.y - ring.y) * 0.12;

        if (customCursor) {
            customCursor.style.setProperty('--cursor-x', `${cursor.x}px`);
            customCursor.style.setProperty('--cursor-y', `${cursor.y}px`);
            customCursor.style.setProperty('--cursor-ring-x', `${ring.x}px`);
            customCursor.style.setProperty('--cursor-ring-y', `${ring.y}px`);
        }
        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover states for elements
    const setupCursorHovers = () => {
        const hoverElements = document.querySelectorAll('a, button, .showcase-image-wrapper');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (customCursor) customCursor.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                if (customCursor) customCursor.classList.remove('hover');
            });
        });
    };

    // ----------------------------------------------------
    // 3. Three.js Background Particle Scene & Warp Intro
    // ----------------------------------------------------
    const canvas = document.getElementById('webgl-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
        
        // Set camera far back for intro warp animation
        camera.position.z = 1000;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create programmatic glowing dot texture (no asset dependencies)
        function createCircleTexture() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 16;
            tempCanvas.height = 16;
            const ctx = tempCanvas.getContext('2d');
            
            const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
            gradient.addColorStop(0, 'rgba(0, 255, 170, 1)');
            gradient.addColorStop(0.3, 'rgba(0, 255, 170, 0.7)');
            gradient.addColorStop(0.7, 'rgba(0, 229, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 16, 16);
            return new THREE.CanvasTexture(tempCanvas);
        }

        // Particle field geometry
        const particleCount = 1800;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = []; // Store for vector offsets

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Distribute randomly in space (Z-depth extends far back)
            const x = (Math.random() - 0.5) * 1600;
            const y = (Math.random() - 0.5) * 1200;
            const z = (Math.random() - 0.7) * 1500; // clusters stretching far behind camera
            
            positions[i] = x;
            positions[i + 1] = y;
            positions[i + 2] = z;
            
            originalPositions.push({ x: x, y: y, z: z });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 5,
            map: createCircleTexture(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // Intro Camera Fly-through Target
        let targetCamZ = 280;
        let rotationSpeed = 0.0006;
        let isIntroComplete = false;

        // Animation Loop
        function animateScene() {
            requestAnimationFrame(animateScene);

            const posAttribute = geometry.attributes.position;
            const time = Date.now() * 0.0008;

            // Slowly animate/warp particles
            for (let i = 0; i < particleCount; i++) {
                const idx = i * 3;
                const orig = originalPositions[i];

                // Drift particles in a slow orbit
                posAttribute.array[idx] = orig.x + Math.sin(time + orig.z * 0.005) * 20;
                posAttribute.array[idx + 1] = orig.y + Math.cos(time + orig.x * 0.005) * 20;
                
                // Add interactive mouse pushback (gravitational drift away from cursor)
                const dx = posAttribute.array[idx] - (mouse.tx * 300);
                const dy = posAttribute.array[idx + 1] - (mouse.ty * 300);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) {
                    const force = (200 - dist) / 200;
                    posAttribute.array[idx] += (dx / dist) * force * 12;
                    posAttribute.array[idx + 1] += (dy / dist) * force * 12;
                }
            }
            posAttribute.needsUpdate = true;

            // Page Opening transition camera slide-in
            if (camera.position.z > targetCamZ + 0.5) {
                // Fly forward through the particle starfield
                camera.position.z += (targetCamZ - camera.position.z) * 0.04;
                particles.rotation.z += 0.008; // Spin sensation
                particles.rotation.y += 0.002;
            } else {
                if (!isIntroComplete) {
                    isIntroComplete = true;
                }
                
                // Slow orbital rotation idle state
                particles.rotation.y += rotationSpeed;
                
                // Smooth camera float reaction to mouse coordinate shifts
                camera.position.x += (mouse.tx * 80 - camera.position.x) * 0.05;
                camera.position.y += (mouse.ty * 80 - camera.position.y) * 0.05;
            }

            renderer.render(scene, camera);
        }
        animateScene();
    }

    // ----------------------------------------------------
    // 4. Parallax Scroll Effect for Card Images
    // ----------------------------------------------------
    const showcaseImgs = document.querySelectorAll('.showcase-img');
    
    function applyParallax() {
        showcaseImgs.forEach(img => {
            const rect = img.parentElement.getBoundingClientRect();
            const viewH = window.innerHeight;
            
            // Only calculate translation if element is visible in viewport
            if (rect.top < viewH && rect.bottom > 0) {
                const scrollProgress = (viewH - rect.top) / (viewH + rect.height);
                // Shift image within its -12% to 3% vertical overflow bounds
                const translateY = -12 + (scrollProgress * 15);
                img.style.transform = `translateY(${translateY}%) scale(1.05)`;
            }
        });
    }

    window.addEventListener('scroll', applyParallax, { passive: true });

    // ----------------------------------------------------
    // 5. Scroll-triggered Reveal Animations
    // ----------------------------------------------------
    const showcaseCards = document.querySelectorAll('.work-showcase-card');
    
    function revealGridCards() {
        const observerOptions = {
            root: null,
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        showcaseCards.forEach(card => {
            observer.observe(card);
        });
    }

    // ----------------------------------------------------
    // 6. 3D Card Tilt and Hover Spotlight Actions
    // ----------------------------------------------------
    showcaseCards.forEach(card => {
        const inner = card.querySelector('.showcase-card-inner');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set local mouse coordinates as variables for CSS spotlights
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // 3D rotation angles
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * 6; // max 6deg tilt
            const rotateY = -((x - centerX) / centerX) * 6; // max 6deg tilt

            if (inner) {
                inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            if (inner) {
                inner.style.transform = '';
            }
        });
    });

    // Run setup and initial triggers
    setupCursorHovers();
    // Run initial parallax on page load
    setTimeout(applyParallax, 500);
});
