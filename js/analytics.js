(() => {
    const measurementId = String(window.SITE_CONFIG?.analyticsMeasurementId || '').trim();
    const configured = /^G-[A-Z0-9]+$/i.test(measurementId);

    const sanitizeParams = (params) => Object.fromEntries(
        Object.entries(params || {})
            .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
            .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 160) : value])
    );

    window.SiteAnalytics = {
        configured,
        track(name, params = {}) {
            if (!configured || typeof window.gtag !== 'function') return;
            window.gtag('event', name, sanitizeParams(params));
        }
    };

    // A blank ID keeps local previews and forks completely network-free.
    if (!configured) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = () => {
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            anonymize_ip: true,
            cookie_flags: 'SameSite=Lax;Secure'
        });
    };
    document.head.appendChild(script);

    const trackInteractions = () => {
        document.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target.closest('a[href], button') : null;
            if (!target) return;

            const projectCard = target.closest('.project-card');
            if (projectCard?.dataset.id) {
                window.SiteAnalytics.track('project_interaction', { project_id: projectCard.dataset.id });
            }

            if (target.matches('a[href]')) {
                const href = target.href;
                if (!href || !/^https?:$/i.test(new URL(href).protocol)) return;
                if (new URL(href, window.location.href).origin === window.location.origin) return;
                window.SiteAnalytics.track('outbound_click', {
                    link_domain: new URL(href).hostname,
                    link_url: href
                });
            }
        }, { passive: true });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackInteractions, { once: true });
    } else {
        trackInteractions();
    }
})();
