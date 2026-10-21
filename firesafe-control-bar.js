
/* FireSafe Track shared bottom navigation — mobile devices only.
   Hides on scroll down and reappears on scroll up.
   Preserves navigation, More menu, and bottom content spacing. */

(() => {
  // Prevent duplicate navigation if the script is accidentally loaded twice.
  if (document.querySelector('.fst-bottom-nav')) return;

  const links = [
    {label:'Dashboard',href:'dashboard.html',icon:'▦',match:['dashboard.html']},
    {label:'Inspections',href:'inspections.html',icon:'✓',match:['inspections.html']},
    {label:'Equipment',href:'equipment.html',icon:'▣',match:['equipment.html','equipment-types.html']},
    {label:'Deviations',href:'deviations.html',icon:'!',match:['deviations.html','corrective-actions.html']},
    {label:'Reports',href:'reports.html',icon:'▤',match:['reports.html']}
  ];

  const more = [
    {label:'Corrective Actions',href:'corrective-actions.html'},
    {label:'Locations',href:'locations.html'}
  ];

  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const style = document.createElement('style');

  style.textContent = `
    .fst-bottom-nav,
    .fst-more-panel {
      display: none !important;
    }

    @media (max-width:768px) {
      html {
        scroll-padding-bottom: calc(112px + env(safe-area-inset-bottom));
      }

      body {
        padding-bottom: calc(112px + env(safe-area-inset-bottom)) !important;
      }

      .fst-bottom-nav {
        position: fixed;
        z-index: 9999;
        left: 0;
        right: 0;
        bottom: 0;

        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 3px;

        padding: 7px
          max(7px, env(safe-area-inset-left))
          calc(7px + env(safe-area-inset-bottom))
          max(7px, env(safe-area-inset-right));

        background: rgba(5,15,30,.97);
        border-top: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(14px);
        font-family: Arial, sans-serif;

        transform: translateY(0);
        transition: transform .25s ease, opacity .25s ease;
        opacity: 1;
        will-change: transform;
      }

      /* Hidden state while scrolling down. */
      .fst-bottom-nav.fst-nav-hidden {
        transform: translateY(110%);
        opacity: 0;
        pointer-events: none;
      }

      .fst-bottom-nav a,
      .fst-more-toggle {
        min-width: 0;
        min-height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;

        border: 0;
        border-radius: 9px;
        background: transparent;
        color: #aebdce;
        text-decoration: none;
        font: 700 10px Arial, sans-serif;
        cursor: pointer;
      }

      .fst-bottom-nav .fst-nav-icon {
        font-size: 19px;
        line-height: 1;
      }

      .fst-bottom-nav a.active,
      .fst-bottom-nav a:focus-visible,
      .fst-more-toggle:focus-visible {
        color: #fff;
        background: rgba(255,59,48,.17);
        outline: 1px solid rgba(255,59,48,.45);
      }

      .fst-bottom-nav a.active .fst-nav-icon {
        color: #ff3b30;
      }

      .fst-more-panel {
        position: fixed;
        z-index: 10000;
        right: 10px;
        bottom: calc(80px + env(safe-area-inset-bottom));
        width: min(230px, calc(100vw - 20px));
        padding: 8px;
        border: 1px solid #ffffff25;
        border-radius: 12px;
        background: #0b1f3a;
        box-shadow: 0 12px 40px #0008;
      }

      .fst-more-panel.open {
        display: block !important;
      }

      .fst-more-panel a {
        display: block;
        padding: 12px;
        color: #fff;
        text-decoration: none;
        border-radius: 7px;
        font: 14px Arial, sans-serif;
      }

      .fst-more-panel a:hover {
        background: #ffffff15;
      }

      /* Keep the navigation visible when the More menu is open. */
      .fst-bottom-nav.fst-menu-open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      @media (prefers-reduced-motion: reduce) {
        .fst-bottom-nav {
          transition: none;
        }
      }
    }
  `;

  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'fst-bottom-nav';
  nav.setAttribute('aria-label', 'FireSafe Track navigation');

  links.forEach(item => {
    const a = document.createElement('a');
    a.href = './' + item.href;
    a.innerHTML =
      '<span class="fst-nav-icon" aria-hidden="true">' +
      item.icon +
      '</span><span>' +
      item.label +
      '</span>';

    if (item.match.includes(current)) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }

    nav.appendChild(a);
  });

  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'fst-more-toggle';
  moreBtn.innerHTML =
    '<span class="fst-nav-icon" aria-hidden="true">⋯</span>' +
    '<span>More</span>';

  moreBtn.setAttribute('aria-expanded', 'false');
  nav.appendChild(moreBtn);

  const panel = document.createElement('div');
  panel.className = 'fst-more-panel';
  panel.setAttribute('aria-label', 'More application pages');

  more.forEach(item => {
    const a = document.createElement('a');
    a.href = './' + item.href;
    a.textContent = item.label;

    if (item.href === current) {
      a.style.color = '#ff6b63';
    }

    panel.appendChild(a);
  });

  document.body.appendChild(panel);
  document.body.appendChild(nav);

  // More menu.
  const closeMenu = () => {
    panel.classList.remove('open');
    nav.classList.remove('fst-menu-open');
    moreBtn.setAttribute('aria-expanded', 'false');
  };

  moreBtn.addEventListener('click', () => {
    const open = !panel.classList.contains('open');

    panel.classList.toggle('open', open);
    nav.classList.toggle('fst-menu-open', open);
    moreBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && !moreBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // Hide on downward scrolling and reveal on upward scrolling.
  let lastScrollY = window.scrollY;
  let scrollTicking = false;
  const scrollThreshold = 8;
  const topThreshold = 40;

  const handleScroll = () => {
    const currentY = Math.max(0, window.scrollY);
    const difference = currentY - lastScrollY;

    // Always show the bar near the top of the page.
    if (currentY <= topThreshold) {
      nav.classList.remove('fst-nav-hidden');
      lastScrollY = currentY;
      scrollTicking = false;
      return;
    }

    // Do not hide navigation while the More menu is open.
    if (panel.classList.contains('open')) {
      nav.classList.remove('fst-nav-hidden');
      lastScrollY = currentY;
      scrollTicking = false;
      return;
    }

    if (Math.abs(difference) >= scrollThreshold) {
      if (difference > 0) {
        // Scrolling down: hide the bar.
        nav.classList.add('fst-nav-hidden');
      } else {
        // Scrolling up: show the bar.
        nav.classList.remove('fst-nav-hidden');
      }

      lastScrollY = currentY;
    }

    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(handleScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // Reveal the bar when the user returns to the page.
  window.addEventListener('pageshow', () => {
    nav.classList.remove('fst-nav-hidden');
    lastScrollY = window.scrollY;
  });

})();
