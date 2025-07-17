// Market Overview - Home Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations and interactions
    initScrollAnimations();
    initParallaxEffects();
    initCarouselEnhancements();
    initScrollProgress();
    initSmoothScrolling();
    initMarketDataSimulation();

    console.log('Market Overview Home Page Loaded Successfully');
});

// Scroll Animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationType = element.getAttribute('data-aos');
                const delay = element.getAttribute('data-aos-delay') || 0;

                setTimeout(() => {
                    element.classList.add('animate-on-scroll', 'animated');

                    // Add specific animation classes
                    switch(animationType) {
                        case 'fade-up':
                            element.style.animation = 'fadeInUp 0.6s ease forwards';
                            break;
                        case 'fade-left':
                            element.style.animation = 'fadeInLeft 0.6s ease forwards';
                            break;
                        case 'fade-right':
                            element.style.animation = 'fadeInRight 0.6s ease forwards';
                            break;
                        default:
                            element.style.animation = 'fadeInUp 0.6s ease forwards';
                    }
                }, delay);

                observer.unobserve(element);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Parallax Effects
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.floating-element, .floating-element-2, .floating-element-3');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;

        parallaxElements.forEach((element, index) => {
            const speed = parallaxSpeed * (index + 1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Enhanced Carousel Functionality
function initCarouselEnhancements() {
    const carousel = document.getElementById('marketsCarousel');
    const carouselInstance = new bootstrap.Carousel(carousel, {
        interval: 15000, // 15 seconds interval
        ride: 'carousel',
        wrap: true,
        keyboard: false, // Disable keyboard navigation
        touch: true
    });

    // Auto-pause on hover
    carousel.addEventListener('mouseenter', () => {
        carouselInstance.pause();
    });

    carousel.addEventListener('mouseleave', () => {
        carouselInstance.cycle();
    });

    // Enhanced swipe support for mobile
    let startX = 0;
    let endX = 0;
    let startY = 0;
    let endY = 0;
    let isSwipeGesture = false;

    carousel.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
        isSwipeGesture = true;
    });

    carousel.addEventListener('touchmove', (e) => {
        if (!isSwipeGesture) return;

        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // If vertical movement is greater than horizontal, it's not a swipe
        if (deltaY > deltaX) {
            isSwipeGesture = false;
        }
    });

    carousel.addEventListener('touchend', (e) => {
        if (!isSwipeGesture) return;

        endX = e.changedTouches[0].screenX;
        endY = e.changedTouches[0].screenY;
        handleSwipe();
    });

    function handleSwipe() {
        const deltaX = startX - endX;
        const deltaY = Math.abs(startY - endY);

        // Minimum swipe distance and ensure it's primarily horizontal
        if (Math.abs(deltaX) > 50 && deltaY < 100) {
            if (deltaX > 0) {
                carouselInstance.next();
            } else {
                carouselInstance.prev();
            }
        }
        isSwipeGesture = false;
    }

    // Ensure all cards are properly visible during transitions
    carousel.addEventListener('slid.bs.carousel', (event) => {
        const activeItem = event.relatedTarget;
        const cards = activeItem.querySelectorAll('.market-card');

        // Simply ensure all cards are visible without animations
        cards.forEach(card => {
            card.style.animation = 'none';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        });
    });

    // Initialize first slide cards
    const firstSlide = carousel.querySelector('.carousel-item.active');
    if (firstSlide) {
        const cards = firstSlide.querySelectorAll('.market-card');
        cards.forEach(card => {
            card.style.animation = 'none';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        });
    }
}

// Scroll Progress Bar
function initScrollProgress() {
    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = scrollPercent + '%';
    });
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Simulate Market Data Updates
function initMarketDataSimulation() {
    const statItems = document.querySelectorAll('.stat-item');

    function updateMarketData() {
        statItems.forEach(item => {
            const text = item.textContent;

            // Simulate price changes
            if (text.includes('$') || text.includes('€') || text.includes('₿')) {
                const hasPercentage = text.includes('%');
                if (hasPercentage) {
                    const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
                    const newValue = change.toFixed(1);
                    const color = change >= 0 ? '#198754' : '#dc3545';

                    item.style.color = color;
                    item.style.transition = 'all 0.3s ease';

                    // Add animation effect
                    item.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        item.style.transform = 'scale(1)';
                    }, 300);
                }
            }
        });
    }

    // Update market data every 15 seconds (same as carousel)
    setInterval(updateMarketData, 15000);
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
        navbar.style.backgroundColor = 'rgba(44, 44, 44, 0.95)';
        navbar.style.backdropFilter = 'blur(15px)';
    } else {
        navbar.classList.remove('scrolled');
        navbar.style.backgroundColor = 'rgba(44, 44, 44, 1)';
        navbar.style.backdropFilter = 'blur(10px)';
    }
});

// Enhanced Button Interactions
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    });

    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    });
});

// Intersection Observer for better performance
function initPerformanceOptimizations() {
    // Lazy load heavy content
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;

                // Add loaded class for styling
                element.classList.add('loaded');

                // Unobserve to prevent repeated calls
                observer.unobserve(element);
            }
        });
    }, observerOptions);

    // Observe market cards for performance
    document.querySelectorAll('.market-card').forEach(card => {
        observer.observe(card);
    });
}

// Initialize performance optimizations
initPerformanceOptimizations();

// Performance Monitoring
function logPerformanceMetrics() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page Load Performance:', {
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    totalTime: perfData.loadEventEnd - perfData.fetchStart
                });
            }, 0);
        });
    }
}

// Initialize performance monitoring
logPerformanceMetrics();

// Prevent layout shift during carousel transitions
function preventLayoutShift() {
    const carousel = document.getElementById('marketsCarousel');
    const carouselItems = carousel.querySelectorAll('.carousel-item');

    // Set consistent heights
    let maxHeight = 0;
    carouselItems.forEach(item => {
        const itemHeight = item.offsetHeight;
        if (itemHeight > maxHeight) {
            maxHeight = itemHeight;
        }
    });

    carouselItems.forEach(item => {
        item.style.minHeight = maxHeight + 'px';
    });
}

// Initialize layout shift prevention after DOM is loaded
setTimeout(preventLayoutShift, 100);

// Smooth resize handling
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        preventLayoutShift();
    }, 250);
});