// Immediately inject loading screen markup to prevent rendering flash
(function() {
  if (window.location.pathname.toLowerCase().includes('admin.html')) return;

  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'global-loader-screen';
  loader.innerHTML = `
    <div class="loader-content-wrap">
      <img src="onyx logo.png" alt="OnyxChat Logo" class="loader-logo-img">
      <h1 class="loader-title">Onyx<span style="font-style: italic; color: #f43f5e;">Chat</span></h1>
      <div class="loader-bar-container">
        <div class="loader-bar-progress" id="global-loader-bar"></div>
      </div>
    </div>
    <div class="loader-counter-wrap">
      <span id="loader-percent-num">0</span>%
    </div>
  `;
  document.documentElement.appendChild(loader);
  document.documentElement.classList.add('loading-lock');
})();

document.addEventListener('DOMContentLoaded', () => {
  // --- Global Loader Animation ---
  const loaderEl = document.getElementById('global-loader');
  const barEl = document.getElementById('global-loader-bar');
  const numEl = document.getElementById('loader-percent-num');

  if (loaderEl && barEl && numEl) {
    let progress = 0;
    const intervalTime = 12; // counter speed (approx 1.2s total duration)
    
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 3) + 1; // realistic count increments
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        barEl.style.width = '100%';
        numEl.innerText = '100';
        
        setTimeout(() => {
          loaderEl.style.opacity = '0';
          loaderEl.style.visibility = 'hidden';
          document.documentElement.classList.remove('loading-lock');
          setTimeout(() => {
            loaderEl.remove();
          }, 400);
        }, 350);
      } else {
        barEl.style.width = progress + '%';
        numEl.innerText = progress;
      }
    }, intervalTime);
  }

  // Theme management
  const themeToggle = document.getElementById('theme-toggle-btn');
  const htmlElement = document.documentElement;
  
  // Set default theme to dark or retrieve from localStorage
  const currentTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.setAttribute('data-theme', currentTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const activeTheme = htmlElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Mobile Menu Toggling
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  
  if (mobileNavToggle && navMenu) {
    mobileNavToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileNavToggle.innerHTML = isOpen 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });
  }

  // Set active nav link based on URL
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (pageName === href || (pageName === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Fade-in animations on scroll
  const fadeElems = document.querySelectorAll('.fade-in-scroll');
  const appearOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  };

  const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('appear');
      observer.unobserve(entry.target);
    });
  }, appearOptions);

  window.appearOnScroll = appearOnScroll;

  if (fadeElems.length > 0) {
    fadeElems.forEach(elem => {
      appearOnScroll.observe(elem);
    });
  }

  // --- Admin State Controllers & Gates ---

  // 1. Theme Color Scheme
  async function applyThemeColors() {
    const customPrimary = await DB.getSetting('themePrimary', '#6366f1');
    const customSecondary = await DB.getSetting('themeSecondary', '#a855f7');
    const customAccent = await DB.getSetting('themeAccent', '#f43f5e');
    const customOpacity = await DB.getSetting('themeGlowOpacity', '12');

    if (customPrimary) document.documentElement.style.setProperty('--primary', customPrimary);
    if (customSecondary) document.documentElement.style.setProperty('--secondary', customSecondary);
    if (customAccent) document.documentElement.style.setProperty('--heading-accent', customAccent);
    
    if (customPrimary && customSecondary) {
      document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${customPrimary} 0%, ${customSecondary} 100%)`);
    }

    if (customPrimary && customOpacity) {
      function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
      }
      document.documentElement.style.setProperty('--primary-glow', `rgba(${hexToRgb(customPrimary)}, ${customOpacity / 100})`);
    }
  }

  // 2. Announcement Ticker
  async function syncTicker() {
    const tickerActive = (await DB.getSetting('tickerActive', 'false')) === 'true';
    const tickerText = await DB.getSetting('tickerText', '🔥 OnyxChat v1.2.0 is coming soon with E2E encrypted group calls! Stay tuned.');
    
    let existingTicker = document.querySelector('.announcement-ticker-banner');
    
    if (tickerActive) {
      if (!existingTicker) {
        existingTicker = document.createElement('div');
        existingTicker.className = 'announcement-ticker-banner';
        document.body.insertBefore(existingTicker, document.body.firstChild);
      }
      existingTicker.innerHTML = `<div class="ticker-wrap"><div class="ticker-item">${tickerText}</div></div>`;
      
      const header = document.querySelector('header');
      if (header) {
        header.style.top = '36px';
      }
      document.body.style.paddingTop = '36px';
    } else {
      if (existingTicker) {
        existingTicker.remove();
      }
      const header = document.querySelector('header');
      if (header) {
        header.style.top = '0';
      }
      document.body.style.paddingTop = '0';
    }
  }

  // 3. Maintenance mode check
  async function checkMaintenanceMode() {
    const maintenanceActive = (await DB.getSetting('maintenanceActive', 'false')) === 'true';
    const isBypassed = sessionStorage.getItem('maintenanceBypass') === 'true';
    const isControlPage = window.location.pathname.toLowerCase().includes('admin.html');
    
    // Check if lock screen already exists
    let existingLock = document.getElementById('visitor-maintenance-overlay');
    
    if (maintenanceActive && !isBypassed && !isControlPage) {
      if (!existingLock) {
        const customReason = await DB.getSetting('maintenanceReason', 'OnyxChat is currently optimizing and syncing local databases. Core services will resume shortly.');
        const overlay = document.createElement('div');
        overlay.id = 'visitor-maintenance-overlay';
        overlay.className = 'maintenance-overlay';
        overlay.innerHTML = `
          <div class="glass-panel maintenance-card">
            <div class="lock-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>System Under <span class="title-roman">Maintenance</span></h2>
            <p>${customReason}</p>
            <div class="maintenance-meta">
              <span>Database Nodes Syncing...</span>
              <div class="loader-bar"><div class="loader-bar-fill"></div></div>
            </div>
            <div style="margin-top: 1rem;">
              <button class="btn btn-secondary" id="admin-bypass-btn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; border-radius: 8px;">
                Admin Bypass
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        document.body.classList.add('maintenance-lock');

        const bypassBtn = document.getElementById('admin-bypass-btn');
        if (bypassBtn) {
          bypassBtn.addEventListener('click', async () => {
            const input = prompt("Enter Admin Password to Bypass Maintenance Mode:");
            if (!input) return;

            const utf8 = new TextEncoder().encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Sync password check with Firebase settings if present, otherwise default
            const correctHash = await DB.getSetting('adminHash', '006657998771eb1ef75d0a26f8824af99da8bf4f7261d3a4d896708286a618eb');

            if (hashed === correctHash) {
              sessionStorage.setItem('maintenanceBypass', 'true');
              sessionStorage.setItem('adminAuthorized', 'true');
              window.location.reload();
            } else {
              alert("Incorrect security password code. Access Denied!");
            }
          });
        }
      }
    } else {
      if (existingLock) {
        existingLock.remove();
        document.body.classList.remove('maintenance-lock');
      }
    }
  }

  // 4. Download distribution details sync
  async function syncDownloads() {
    const winBtn = document.getElementById('download-win-btn');
    const winVer = document.getElementById('download-win-ver');
    const mobBtn = document.getElementById('download-mob-btn');
    const mobVer = document.getElementById('download-mob-ver');

    const customWinLink = await DB.getSetting('downloadWinLink', 'https://github.com/beatlabs790/onyxchat/releases');
    const customWinVer = await DB.getSetting('downloadWinVersion', 'v1.0.0 Stable Build');
    const customMobLink = await DB.getSetting('downloadMobileLink', 'https://github.com/beatlabs790/onyxchat');
    const customMobVer = await DB.getSetting('downloadMobileVersion', 'Beta Channel');

    if (winBtn && customWinLink) winBtn.setAttribute('href', customWinLink);
    if (winVer && customWinVer) winVer.innerText = customWinVer;
    if (mobBtn && customMobLink) mobBtn.setAttribute('href', customMobLink);
    if (mobVer && customMobVer) mobVer.innerText = customMobVer;
  }

  // 5. FAQ section sync
  const defaultFAQs = [
    { q: "Is OnyxChat free?", a: "Yes, OnyxChat is 100% free and open source. There are no tracking scripts, ads, or paywalled items." },
    { q: "Where are messages stored?", a: "All messaging databases, files, and credentials reside purely on your physical hardware, fully encrypted with your keys." },
    { q: "Does it support group calls?", a: "OnyxChat supports high-definition encrypted audio/video calling for peer-to-peer contexts, with multi-peer channels in active beta." },
    { q: "How do I backup my chat log?", a: "You can export your database as an encrypted file container directly from the client Settings screen at any time." }
  ];

  async function syncFAQs() {
    const homeFaqGrid = document.getElementById('home-faq-container');
    const aboutFaqGrid = document.getElementById('about-faq-container');
    
    if (homeFaqGrid || aboutFaqGrid) {
      const list = await DB.getFAQs(defaultFAQs);
      
      if (homeFaqGrid) {
        homeFaqGrid.innerHTML = list.map(faq => `
          <div class="glass-card faq-card-item fade-in-scroll">
            <h3>${faq.q}</h3>
            <p>${faq.a}</p>
          </div>
        `).join('');
        
        // Observe newly injected elements so fade-in animations trigger correctly
        if (window.appearOnScroll) {
          homeFaqGrid.querySelectorAll('.fade-in-scroll').forEach(el => {
            window.appearOnScroll.observe(el);
          });
        }
      }
      
      if (aboutFaqGrid) {
        let aboutHtml = `<h2 style="padding-left:0.5rem; letter-spacing: -0.5px;">Frequently Asked Questions</h2>`;
        aboutHtml += list.map(faq => `
          <div class="glass-card faq-item fade-in-scroll">
            <h3>${faq.q}</h3>
            <p>${faq.a}</p>
          </div>
        `).join('');
        aboutFaqGrid.innerHTML = aboutHtml;
        
        // Observe newly injected elements so fade-in animations trigger correctly
        if (window.appearOnScroll) {
          aboutFaqGrid.querySelectorAll('.fade-in-scroll').forEach(el => {
            window.appearOnScroll.observe(el);
          });
        }
      }
    }
  }

  // 6. Release Timer Countdown
  let timerInterval = null;
  async function syncReleaseTimer() {
    const timerActive = (await DB.getSetting('releaseTimerActive', 'false')) === 'true';
    const timerDateStr = await DB.getSetting('releaseTimerDate', '');
    const countdownContainer = document.getElementById('release-countdown-container');

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (timerActive && timerDateStr && countdownContainer) {
      const targetTime = new Date(timerDateStr).getTime();
      countdownContainer.style.display = 'block';

      const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetTime - now;
        
        if (distance < 0) {
          countdownContainer.innerHTML = "<div class='countdown-expired'>Release Available Now!</div>";
          if (timerInterval) clearInterval(timerInterval);
          return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const dEl = document.getElementById('days');
        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('minutes');
        const sEl = document.getElementById('seconds');

        if (dEl) dEl.innerText = String(days).padStart(2, '0');
        if (hEl) hEl.innerText = String(hours).padStart(2, '0');
        if (mEl) mEl.innerText = String(minutes).padStart(2, '0');
        if (sEl) sEl.innerText = String(seconds).padStart(2, '0');
      };

      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);
    } else if (countdownContainer) {
      countdownContainer.style.display = 'none';
    }
  }

  // Async Settings Initializer
  async function initAllSettings() {
    await applyThemeColors();
    await syncTicker();
    await checkMaintenanceMode();
    await syncDownloads();
    await syncFAQs();
    await syncReleaseTimer();
  }
  initAllSettings();

  // --- 7. Developers SDK Tab selectors ---
  const tabNode = document.getElementById('tab-node');
  const tabPython = document.getElementById('tab-python');
  const tabRust = document.getElementById('tab-rust');

  const codeNode = document.getElementById('code-node');
  const codePython = document.getElementById('code-python');
  const codeRust = document.getElementById('code-rust');

  if (tabNode && tabPython && tabRust && codeNode && codePython && codeRust) {
    const tabs = [tabNode, tabPython, tabRust];
    const codes = [codeNode, codePython, codeRust];

    function activateTab(activeTab, activeCode) {
      tabs.forEach(t => {
        t.style.opacity = '0.5';
        t.style.borderBottom = 'none';
        t.style.color = 'var(--text-secondary)';
        t.style.fontWeight = 'normal';
      });
      codes.forEach(c => {
        c.style.display = 'none';
      });

      activeTab.style.opacity = '1';
      activeTab.style.borderBottom = '2px solid var(--primary)';
      activeTab.style.color = 'var(--text-primary)';
      activeTab.style.fontWeight = '600';
      activeCode.style.display = 'block';
    }

    tabNode.addEventListener('click', () => activateTab(tabNode, codeNode));
    tabPython.addEventListener('click', () => activateTab(tabPython, codePython));
    tabRust.addEventListener('click', () => activateTab(tabRust, codeRust));
  }

  // Listen to Firebase Cloud changes in real-time across visitors worldwide!
  if (DB.db) {
    DB.db.ref('settings').on('child_changed', (snapshot) => {
      const key = snapshot.key;
      const val = snapshot.val();
      localStorage.setItem(key, val);
      
      if (['themePrimary', 'themeSecondary', 'themeAccent', 'themeGlowOpacity'].includes(key)) {
        applyThemeColors();
      } else if (['tickerActive', 'tickerText'].includes(key)) {
        syncTicker();
      } else if (['maintenanceActive', 'maintenanceReason'].includes(key)) {
        checkMaintenanceMode();
      } else if (['downloadWinLink', 'downloadWinVersion', 'downloadMobileLink', 'downloadMobileVersion'].includes(key)) {
        syncDownloads();
      } else if (['releaseTimerActive', 'releaseTimerDate'].includes(key)) {
        syncReleaseTimer();
      }
    });

    DB.db.ref('faqs').on('value', () => {
      syncFAQs();
    });
  }
});
