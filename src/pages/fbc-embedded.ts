import type { APIRoute } from 'astro';
import template from './fbc.astro?raw';
export const prerender = false;

function embeddedPage(): string {
  let html = template.replace(/^---[\s\S]*?---\s*/, '');
  html = html.replace('This page uses a saved contact snapshot, not a live connection to your master database.', 'This screen uses the parent contacts in the main database you have opened.');
  html = html.replaceAll('Do-not-contact list on this device', 'Do-not-contact list in the main database');
  html = html.replace('Saved only in this browser, not synced with your master database. Record opt-outs there too.', 'Saved with the main follow-up workspace and included in its JSON backups. Other devices are not synchronized automatically.');
  html = html.replace('This website does not send by itself or read Messages.', 'Connected to your open main database. Your iPhone performs the sends.');
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_match, attributes, source) => {
    if (attributes.includes('application/json')) return '<script id="fbc-snapshot" type="application/json">{}</script>';
    let code = source.replaceAll('fbc-texts-v1-session', 'fbc-main-texts-v23-session');
    code = code.replace('window.FBCTextTests={normalize,recipients,payload};', 'window.FBCTextTests={normalize,recipients,payload};window.FBCIntegratedState=()=>({message:$("#message").value,manual:$("#manual").value,selected:[...selected]});');
    code = code.replace('Exclusions saved on this device. Update your master database too.', 'Exclusion update requested. The main database will confirm the save.');
    return '<script>' + `(function(){
      'use strict';
      const origin = location.origin;
      let started = false;
      window.addEventListener('message', function(event){
        if(event.source !== parent || event.origin !== origin) return;
        const message = event.data;
        if(!message || typeof message !== 'object') return;
        if(message.type === 'fbc-exclusions-saved'){
          const line = document.querySelector('#last-status');
          if(line) line.textContent = message.saved ? 'Exclusions saved with the main database. Include them in your next JSON backup.' : 'Main database saving failed. Keep this page open and back up before closing.';
          return;
        }
        if(started || message.type !== 'fbc-main-data') return;
        const input = message.payload;
        if(!input || !Array.isArray(input.contacts) || input.contacts.length>5000 || !Array.isArray(input.blocked) || !Array.isArray(input.mainExclusions)) return;
        if(input.contacts.some(c=>!c || typeof c.phone!=='string' || !Array.isArray(c.names) || !Array.isArray(c.players) || !Array.isArray(c.grades))) return;
        started = true;
        document.querySelector('#fbc-snapshot').textContent = JSON.stringify(input);
        const nativeLocal = window.localStorage;
        const nativeSession = window.sessionStorage;
        const localStorage = {
          getItem(key){return key==='fbc-texts-v1-exclusions' ? JSON.stringify(input.mainExclusions) : nativeLocal.getItem(key);},
          setItem(key,value){if(key==='fbc-texts-v1-exclusions'){parent.postMessage({type:'fbc-text-exclusions',numbers:JSON.parse(value)},origin);}else nativeLocal.setItem(key,value);}
        };
        const sessionStorage = {
          getItem(key){
            if(key!=='fbc-main-texts-v23-session') return nativeSession.getItem(key);
            let previous={};try{previous=JSON.parse(nativeSession.getItem(key)||'{}')||{};}catch{}
            return JSON.stringify({...previous,message:input.initialMessage||'',manual:input.initialManual||'',selected:input.initialSelected||[]});
          },
          setItem(key,value){nativeSession.setItem(key,value);}
        };
        ${code}
        function shareDraft(){queueMicrotask(function(){if(window.FBCIntegratedState)parent.postMessage({type:'fbc-text-draft',...window.FBCIntegratedState()},origin);});}
        document.addEventListener('input',shareDraft);document.addEventListener('change',shareDraft);document.addEventListener('click',shareDraft);
        const actions=document.querySelector('.data-actions');
        if(actions){
          const backup=document.createElement('button');backup.type='button';backup.textContent='Back up main database';backup.onclick=()=>parent.postMessage({type:'fbc-export-backup'},origin);actions.append(backup);
          const follow=document.createElement('button');follow.type='button';follow.textContent='Main deposit follow-ups';follow.onclick=()=>parent.postMessage({type:'fbc-open-followups'},origin);actions.append(follow);
        }
      });
      if(parent!==window) parent.postMessage({type:'fbc-texting-ready'},origin);
      else {const note=document.querySelector('#initial-notice');if(note)note.textContent='Open this texting screen from the main FBC database menu to load your contacts.';}
    })();` + '</script>';
  });
  return html;
}
export const GET: APIRoute = () => new Response(embeddedPage(), {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Netlify-CDN-Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'}});
