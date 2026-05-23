/* Main JS - Premium Creative Agency Portfolio */

document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const customCursor = document.getElementById('custom-cursor');
    const bgCanvas = document.getElementById('bg-canvas');
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    const cubeViewport = document.querySelector('.cube-viewport');
    const cubeContainer = document.querySelector('.cube-container');
    const hoverElements = document.querySelectorAll('a, button, .social-link, .expertise-item, .cube-viewport, .menu-toggle');

    // ----------------------------------------------------
    // 1. Custom Cursor with LERP (Linear Interpolation)
    // ----------------------------------------------------
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ring = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Update mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Custom Cursor Animation Loop
    function updateCursor() {
        // LERP formula: current = current + (target - current) * speed
        cursor.x += (mouse.x - cursor.x) * 0.25;
        cursor.y += (mouse.y - cursor.y) * 0.25;

        ring.x += (mouse.x - ring.x) * 0.12;
        ring.y += (mouse.y - ring.y) * 0.12;

        // Apply positions via CSS Custom Properties
        document.documentElement.style.setProperty('--cursor-x', `${cursor.x}px`);
        document.documentElement.style.setProperty('--cursor-y', `${cursor.y}px`);
        document.documentElement.style.setProperty('--cursor-ring-x', `${ring.x}px`);
        document.documentElement.style.setProperty('--cursor-ring-y', `${ring.y}px`);

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover states for cursor
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            customCursor.classList.add('hover');
            if (el.classList.contains('cube-viewport')) {
                customCursor.classList.add('drag');
            }
        });
        el.addEventListener('mouseleave', () => {
            customCursor.classList.remove('hover');
            customCursor.classList.remove('drag');
        });
    });

    // ----------------------------------------------------
    // 2. Interactive Canvas Dot Grid
    // ----------------------------------------------------
    const ctx = bgCanvas.getContext('2d');
    let dots = [];
    const dotSpacing = 42;
    const maxDistance = 140; // Proximity threshold for mouse interaction

    function initCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        dots = [];

        const cols = Math.ceil(bgCanvas.width / dotSpacing) + 1;
        const rows = Math.ceil(bgCanvas.height / dotSpacing) + 1;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * dotSpacing;
                const y = j * dotSpacing;
                dots.push({
                    x: x,
                    y: y,
                    cx: x,
                    cy: y,
                    size: 1.2,
                    alpha: 0.15
                });
            }
        }
    }

    function animateCanvas() {
        ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

        dots.forEach(dot => {
            const dx = mouse.x - dot.x;
            const dy = mouse.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

            let targetX = dot.x;
            let targetY = dot.y;
            let targetAlpha = 0.15;
            let targetSize = 1.2;

            if (dist < maxDistance) {
                // Proximity multiplier
                const force = (maxDistance - dist) / maxDistance;

                // Push dots away from cursor (warping grid)
                targetX = dot.x - (dx / dist) * force * 15;
                targetY = dot.y - (dy / dist) * force * 15;

                // Increase brightness and size near cursor
                targetAlpha = 0.15 + force * 0.55;
                targetSize = 1.2 + force * 1.2;
            }

            // Smooth interpolation
            dot.cx += (targetX - dot.cx) * 0.08;
            dot.cy += (targetY - dot.cy) * 0.08;
            dot.alpha += (targetAlpha - dot.alpha) * 0.08;
            dot.size += (targetSize - dot.size) * 0.08;

            // Draw dot
            ctx.beginPath();
            ctx.arc(dot.cx, dot.cy, dot.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 170, ${dot.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(animateCanvas);
    }

    initCanvas();
    animateCanvas();

    window.addEventListener('resize', () => {
        initCanvas();
    });

    // ----------------------------------------------------
    // 3. 3D Cube Controller (Drag, Spin, Tilt & Inertia)
    // ----------------------------------------------------
    let rx = -15; // Current X rotation
    let ry = 45;  // Current Y rotation

    let targetRx = -15;
    let targetRy = 45;

    let vx = 0;   // Velocity X (controls Y rotation)
    let vy = 0;   // Velocity Y (controls X rotation)

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let autoRotationOffset = 0; // Slowly increments when not dragging
    let friction = 0.95;

    // Handle Drag Mouse Events
    cubeViewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        customCursor.classList.add('drag');
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        vx = 0;
        vy = 0;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        targetRy += deltaX * 0.4;
        targetRx -= deltaY * 0.4;

        // Cap X rotation so it doesn't flip completely upsidedown
        targetRx = Math.max(-85, Math.min(85, targetRx));

        // Calculate velocity
        vx = deltaX * 0.4;
        vy = -deltaY * 0.4;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            customCursor.classList.remove('drag');
        }
    });

    // Handle Touch/Mobile Drag Events
    cubeViewport.addEventListener('touchstart', (e) => {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        vx = 0;
        vy = 0;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - lastMouseX;
        const deltaY = e.touches[0].clientY - lastMouseY;

        targetRy += deltaX * 0.4;
        targetRx -= deltaY * 0.4;

        targetRx = Math.max(-85, Math.min(85, targetRx));

        vx = deltaX * 0.4;
        vy = -deltaY * 0.4;

        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Cube Physics Animation Loop
    function updateCube() {
        if (isDragging) {
            // Drag tracking (smooth lerp to target)
            rx += (targetRx - rx) * 0.25;
            ry += (targetRy - ry) * 0.25;
            autoRotationOffset = ry; // Synchronize autoRotationOffset
        } else if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
            // Spin inertia (momentum)
            ry += vx;
            rx += vy;

            // Limit X rotation
            rx = Math.max(-85, Math.min(85, rx));

            // Apply friction/decay
            vx *= friction;
            vy *= friction;

            // Sync targets
            targetRx = rx;
            targetRy = ry;
            autoRotationOffset = ry; // Synchronize autoRotationOffset
        } else {
            // Idle auto-rotation + mousemove tilt
            autoRotationOffset += 0.12;

            // Calculate tilt offsets based on mouse position relative to center
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;

            const tiltY = ((mouse.x - screenCenterX) / screenCenterX) * 22; // max Y tilt
            const tiltX = -((mouse.y - screenCenterY) / screenCenterY) * 22; // max X tilt

            // Auto rotation is applied to Y axis
            const baseTargetRy = autoRotationOffset + tiltY;
            const baseTargetRx = -15 + tiltX;

            // Interpolate smoothly
            rx += (baseTargetRx - rx) * 0.05;
            ry += (baseTargetRy - ry) * 0.05;
        }

        // Apply styles to container
        cubeContainer.style.setProperty('--rx', `${rx}deg`);
        cubeContainer.style.setProperty('--ry', `${ry}deg`);

        requestAnimationFrame(updateCube);
    }
    updateCube();

    // ----------------------------------------------------
    // 4. Navigation Overlay & Scroll Header Trigger
    // ----------------------------------------------------
    let menuThreeInitialized = false;
    let startMenuThreeAnimation = () => { };

    menuToggle.addEventListener('click', () => {
        header.classList.toggle('menu-active');
        const isActive = menuOverlay.classList.toggle('active');

        if (isActive) {
            if (!menuThreeInitialized) {
                initMenuThreeJS();
            } else {
                startMenuThreeAnimation();
            }
        }
    });

    // Close menu overlay on clicking menu links
    const menuLinks = document.querySelectorAll('.menu-item');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('menu-active');
            menuOverlay.classList.remove('active');
        });
    });

    // Header scroll background morph
    window.addEventListener('scroll', () => {
        if (window.scrollY > 120) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ----------------------------------------------------
    // 5. Scroll-triggered Alignment for Works Section
    // ----------------------------------------------------
    const worksSection = document.querySelector('.works-section');
    if (worksSection) {
        const observerOptions = {
            root: null,
            rootMargin: '-5% 0px -5% 0px', // Slight margin offset to prevent sudden snapping at edge of screen
            threshold: 0.15 // Trigger when 15% of the section is visible in viewport
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    worksSection.classList.add('aligned');
                } else {
                    worksSection.classList.remove('aligned');
                }
            });
        }, observerOptions);

        observer.observe(worksSection);
    }

    // ----------------------------------------------------
    // 6. Services (What We Do) Accordion Toggles
    // ----------------------------------------------------
    const servicesRows = document.querySelectorAll('.services-row');
    if (servicesRows.length > 0) {
        // Open the first row (Branding Design) by default
        servicesRows[0].classList.add('active');
        const firstHeaderBtn = servicesRows[0].querySelector('.services-row-header');
        if (firstHeaderBtn) {
            firstHeaderBtn.setAttribute('aria-expanded', 'true');
        }

        // Attach click listeners to headers
        servicesRows.forEach(row => {
            const headerBtn = row.querySelector('.services-row-header');
            if (headerBtn) {
                headerBtn.addEventListener('click', () => {
                    const isActive = row.classList.contains('active');

                    // Close all rows
                    servicesRows.forEach(r => {
                        r.classList.remove('active');
                        const btn = r.querySelector('.services-row-header');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    });

                    // If the clicked row was not active, open it
                    if (!isActive) {
                        row.classList.add('active');
                        headerBtn.setAttribute('aria-expanded', 'true');
                    }
                });
            }
        });
    }

    // ----------------------------------------------------
    // 7. Process (How We Work) Drag-to-Scroll Slider & Card Tilt/Spotlight
    // ----------------------------------------------------
    const processTrack = document.querySelector('.process-track');
    const processCards = document.querySelectorAll('.process-card');
    if (processTrack) {
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0;
        let momentumID;

        // Custom Cursor interaction
        processTrack.addEventListener('mouseenter', () => {
            customCursor.classList.add('hover');
            customCursor.classList.add('drag');
        });

        processTrack.addEventListener('mouseleave', () => {
            if (!isDown) {
                customCursor.classList.remove('hover');
                customCursor.classList.remove('drag');
            }
        });

        processTrack.addEventListener('mousedown', (e) => {
            if (e.target.closest('.subtask-item')) return;
            isDown = true;
            processTrack.classList.add('active');
            startX = e.pageX - processTrack.offsetLeft;
            scrollLeft = processTrack.scrollLeft;
            cancelAnimationFrame(momentumID);

            // Add custom cursor drag visual state
            customCursor.classList.add('drag');
        });

        window.addEventListener('mouseup', () => {
            if (isDown) {
                isDown = false;
                processTrack.classList.remove('active');

                // Remove custom cursor drag visual state unless we are still hovering it
                const hoveredEl = document.elementFromPoint(mouse.x, mouse.y);
                if (!hoveredEl || !processTrack.contains(hoveredEl)) {
                    customCursor.classList.remove('hover');
                    customCursor.classList.remove('drag');
                }

                // Start inertia momentum
                requestAnimationFrame(momentumLoop);
            }
        });

        processTrack.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - processTrack.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            const prevScrollLeft = processTrack.scrollLeft;
            processTrack.scrollLeft = scrollLeft - walk;
            velX = processTrack.scrollLeft - prevScrollLeft; // Calculate velocity
        });

        function momentumLoop() {
            if (Math.abs(velX) > 0.5) {
                processTrack.scrollLeft += velX;
                velX *= 0.95; // Friction decay
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

        // Spotlight & 3D Tilt Logic for Cards
        processCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 8; // max 8deg vertical rotation
                const rotateY = -((x - centerX) / centerX) * 8; // max 8deg horizontal rotation

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });

        // Timeline Progress Bar Update Logic
        function updateProcessProgress() {
            const progressBar = document.getElementById('process-progress-bar');
            if (!progressBar) return;

            if (window.innerWidth > 768) {
                const scrollLeftPos = processTrack.scrollLeft;
                const maxScrollLeft = processTrack.scrollWidth - processTrack.clientWidth;
                const progress = maxScrollLeft > 0 ? (scrollLeftPos / maxScrollLeft) * 100 : 0;

                progressBar.style.width = `${progress}%`;
                progressBar.style.height = '100%';
            } else {
                const section = document.querySelector('.process-section');
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const sectionHeight = rect.height;
                    const viewHeight = window.innerHeight;

                    const start = viewHeight * 0.8;
                    const end = viewHeight * 0.2;
                    const total = sectionHeight - (start - end);
                    const current = start - rect.top;
                    const progressPercent = Math.max(0, Math.min(100, (current / total) * 100));

                    progressBar.style.height = `${progressPercent}%`;
                    progressBar.style.width = '100%';
                }
            }
        }

        processTrack.addEventListener('scroll', updateProcessProgress);
        window.addEventListener('scroll', updateProcessProgress, { passive: true });
        window.addEventListener('resize', updateProcessProgress);

        updateProcessProgress();
    }

    // ----------------------------------------------------
    // 8. Testimonials Drag-to-Scroll Slider
    // ----------------------------------------------------
    const testiTrack = document.querySelector('.testimonials-track');
    if (testiTrack) {
        let tIsDown = false;
        let tStartX;
        let tScrollLeft;
        let tVelX = 0;
        let tMomentumID;

        // Custom cursor states
        testiTrack.addEventListener('mouseenter', () => {
            customCursor.classList.add('hover');
            customCursor.classList.add('drag');
        });

        testiTrack.addEventListener('mouseleave', () => {
            if (!tIsDown) {
                customCursor.classList.remove('hover');
                customCursor.classList.remove('drag');
            }
        });

        testiTrack.addEventListener('mousedown', (e) => {
            tIsDown = true;
            tStartX = e.pageX - testiTrack.offsetLeft;
            tScrollLeft = testiTrack.scrollLeft;
            cancelAnimationFrame(tMomentumID);
            customCursor.classList.add('drag');
        });

        window.addEventListener('mouseup', () => {
            if (tIsDown) {
                tIsDown = false;
                const hoveredEl = document.elementFromPoint(mouse.x, mouse.y);
                if (!hoveredEl || !testiTrack.contains(hoveredEl)) {
                    customCursor.classList.remove('hover');
                    customCursor.classList.remove('drag');
                }
                requestAnimationFrame(testiMomentumLoop);
            }
        });

        testiTrack.addEventListener('mousemove', (e) => {
            if (!tIsDown) return;
            e.preventDefault();
            const x = e.pageX - testiTrack.offsetLeft;
            const walk = (x - tStartX) * 1.5;
            const prevScroll = testiTrack.scrollLeft;
            testiTrack.scrollLeft = tScrollLeft - walk;
            tVelX = testiTrack.scrollLeft - prevScroll;
        });

        function testiMomentumLoop() {
            if (Math.abs(tVelX) > 0.5) {
                testiTrack.scrollLeft += tVelX;
                tVelX *= 0.95;
                tMomentumID = requestAnimationFrame(testiMomentumLoop);
            }
        }

        // Touch support
        testiTrack.addEventListener('touchstart', (e) => {
            tIsDown = true;
            tStartX = e.touches[0].pageX - testiTrack.offsetLeft;
            tScrollLeft = testiTrack.scrollLeft;
            cancelAnimationFrame(tMomentumID);
        });

        testiTrack.addEventListener('touchmove', (e) => {
            if (!tIsDown) return;
            const x = e.touches[0].pageX - testiTrack.offsetLeft;
            const walk = (x - tStartX) * 1.5;
            const prevScroll = testiTrack.scrollLeft;
            testiTrack.scrollLeft = tScrollLeft - walk;
            tVelX = testiTrack.scrollLeft - prevScroll;
        });

        testiTrack.addEventListener('touchend', () => {
            tIsDown = false;
            requestAnimationFrame(testiMomentumLoop);
        });
    }

    // ----------------------------------------------------
    // 9. Contact Form — AJAX Submit + Toast Notification
    // ----------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {

        // ── Toast helper ──────────────────────────────────
        function showToast(message, isSuccess) {
            // Remove any existing toast
            document.querySelectorAll('.portfolio-toast').forEach(t => t.remove());

            const toast = document.createElement('div');
            toast.className = 'portfolio-toast';

            const bgColor = isSuccess ? 'var(--accent-primary)' : '#ff4d6d';
            const shadowColor = isSuccess ? 'rgba(0,255,170,0.45)' : 'rgba(255,77,109,0.45)';
            const textColor = isSuccess ? 'var(--bg-color)' : '#ffffff';
            const icon = isSuccess ? '✓' : '✕';

            toast.style.cssText = `
                position: fixed;
                bottom: 40px;
                right: 40px;
                z-index: 9998;
                display: flex;
                align-items: center;
                gap: 12px;
                background: ${bgColor};
                color: ${textColor};
                font-family: var(--font-body);
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                padding: 16px 28px;
                border-radius: 50px;
                box-shadow: 0 0 40px ${shadowColor};
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.4s ease, transform 0.4s ease;
                pointer-events: none;
                max-width: 380px;
            `;

            const iconSpan = document.createElement('span');
            iconSpan.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                background: rgba(0,0,0,0.15);
                border-radius: 50%;
                font-size: 12px;
                flex-shrink: 0;
            `;
            iconSpan.textContent = icon;

            const textSpan = document.createElement('span');
            textSpan.textContent = message;

            toast.appendChild(iconSpan);
            toast.appendChild(textSpan);
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => toast.remove(), 400);
            }, 4500);
        }

        // ── Submit handler (jQuery $.ajax) ───────────────
        $(contactForm).on('submit', function (e) {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('#contact-submit-btn');
            const btnSpan = submitBtn ? submitBtn.querySelector('span') : null;
            const originalTxt = btnSpan ? btnSpan.textContent : 'Send Message';

            // Loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
            }
            if (btnSpan) btnSpan.textContent = 'Sending…';

            $.ajax({
                type: 'POST',
                url: 'php/contact-form.php',
                data: $(this).serialize(),
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        showToast('Message Sent Successfully!', true);
                        contactForm.reset();
                    } else {
                        showToast(data.message || 'Something went wrong. Please try again.', false);
                    }
                },
                error: function (xhr, status, err) {
                    console.error('[Contact Form] AJAX error:', status, err);
                    console.error('[Contact Form] Response:', xhr.responseText);
                    showToast('Network error. Please try again later.', false);
                },
                complete: function () {
                    // Restore button state
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                    }
                    if (btnSpan) btnSpan.textContent = originalTxt;
                }
            });
        });
    }

    // ----------------------------------------------------
    // 10. Who I Work With — Sticky Split Heading + Scroll Cards
    //     On scroll: font-size expands (4.5vw → 11vw) and
    //     the cards track translates upward through the window
    // ----------------------------------------------------
    const whowithSection = document.getElementById('whowith');
    const whowithLeftText = document.getElementById('whowith-left-text');
    const whowithRightText = document.getElementById('whowith-right-text');
    const whowithTrack = document.getElementById('whowith-track');
    const whowithWin = document.getElementById('whowith-window');

    if (whowithSection && whowithLeftText && whowithRightText && whowithTrack && whowithWin) {
        const WW_FS_START = 4.5;  // vw — compact heading at section entry
        const WW_FS_END = 11;   // vw — fully expanded mid-scroll

        function wwLerp(a, b, t) {
            return a + (b - a) * Math.max(0, Math.min(1, t));
        }

        function onWhowithScroll() {
            // Only run the sticky effect on larger screens
            if (window.innerWidth <= 768) return;

            const rect = whowithSection.getBoundingClientRect();
            const secH = whowithSection.offsetHeight;
            const viewH = window.innerHeight;

            // progress: 0 when section top = viewport top, 1 when section bottom = viewport bottom
            const rawProgress = -rect.top / Math.max(1, secH - viewH);
            const progress = Math.max(0, Math.min(1, rawProgress));

            // 1. Expand font-size on both heading blocks
            const fs = wwLerp(WW_FS_START, WW_FS_END, progress);
            whowithLeftText.querySelectorAll('span').forEach(s => { s.style.fontSize = fs + 'vw'; });
            whowithRightText.querySelectorAll('span').forEach(s => { s.style.fontSize = fs + 'vw'; });

            // 2. Scroll the cards track upward through the window
            const trackH = whowithTrack.scrollHeight;
            const windowH = whowithWin.offsetHeight;
            const maxTravel = Math.max(0, trackH - windowH + 30);
            whowithTrack.style.transform = `translateY(${-(progress * maxTravel)}px)`;
        }

        window.addEventListener('scroll', onWhowithScroll, { passive: true });
        // Run once immediately so initial state is correct
        onWhowithScroll();
    }

    // ----------------------------------------------------
    // 11. FAQ Accordion — single-open expand/collapse
    // ----------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const btn = item.querySelector('.faq-btn');
            if (!btn) return;

            btn.addEventListener('click', () => {
                const isAlreadyOpen = item.classList.contains('active');

                // Close every item
                faqItems.forEach(fi => {
                    fi.classList.remove('active');
                    const b = fi.querySelector('.faq-btn');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });

                // Re-open clicked item if it was closed
                if (!isAlreadyOpen) {
                    item.classList.add('active');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    // (Note: Old fitFooterName JS removed; font-size is now handled fluidly by native CSS vw units)

    // ----------------------------------------------------
    // 13. 3D About Modal Toggles & Interactive Card Tilt
    // ----------------------------------------------------
    const aboutMoreBtn = document.getElementById('about-more-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const aboutModal = document.getElementById('about-modal');
    const modalContactBtn = document.getElementById('modal-contact-btn');

    if (aboutMoreBtn && modalCloseBtn && aboutModal) {
        // Open Modal
        aboutMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Reset custom cursor states inside modal
            customCursor.classList.remove('drag');
            customCursor.classList.remove('hover');
        });

        // Close Modal function
        const closeModal = () => {
            aboutModal.classList.remove('active');
            document.body.style.overflow = '';

            // Clear any inline transforms on the tilted profile card
            const profileCard = aboutModal.querySelector('.profile-card-3d');
            if (profileCard) {
                profileCard.style.transform = '';
            }
        };

        // Close on clicking X button
        modalCloseBtn.addEventListener('click', closeModal);

        // Close on clicking backdrop overlay
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                closeModal();
            }
        });

        // "Contact Us" inside modal behavior
        if (modalContactBtn) {
            modalContactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();

                // Scroll smoothly to contact section
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    // Small delay to let the modal fade-out transition complete first
                    setTimeout(() => {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                    }, 350);
                }
            });
        }

        // 3D Profile Card Tilt inside Modal
        const profileCard = aboutModal.querySelector('.profile-card-3d');
        if (profileCard) {
            aboutModal.addEventListener('mousemove', (e) => {
                if (!aboutModal.classList.contains('active')) return;

                const rect = profileCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Pass relative coordinates to CSS for radial hover spotlight positioning
                profileCard.style.setProperty('--card-mx', `${(x / rect.width) * 100}%`);
                profileCard.style.setProperty('--card-my', `${(y / rect.height) * 100}%`);

                // 3D tilt coordinates calculation
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 10; // max 10deg vertical
                const rotateY = -((x - centerX) / centerX) * 10; // max 10deg horizontal

                profileCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });

            aboutModal.addEventListener('mouseleave', () => {
                profileCard.style.transform = '';
                profileCard.style.setProperty('--card-mx', '50%');
                profileCard.style.setProperty('--card-my', '50%');
            });
        }
    }

    // ----------------------------------------------------
    // 14. Premium Staggered Word Slide-Up Reveal on Scroll
    // ----------------------------------------------------
    const revealElements = document.querySelectorAll('.scramble-text');

    function initWordReveal(element) {
        if (element.dataset.wordRevealedInit === 'true') return;
        element.dataset.wordRevealedInit = 'true';

        // Save original child nodes to preserve <br> elements
        const childNodes = Array.from(element.childNodes);

        // Clear element and build structure
        element.textContent = '';

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const words = text.split(/\s+/);

                words.forEach(word => {
                    if (word.trim() !== '') {
                        const mask = document.createElement('span');
                        mask.className = 'word-mask';

                        const inner = document.createElement('span');
                        inner.className = 'word-inner';
                        inner.textContent = word;

                        mask.appendChild(inner);
                        element.appendChild(mask);
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Clone and append tags like <br> directly without wrapping
                const clone = node.cloneNode(true);
                element.appendChild(clone);
            }
        });

        // Apply transition delays to all word-inner spans inside this element
        const inners = element.querySelectorAll('.word-inner');
        inners.forEach((inner, index) => {
            inner.style.transitionDelay = `${index * 0.035}s`;
        });
    }

    if (revealElements.length > 0) {
        // Initialize structures immediately
        revealElements.forEach(el => initWordReveal(el));

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -12% 0px', // Triggers when 12% inside viewport
            threshold: 0
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ----------------------------------------------------
    // 15. Header Scroll Progress Indicator
    // ----------------------------------------------------
    const headerProgress = document.getElementById('header-scroll-progress');
    const updateScrollProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (headerProgress) {
            headerProgress.style.width = `${scrollPercent}%`;
        }
        header.style.setProperty('--scroll-percent', `${scrollPercent}%`);
    };
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // ----------------------------------------------------
    // 16. Selected Work Card 3D Perspective Tilt & Cursor Spotlight Glow
    // ----------------------------------------------------
    const workCards = document.querySelectorAll('.work-card');
    if (workCards.length > 0) {
        workCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Update local coordinates for CSS spotlight gradient
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                // 3D Perspective Tilt calculations (capped at 6 degrees)
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 6;
                const rotateY = -((x - centerX) / centerX) * 6;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                // Reset card transform and clear spotlight variables
                card.style.transform = '';
                card.style.removeProperty('--mouse-x');
                card.style.removeProperty('--mouse-y');
            });
        });
    }

    // ----------------------------------------------------
    // 16b. Tech Card 3D Perspective Tilt & Cursor Spotlight Glow
    // ----------------------------------------------------
    const techCards = document.querySelectorAll('.tech-card');
    if (techCards.length > 0) {
        techCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 5; // max 5deg tilt
                const rotateY = -((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.removeProperty('--mouse-x');
                card.style.removeProperty('--mouse-y');
            });
        });
    }


    // ----------------------------------------------------
    // 17. Footer Live Local Time Clock (Kolkata/IST)
    // ----------------------------------------------------
    const footerTime = document.getElementById('footer-local-time');
    if (footerTime) {
        function updateTime() {
            const options = {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            const timeString = new Date().toLocaleTimeString('en-US', options);
            footerTime.textContent = `${timeString} IST`;
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // ----------------------------------------------------
    // 18. Back to Top Button Smooth Scroll
    // ----------------------------------------------------
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ----------------------------------------------------
    // 19. Scroll-triggered Reveal for Footer Background Name
    // ----------------------------------------------------
    const siteFooter = document.getElementById('site-footer');
    if (siteFooter) {
        const footerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    siteFooter.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -5% 0px', // Triggers when footer is 5% inside viewport
            threshold: 0.05
        });
        footerObserver.observe(siteFooter);
    }

    // ----------------------------------------------------
    // 20. Dynamic Fullscreen Menu Background Label Controller
    // ----------------------------------------------------
    const bgLabel = document.querySelector('.menu-bg-label');
    const menuItems = document.querySelectorAll('.menu-item');
    const labelMapping = {
        'menu-home': 'WELCOME',
        'menu-work': 'PORTFOLIO',
        'menu-about': 'MY STORY',
        'menu-services': 'WHAT I DO',
        'menu-process': 'HOW I WORK',
        'menu-whowith': 'PARTNERS',
        'menu-faq': 'ANSWERS',
        'menu-testimonials': 'REVIEWS',
        'menu-contact': 'LET\'S TALK'
    };

    if (bgLabel && menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const targetText = labelMapping[item.id] || 'NAVIGATION';
                bgLabel.classList.add('changing');
                setTimeout(() => {
                    bgLabel.textContent = targetText;
                    bgLabel.classList.remove('changing');
                }, 200);
            });

            item.addEventListener('mouseleave', () => {
                bgLabel.classList.add('changing');
                setTimeout(() => {
                    bgLabel.textContent = 'NAVIGATION';
                    bgLabel.classList.remove('changing');
                }, 200);
            });
        });
    }

    // ----------------------------------------------------
    // 21. Three.js Interactive 3D Sphere Particle Controller (Menu Overlay Left)
    // ----------------------------------------------------
    function initMenuThreeJS() {
        const canvas = document.getElementById('menu-three-canvas');
        const leftPanel = document.querySelector('.menu-overlay-left');
        if (!canvas || !leftPanel || typeof THREE === 'undefined') return;

        menuThreeInitialized = true;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(50, leftPanel.clientWidth / leftPanel.clientHeight, 0.1, 100);
        camera.position.z = 4.2;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(leftPanel.clientWidth, leftPanel.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Geometry (Fibonacci Sphere Distribution)
        const particleCount = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);

        const r = 1.45; // radius of sphere
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.acos(1 - 2 * (i + 0.5) / particleCount);
            const phi = Math.PI * (1 + Math.sqrt(5)) * i;

            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(theta);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Material (Glowing particles)
        const material = new THREE.PointsMaterial({
            color: 0x00ffaa,
            size: 0.045,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Points
        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Mouse tracking for magnetic tilt deforms
        let menuMouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        // Track inside left panel
        leftPanel.addEventListener('mousemove', (e) => {
            const rect = leftPanel.getBoundingClientRect();
            menuMouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            menuMouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

            // Pass local mouse coordinates to CSS custom properties on portrait glow
            const portraitFrame = leftPanel.querySelector('.menu-portrait-frame');
            if (portraitFrame) {
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                portraitFrame.style.setProperty('--mouse-x', `${px}px`);
                portraitFrame.style.setProperty('--mouse-y', `${py}px`);
            }
        });

        leftPanel.addEventListener('mouseleave', () => {
            menuMouse.targetX = 0;
            menuMouse.targetY = 0;
        });

        // Animation Loop
        let animationFrameId;
        const tick = () => {
            if (!menuOverlay.classList.contains('active')) {
                cancelAnimationFrame(animationFrameId);
                return;
            }

            animationFrameId = requestAnimationFrame(tick);

            const time = Date.now() * 0.0015;

            // Slow rotation
            particleSystem.rotation.y += 0.0015;
            particleSystem.rotation.x += 0.0006;

            // Mouse interaction (cushioned LERP)
            menuMouse.x += (menuMouse.targetX - menuMouse.x) * 0.08;
            menuMouse.y += (menuMouse.targetY - menuMouse.y) * 0.08;

            particleSystem.rotation.y += menuMouse.x * 0.015;
            particleSystem.rotation.x += menuMouse.y * 0.015;

            // Deform Points shape using mathematical wave equations
            const posAttribute = geometry.getAttribute('position');
            for (let i = 0; i < particleCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                const ox = originalPositions[ix];
                const oy = originalPositions[iy];
                const oz = originalPositions[iz];

                const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
                const nx = ox / dist;
                const ny = oy / dist;
                const nz = oz / dist;

                // Deform wave deforms along normal
                const wave = Math.sin(ox * 2.5 + time) * 0.15 + Math.cos(oy * 2.5 + time) * 0.15;

                posAttribute.array[ix] = ox + nx * wave;
                posAttribute.array[iy] = oy + ny * wave;
                posAttribute.array[iz] = oz + nz * wave;
            }
            posAttribute.needsUpdate = true;

            renderer.render(scene, camera);
        };

        // Resize handler
        const onResize = () => {
            if (!menuOverlay.classList.contains('active')) return;
            const width = leftPanel.clientWidth;
            const height = leftPanel.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', onResize);

        // Expose start animation handler
        startMenuThreeAnimation = () => {
            onResize();
            cancelAnimationFrame(animationFrameId);
            tick();
        };

        startMenuThreeAnimation();
    }
});

