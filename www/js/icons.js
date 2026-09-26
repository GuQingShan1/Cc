(function (root) {
    const CS = (root.CS = root.CS || {});
    const wrap = (body, extra) =>
        `<svg class="ic${extra ? ' ' + extra : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

    const paths = {
        plus: '<path d="M12 5v14M5 12h14"/>',
        check: '<path d="M5 12.5l4.2 4.3L19 7"/>',
        trash: '<path d="M4 7h16M9 7V4.5h6V7M7 7l1 13h8l1-13"/>',
        edit: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z"/><path d="M13.5 7l3.5 3.5"/>',
        clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        repeat: '<path d="M4 10a6 6 0 0 1 6-6h8m0 0-3-3m3 3-3 3M20 14a6 6 0 0 1-6 6H6m0 0 3 3m-3-3 3-3"/>',
        chevronLeft: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
        chevronRight: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
        close: '<path d="M6 6l12 12M18 6 6 18"/>',
        today: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3.5V6M16 3.5V6"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/>',
        calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3.5V6M16 3.5V6M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
        lotus: '<path d="M12 20c-4.5 0-8-2.5-8-6 2.2.4 4 1.4 5 2.6C8.2 14 8.5 10.5 12 8c3.5 2.5 3.8 6 3 8.6 1-1.2 2.8-2.2 5-2.6 0 3.5-3.5 6-8 6z"/><path d="M12 8c-.8-2-.8-3.7 0-5 .8 1.3.8 3 0 5z"/>',
        qi: '<path d="M12 3.5c3 2.6 3 6.4 0 9-3-2.6-3-6.4 0-9z"/><path d="M6.5 11.5c2.6 3 6.4 3 9 0-2.6-3-6.4-3-9 0z" opacity=".7"/><path d="M12 12.5c3 2.6 3 6.4 0 9-3-2.6-3-6.4 0-9z" opacity=".5"/>',
        flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3 2-5 3.5-7.5.5 1.8 1.4 2.8 2.5 3.5.3-3 1.5-5.5 3.5-7.5 0 3 1.5 4.5 2.5 6.5.8 1.6 1 3 1 4.5 0 3.7-2.6 6.5-6.5 6.5z"/>',
        lightning: '<path d="M13 2.5 5.5 13.5H12l-1 8 7.5-11H12l1-8z"/>',
        body: '<circle cx="12" cy="5" r="2"/><path d="M12 7.5v5.5M8 10l4-1.5 4 1.5M12 13l-3 7.5M12 13l3 7.5"/>',
        mind: '<path d="M8 4.5A4 4 0 0 1 12 6a4 4 0 0 1 4-1.5 3.8 3.8 0 0 1 3.5 4c0 1.4-.6 2.4-1.5 3.2.9.7 1.5 1.7 1.5 3 0 2.2-1.8 3.8-4 3.8H8.5C6.3 18.5 4.5 17 4.5 14.8c0-1.3.6-2.3 1.5-3-.9-.8-1.5-1.8-1.5-3.2a3.8 3.8 0 0 1 3.5-4z"/><path d="M12 6v12.5"/>',
        spirit: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17c-2.3-2.3-2.3-6.2 0-8.5 2.3-2.3 2.3-6.2 0-8.5z"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.2" r="1" fill="currentColor" stroke="none"/>',
        mundane: '<path d="M4 20V10.5l8-6 8 6V20"/><path d="M10 20v-5h4v5"/>',
        seal: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 9h8M8 12.5h8M8 16h5"/>',
        scroll: '<path d="M6 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2v-13z"/><path d="M6 4.5a2 2 0 0 0-2 2v1.5h4M9.5 9h6M9.5 12.5h6"/>',
        dawn: '<path d="M3.5 17h17M12 13a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4zM12 5v3M6 8l2 2M18 8l-2 2"/>',
        morning: '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
        noon: '<circle cx="12" cy="12" r="5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
        afternoon: '<circle cx="14" cy="10" r="4"/><path d="M3.5 18h17M6 14h4"/>',
        dusk: '<path d="M3.5 16h17M8 16a4 4 0 0 1 8 0"/><path d="M12 5v3M5.5 9l1.5 1.5M18.5 9 17 10.5" opacity=".7"/>',
        night: '<path d="M14.5 3.5a8.5 8.5 0 1 0 6 12.4A7 7 0 0 1 14.5 3.5z"/><path d="M6 6.5l.5 1.2 1.2.5-1.2.5L6 9.9l-.5-1.2-1.2-.5 1.2-.5z" fill="currentColor" stroke="none"/>',
        dots: '<circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
        gate: '<path d="M4 8h16M6 8V20M18 8V20M4 8l2-3h12l2 3M9 20v-6h6v6"/>',
        star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/>',
    };

    CS.icon = (name, extra) => wrap(paths[name] || paths.dots, extra);
    CS.iconNames = Object.keys(paths);
})(typeof window !== 'undefined' ? window : globalThis);
