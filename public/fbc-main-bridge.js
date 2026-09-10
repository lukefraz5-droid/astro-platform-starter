/* Same-origin bridge. No contacts are uploaded or sent to a texting gateway. */
(() => {
  'use strict';
  if (window.__fbcMainBridgeInstalled) return;
  window.__fbcMainBridgeInstalled = true;
  const origin = new URL(document.baseURI).origin;
  let frame = null;
  const normalize = IT.helpers.normalize;
  function boot() {
    return {
      dataReady: true,
      contacts: IT.helpers.directory(),
      blocked: [...IT.helpers.blockedPhones()],
      mainExclusions: FU.textingExclusions(),
      updated: 'Main database in this browser',
      initialMessage: String(IT.state.message || '').slice(0, 2000),
      initialManual: String(IT.state.manual || '').slice(0, 20000),
      initialSelected: [...IT.state.selected],
    };
  }
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== origin) return;
    const message = event.data;
    if (!message || typeof message !== 'object') return;
    if (message.type === 'fbc-texting-ready') {
      frame.contentWindow.postMessage({type:'fbc-main-data', payload:boot()}, origin);
    } else if (message.type === 'fbc-text-exclusions') {
      if (!Array.isArray(message.numbers) || message.numbers.length > 2000 || message.numbers.some(n => typeof n !== 'string' || !normalize(n))) return;
      const saved = FU.setTextingExclusions(message.numbers);
      frame.contentWindow.postMessage({type:'fbc-exclusions-saved', saved:!!saved}, origin);
      if (!saved) toast('Exclusions apply now, but saving failed. Back up the main database before closing.');
    } else if (message.type === 'fbc-text-draft') {
      if (typeof message.message !== 'string' || typeof message.manual !== 'string' || !Array.isArray(message.selected)) return;
      IT.state.message = message.message.slice(0,2000);
      IT.state.manual = message.manual.slice(0,20000);
      IT.state.selected = new Set(message.selected.slice(0,2000).map(normalize).filter(Boolean));
    } else if (message.type === 'fbc-open-followups') {
      show('deposit-followups');
    } else if (message.type === 'fbc-export-backup') {
      exportBackup();
    }
  });
  IT.render = () => {
    const content = document.querySelector('#content');
    content.replaceChildren();
    frame = document.createElement('iframe');
    frame.title = 'Parent texting - connected to the main FBC database';
    frame.src = new URL('/fbc-embedded', document.baseURI).href;
    frame.allow = 'clipboard-write';
    frame.style.cssText = 'display:block;width:100%;height:max(700px,calc(100dvh - 180px));border:1px solid #394337;border-radius:16px;background:#f7f6f2';
    const note = document.createElement('p');
    note.textContent = 'Texting uses the verified parent contacts and do-not-contact rules in this main database. Your iPhone still performs the sends.';
    note.style.cssText = 'font-size:12px;line-height:1.6;color:#a7b49f;margin:0 0 12px';
    content.append(note, frame);
  };
  const initial = window.FBC_INITIAL_VIEW;
  show(typeof initial === 'string' && Object.prototype.hasOwnProperty.call(views, initial) ? initial : 'overview');
})();
