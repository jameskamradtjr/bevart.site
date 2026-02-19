// ===== FlowEasy Landing Page - App JS =====

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80,
    delay: 100,
  });

  // ===== Navbar scroll effect =====
  const navbar = document.getElementById('navbar');
  const navbarWrapper = document.getElementById('navbar-wrapper');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
      navbarWrapper.style.paddingTop = '8px';
    } else {
      navbar.classList.remove('scrolled');
      navbarWrapper.style.paddingTop = '16px';
    }

    lastScroll = currentScroll;
  });

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ===== Counter animation for metrics =====
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('[data-count]');
        counters.forEach(counter => {
          animateCounter(counter);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.counter-section').forEach(section => {
    counterObserver.observe(section);
  });

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = prefix + Math.floor(current).toLocaleString('pt-BR') + suffix;
    }, 16);
  }

  // ===== Typing effect for hero subtitle =====
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const texts = [
      'Gestão de SST com inteligência artificial',
      'Matrizes de risco personalizáveis em segundos',
      'Compliance em PDF e integração com eSocial',
      'Transforme sua rotina técnica com o Bevart'
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
      const currentText = texts[textIndex];

      if (isDeleting) {
        typingEl.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingEl.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 30 : 60;

      if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 500;
      }

      setTimeout(typeEffect, typeSpeed);
    }

    setTimeout(typeEffect, 1500);
  }

  // ===== FAQ Accordion (using Alpine.js, but fallback) =====
  document.querySelectorAll('.faq-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const content = button.nextElementSibling;
      const icon = button.querySelector('.faq-icon');

      if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });

  // ===== Parallax floating icons =====
  const parallaxIcons = document.querySelectorAll('.parallax-icon');

  if (parallaxIcons.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      parallaxIcons.forEach(icon => {
        const speed = parseFloat(icon.getAttribute('data-speed')) || 0.2;
        const yOffset = scrollY * speed;
        icon.style.transform = `translateY(${yOffset}px)`;
      });
    }, { passive: true });
  }

  // ===== Flow Section Animation (Vertical Line) =====
  const flowSection = document.getElementById('fluxo');
  const flowLine = document.querySelector('.flow-main-line');

  if (flowSection && flowLine) {
    const flowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Calculate the height to animate to
          const flowSteps = flowSection.querySelectorAll('.flow-step');
          if (flowSteps.length > 0) {
            const firstNode = flowSteps[0].querySelector('.flow-node-center');
            const lastNode = flowSteps[flowSteps.length - 1].querySelector('.flow-node-center');

            if (firstNode && lastNode) {
              const startTop = firstNode.offsetTop + (firstNode.offsetHeight / 2);
              const endTop = lastNode.offsetTop + (lastNode.offsetHeight / 2);
              const totalHeight = endTop - startTop;

              flowLine.style.top = `${startTop}px`;
              flowLine.style.transition = 'height 2.5s cubic-bezier(0.4, 0, 0.2, 1)';
              flowLine.style.height = `${totalHeight}px`;
            }
          }
          flowObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    flowObserver.observe(flowSection);
  }
});
