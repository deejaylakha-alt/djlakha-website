/* ═══════════════════════════════════════════
   DJ LAKHA — Script
   - Transparent nav: dark over hero, dark+blur on scroll, light-mode over white section
   - Scroll-based reveal animations
   - Mobile nav overlay
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs ─────────────────────
  const navbar        = document.getElementById('navbar');
  const lightSection  = document.getElementById('lightSection');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav     = document.getElementById('mobileNav');
  const mobileCloseBtn= document.getElementById('mobileCloseBtn');

  // ── Navbar scroll behavior ────────────
  function updateNav() {
    if (!navbar) return;
    const scrollY = window.scrollY;

    // Hero height threshold
    const heroEl = document.getElementById('hero');
    const heroBottom = heroEl ? heroEl.offsetHeight : 600;

    if (scrollY < 40) {
      // At very top — fully transparent
      navbar.classList.remove('scrolled', 'light-mode');
    } else if (scrollY >= heroBottom - 80 && lightSection) {
      // Over the white section
      const lightTop = lightSection.getBoundingClientRect().top;
      if (lightTop <= 80) {
        navbar.classList.add('scrolled', 'light-mode');
      } else {
        navbar.classList.add('scrolled');
        navbar.classList.remove('light-mode');
      }
    } else {
      // Scrolled but still over hero
      navbar.classList.add('scrolled');
      navbar.classList.remove('light-mode');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // run once on load

  // ── Mobile nav overlay ────────────────
  function openMobileNav() {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileNav);

  // Close when a mobile nav link is clicked
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // ── Intersection Observer — reveal animations ──
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback — make all visible
    revealEls.forEach(el => el.classList.add('active'));
  }

  // ── Smooth scroll for anchor links ────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
