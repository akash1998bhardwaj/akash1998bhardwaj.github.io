document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // Part A: Three.js Page Curl Transition on Scroll
    // ----------------------------------------------------
    const wrapper = document.querySelector('.about-image-wrapper');
    const originalImg = document.querySelector('.about-img');
    let material; // Global reference for GSAP animation

    if (wrapper && originalImg) {
        if (originalImg.complete) {
            initThreeTransition(wrapper, originalImg);
        } else {
            originalImg.addEventListener('load', () => {
                initThreeTransition(wrapper, originalImg);
            });
        }
    }

    function initThreeTransition(container, img) {
        // Get dimensions of container
        let width = container.clientWidth;
        let height = container.clientHeight;

        // Create WebGL Renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Hide the original image visually, but keep it for layout/bounds
        img.style.opacity = '0';
        img.style.pointerEvents = 'none';

        // Setup Orthographic Camera for 2D plane rendering
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const scene = new THREE.Scene();

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        
        // Target Image (to show when scrolled)
        const textureTo = textureLoader.load(img.src, () => {
            updateAspectScales();
            renderer.render(scene, camera);
        });

        // Default Image (to show initially)
        const textureFrom = textureLoader.load('assets/images/about_studio.png', () => {
            updateAspectScales();
            renderer.render(scene, camera);
        });

        // Optimize texture scaling
        textureTo.minFilter = THREE.LinearFilter;
        textureTo.generateMipmaps = false;
        textureFrom.minFilter = THREE.LinearFilter;
        textureFrom.generateMipmaps = false;

        // Page-Curl Transition Shader Material with aspect ratio cover support for both textures
        material = new THREE.ShaderMaterial({
            uniforms: {
                uTextureFrom: { value: textureFrom },
                uTextureTo: { value: textureTo },
                progress: { value: 0.0 },
                uAspectScaleFrom: { value: new THREE.Vector2(1.0, 1.0) },
                uAspectScaleTo: { value: new THREE.Vector2(1.0, 1.0) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTextureFrom;
                uniform sampler2D uTextureTo;
                uniform float progress;
                uniform vec2 uAspectScaleFrom;
                uniform vec2 uAspectScaleTo;
                varying vec2 vUv;

                const float MIN_AMOUNT = -0.16;
                const float MAX_AMOUNT = 1.5;
                const float PI = 3.141592653589793;
                const float scale = 512.0;
                const float sharpness = 3.0;
                const float cylinderRadius = 1.0 / PI / 2.0;

                // Non-uniform globals computed per fragment
                float amount;
                float cylinderCenter;
                float cylinderAngle;

                vec4 getFromColor(vec2 uv) {
                    vec2 texUv = (uv - 0.5) * uAspectScaleFrom + 0.5;
                    if (texUv.x < 0.0 || texUv.x > 1.0 || texUv.y < 0.0 || texUv.y > 1.0) {
                        return vec4(0.0, 0.0, 0.0, 0.0);
                    }
                    return texture2D(uTextureFrom, texUv);
                }

                vec4 getToColor(vec2 uv) {
                    vec2 texUv = (uv - 0.5) * uAspectScaleTo + 0.5;
                    if (texUv.x < 0.0 || texUv.x > 1.0 || texUv.y < 0.0 || texUv.y > 1.0) {
                        return vec4(0.0, 0.0, 0.0, 0.0);
                    }
                    return texture2D(uTextureTo, texUv);
                }

                vec3 hitPoint(float hitAngle, float yc, vec3 point, mat3 rrotation) {
                    float hp = hitAngle / (2.0 * PI);
                    point.y = hp;
                    return rrotation * point;
                }

                vec4 antiAlias(vec4 color1, vec4 color2, float distanc) {
                    distanc *= scale;
                    if (distanc < 0.0) return color2;
                    if (distanc > 2.0) return color1;
                    float dd = pow(1.0 - distanc / 2.0, sharpness);
                    return ((color2 - color1) * dd) + color1;
                }

                float distanceToEdge(vec3 point) {
                    float dx = abs(point.x > 0.5 ? 1.0 - point.x : point.x);
                    float dy = abs(point.y > 0.5 ? 1.0 - point.y : point.y);
                    if (point.x < 0.0) dx = -point.x;
                    if (point.x > 1.0) dx = point.x - 1.0;
                    if (point.y < 0.0) dy = -point.y;
                    if (point.y > 1.0) dy = point.y - 1.0;
                    if ((point.x < 0.0 || point.x > 1.0) && (point.y < 0.0 || point.y > 1.0)) return sqrt(dx * dx + dy * dy);
                    return min(dx, dy);
                }

                vec4 seeThrough(float yc, vec2 p, mat3 rotation, mat3 rrotation) {
                    float hitAngle = PI - (acos(clamp(yc / cylinderRadius, -1.0, 1.0)) - cylinderAngle);
                    vec3 point = hitPoint(hitAngle, yc, rotation * vec3(p, 1.0), rrotation);
                    if (yc <= 0.0 && (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0)) {
                        return getToColor(p);
                    }
                    if (yc > 0.0) return getFromColor(p);
                    vec4 color = getFromColor(point.xy);
                    vec4 tcolor = vec4(0.0);
                    return antiAlias(color, tcolor, distanceToEdge(point));
                }

                vec4 seeThroughWithShadow(float yc, vec2 p, vec3 point, mat3 rotation, mat3 rrotation) {
                    float shadow = distanceToEdge(point) * 30.0;
                    shadow = (1.0 - shadow) / 3.0;
                    if (shadow < 0.0) shadow = 0.0; else shadow *= amount;
                    vec4 shadowColor = seeThrough(yc, p, rotation, rrotation);
                    shadowColor.r -= shadow;
                    shadowColor.g -= shadow;
                    shadowColor.b -= shadow;
                    return shadowColor;
                }

                vec4 backside(float yc, vec3 point) {
                    vec4 color = getFromColor(point.xy);
                    float gray = (color.r + color.b + color.g) / 15.0;
                    gray += (8.0 / 10.0) * (pow(max(0.0, 1.0 - abs(yc / cylinderRadius)), 2.0 / 10.0) / 2.0 + (5.0 / 10.0));
                    color.rgb = vec3(gray);
                    return color;
                }

                vec4 behindSurface(vec2 p, float yc, vec3 point, mat3 rrotation) {
                    float safeAmount = amount >= 0.0 ? max(amount, 1e-4) : min(amount, -1e-4);
                    float shado = (1.0 - ((-cylinderRadius - yc) / safeAmount * 7.0)) / 6.0;
                    shado *= 1.0 - abs(point.x - 0.5);
                    yc = (-cylinderRadius - cylinderRadius - yc);
                    float hitAngle = (acos(clamp(yc / cylinderRadius, -1.0, 1.0)) + cylinderAngle) - PI;
                    point = hitPoint(hitAngle, yc, point, rrotation);
                    if (yc < 0.0 && point.x >= 0.0 && point.y >= 0.0 && point.x <= 1.0 && point.y <= 1.0 && (hitAngle < PI || amount > 0.5)) {
                        float dx = point.x - 0.5;
                        float dy = point.y - 0.5;
                        shado = 1.0 - (sqrt(dx * dx + dy * dy) / (71.0 / 100.0));
                        float nyc = -yc / cylinderRadius;
                        shado *= nyc * nyc * nyc;
                        shado *= 0.5;
                    } else {
                        shado = 0.0;
                    }
                    return vec4(getToColor(p).rgb - shado, 1.0);
                }

                void main() {
                    vec2 p = vUv;
                    amount = progress * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;
                    cylinderCenter = amount;
                    cylinderAngle = 2.0 * PI * amount;

                    const float angle = 100.0 * PI / 180.0;
                    float c = cos(-angle);
                    float s = sin(-angle);

                    mat3 rotation = mat3(
                        c, s, 0.0,
                        -s, c, 0.0,
                        -0.801, 0.8900, 1.0
                    );

                    c = cos(angle);
                    s = sin(angle);

                    mat3 rrotation = mat3(
                        c, s, 0.0,
                        -s, c, 0.0,
                        0.98500, 0.985, 1.0
                    );

                    vec3 point = rotation * vec3(p, 1.0);
                    float yc = point.y - cylinderCenter;

                    if (yc < -cylinderRadius) {
                        // Behind surface
                        gl_FragColor = behindSurface(p, yc, point, rrotation);
                        return;
                    }

                    if (yc > cylinderRadius) {
                        // Flat surface
                        gl_FragColor = getFromColor(p);
                        return;
                    }

                    float hitAngle = (acos(clamp(yc / cylinderRadius, -1.0, 1.0)) + cylinderAngle) - PI;
                    float hitAngleMod = mod(hitAngle, 2.0 * PI);

                    if ((hitAngleMod > PI && amount < 0.5) || (hitAngleMod > PI / 2.0 && amount < 0.0)) {
                        gl_FragColor = seeThrough(yc, p, rotation, rrotation);
                        return;
                    }

                    point = hitPoint(hitAngle, yc, point, rrotation);

                    if (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0) {
                        gl_FragColor = seeThroughWithShadow(yc, p, point, rotation, rrotation);
                        return;
                    }

                    vec4 color = backside(yc, point);
                    vec4 otherColor;

                    if (yc < 0.0) {
                        float dx2 = point.x - 0.5;
                        float dy2 = point.y - 0.5;
                        float shado = 1.0 - (sqrt(dx2 * dx2 + dy2 * dy2) / 0.71);
                        float nyc2 = -yc / cylinderRadius;
                        shado *= nyc2 * nyc2 * nyc2;
                        shado *= 0.5;
                        otherColor = vec4(0.0, 0.0, 0.0, shado);
                    } else {
                        otherColor = getFromColor(p);
                    }

                    color = antiAlias(color, otherColor, cylinderRadius - abs(yc));
                    vec4 cl = seeThroughWithShadow(yc, p, point, rotation, rrotation);
                    float dist = distanceToEdge(point);

                    gl_FragColor = antiAlias(color, cl, dist);
                }
            `
        });

        // Create Plane Mesh spanning the camera view
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Function to calculate and update texture cover mapping aspect ratios
        function updateAspectScales() {
            width = container.clientWidth;
            height = container.clientHeight;
            const containerAspect = width / height;

            // Aspect correction for Texture From (about_studio.png)
            if (textureFrom.image && textureFrom.image.naturalWidth) {
                const aspectFrom = textureFrom.image.naturalWidth / textureFrom.image.naturalHeight;
                let sx = 1.0, sy = 1.0;
                if (containerAspect > aspectFrom) {
                    sy = aspectFrom / containerAspect;
                } else {
                    sx = containerAspect / aspectFrom;
                }
                material.uniforms.uAspectScaleFrom.value.set(sx, sy);
            }

            // Aspect correction for Texture To (img.jpeg)
            if (img.naturalWidth && img.naturalHeight) {
                const aspectTo = img.naturalWidth / img.naturalHeight;
                let sx = 1.0, sy = 1.0;
                if (containerAspect > aspectTo) {
                    sy = aspectTo / containerAspect;
                } else {
                    sx = containerAspect / aspectTo;
                }
                material.uniforms.uAspectScaleTo.value.set(sx, sy);
            }
        }

        // Resize callback
        window.addEventListener('resize', () => {
            updateAspectScales();
            renderer.setSize(width, height);
        });

        // Initial update
        updateAspectScales();

        // Setup GSAP ScrollTrigger to link the shader's progress to the page scroll
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            gsap.to(material.uniforms.progress, {
                value: 1.0,
                ease: "none",
                scrollTrigger: {
                    trigger: ".about-image-wrapper",
                    start: "top 85%", // Starts curl when top of image wrapper is 85% down the viewport
                    end: "top 35%",   // Completes curl when top of image wrapper is 35% down the viewport
                    scrub: 1.0
                }
            });
        }

        // Animation Loop
        function tick() {
            requestAnimationFrame(tick);
            renderer.render(scene, camera);
        }
        tick();
    }

    // ----------------------------------------------------
    // Part B: GSAP ScrollTrigger 3D Depth Entrance
    // ----------------------------------------------------
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(".about-image-wrapper", 
            {
                z: -180,
                rotationX: 12,
                rotationY: -10,
                opacity: 0.5,
                transformOrigin: "center center -100px"
            },
            {
                z: 0,
                rotationX: 0,
                rotationY: 0,
                opacity: 1,
                ease: "power1.out",
                scrollTrigger: {
                    trigger: ".about-image-wrapper",
                    start: "top 85%",
                    end: "top 35%",
                    scrub: 1.0
                }
            }
        );
    }
});
