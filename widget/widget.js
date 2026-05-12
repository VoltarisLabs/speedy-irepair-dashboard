/**
 * Speedy iRepair — Chat + Voice Widget
 * Drops a floating "Talk to Jess" button on the page. Default = text chat.
 * "Call instead" switches to web call via Retell.
 *
 * Embed:
 *   <script src="https://YOUR-DOMAIN/widget/widget.js" defer></script>
 */
(function () {
  const CHAT_URL = window.SPEEDY_WIDGET_CHAT_URL ||
    'https://n8n.srv1236458.hstgr.cloud/webhook/speedy-chat';
  const TOKEN_URL = window.SPEEDY_WIDGET_TOKEN_URL ||
    'https://n8n.srv1236458.hstgr.cloud/webhook/speedy-web-token';
  const RETELL_SDK_URL = 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.7/+esm';

  const ACCENT = '#0080FF';
  const ACCENT2 = '#4F1AD6';

  // ---------- styles ----------
  const css = `
    .spd-btn{position:fixed;right:24px;bottom:24px;z-index:2147483647;
      width:64px;height:64px;border-radius:32px;border:none;cursor:pointer;
      background:linear-gradient(135deg,${ACCENT},${ACCENT2});color:#fff;
      box-shadow:0 8px 24px rgba(0,0,0,.25),0 2px 8px rgba(0,128,255,.4);
      display:flex;align-items:center;justify-content:center;
      transition:transform .2s ease, box-shadow .2s ease;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    .spd-btn:hover{transform:scale(1.08);box-shadow:0 12px 28px rgba(0,0,0,.32),0 4px 12px rgba(0,128,255,.5);}
    .spd-btn svg{width:28px;height:28px;}
    .spd-btn.active{background:#dc2626;animation:spd-pulse 2s infinite;}
    @keyframes spd-pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6);}50%{box-shadow:0 0 0 16px rgba(220,38,38,0);}}

    .spd-panel{position:fixed;right:24px;bottom:104px;z-index:2147483646;
      width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 140px);
      background:#0a0a0f;color:#fff;border:1px solid rgba(255,255,255,.08);
      border-radius:16px;display:none;flex-direction:column;overflow:hidden;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      box-shadow:0 16px 40px rgba(0,0,0,.4);}
    .spd-panel.show{display:flex;}

    .spd-head{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);
      display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
    .spd-head h3{margin:0;font-size:14px;font-weight:600;}
    .spd-head .sub{margin:2px 0 0 0;font-size:11px;color:#71717a;}
    .spd-head-actions{display:flex;gap:8px;}
    .spd-icon-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);
      color:#fff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;
      display:inline-flex;align-items:center;gap:6px;transition:background .15s;
      font-family:inherit;}
    .spd-icon-btn:hover{background:rgba(255,255,255,.12);}
    .spd-icon-btn svg{width:14px;height:14px;}
    .spd-icon-btn.danger{background:#dc2626;border-color:#dc2626;}
    .spd-icon-btn.danger:hover{background:#b91c1c;}

    .spd-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
    .spd-msg{max-width:80%;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.45;
      word-wrap:break-word;}
    .spd-msg.jess{background:#1f1f29;color:#fff;align-self:flex-start;border-top-left-radius:4px;}
    .spd-msg.user{background:linear-gradient(135deg,${ACCENT},${ACCENT2});color:#fff;
      align-self:flex-end;border-top-right-radius:4px;}
    .spd-typing{align-self:flex-start;background:#1f1f29;padding:10px 14px;border-radius:14px;
      border-top-left-radius:4px;display:inline-flex;gap:4px;}
    .spd-typing span{width:6px;height:6px;border-radius:50%;background:#71717a;
      animation:spd-bounce 1.4s infinite;}
    .spd-typing span:nth-child(2){animation-delay:.2s;}
    .spd-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes spd-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}

    .spd-foot{padding:10px 12px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;
      display:flex;gap:8px;align-items:flex-end;}
    .spd-input{flex:1;background:#1f1f29;border:1px solid rgba(255,255,255,.08);
      border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;font-family:inherit;
      resize:none;max-height:80px;min-height:36px;line-height:1.4;}
    .spd-input:focus{outline:none;border-color:${ACCENT};}
    .spd-send{background:linear-gradient(135deg,${ACCENT},${ACCENT2});color:#fff;border:none;
      border-radius:10px;width:36px;height:36px;cursor:pointer;display:flex;
      align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;}
    .spd-send:hover{opacity:.85;}
    .spd-send:disabled{opacity:.4;cursor:not-allowed;}
    .spd-send svg{width:16px;height:16px;}

    /* call view */
    .spd-call{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:20px;text-align:center;}
    .spd-call h4{margin:8px 0 4px 0;font-size:15px;}
    .spd-call .state{font-size:12px;color:#a1a1aa;margin:0 0 16px 0;}
    .spd-call .meter{width:80%;height:4px;border-radius:2px;background:rgba(255,255,255,.08);
      overflow:hidden;margin:10px 0;}
    .spd-call .meter > i{display:block;height:100%;width:0%;background:${ACCENT};transition:width .15s linear;}
    .spd-call .timer{font-size:13px;color:#a1a1aa;font-variant-numeric:tabular-nums;margin:8px 0;}
    .spd-call .err{color:#f87171;font-size:12px;margin-top:8px;display:none;}

    .spd-banner{font-size:11px;color:#a1a1aa;text-align:center;padding:6px;
      background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.04);}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- DOM ----------
  const btn = document.createElement('button');
  btn.className = 'spd-btn';
  btn.title = 'Speedy iRepair — chat or call';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.className = 'spd-panel';
  panel.innerHTML = `
    <div class="spd-head">
      <div>
        <h3>Speedy iRepair</h3>
        <p class="sub" id="spd-sub">Chat with Jess</p>
      </div>
      <div class="spd-head-actions" id="spd-actions">
        <button class="spd-icon-btn" id="spd-call-btn" title="Call Jess instead">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Call
        </button>
      </div>
    </div>

    <div class="spd-body" id="spd-chat-body">
      <div class="spd-msg jess">Hey, Jess from Speedy iRepair here. What's going on with the phone?</div>
    </div>

    <div class="spd-call" id="spd-call-view" style="display:none;">
      <h4 id="spd-call-state">Connecting...</h4>
      <p class="state" id="spd-call-sub">Setting up the call</p>
      <div class="meter"><i id="spd-meter"></i></div>
      <p class="timer" id="spd-timer">00:00</p>
      <p class="err" id="spd-err"></p>
    </div>

    <div class="spd-foot" id="spd-chat-foot">
      <textarea class="spd-input" id="spd-input" rows="1" placeholder="Type a message..." autocomplete="off"></textarea>
      <button class="spd-send" id="spd-send" title="Send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  const $body = panel.querySelector('#spd-chat-body');
  const $foot = panel.querySelector('#spd-chat-foot');
  const $input = panel.querySelector('#spd-input');
  const $send = panel.querySelector('#spd-send');
  const $sub = panel.querySelector('#spd-sub');
  const $callView = panel.querySelector('#spd-call-view');
  const $callBtn = panel.querySelector('#spd-call-btn');
  const $callState = panel.querySelector('#spd-call-state');
  const $callSub = panel.querySelector('#spd-call-sub');
  const $meter = panel.querySelector('#spd-meter');
  const $timer = panel.querySelector('#spd-timer');
  const $err = panel.querySelector('#spd-err');

  // ---------- chat state ----------
  // messages = full conversation (excluding system prompt — that lives server-side)
  const messages = [];
  let chatBusy = false;

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function linkify(text) {
    // URL regex — http(s):// or bare domain.tld/...
    const urlRe = /(\bhttps?:\/\/[^\s<>"']+|\b(?:speedyirepair\.com|reusely\.com)[^\s<>"']*)/g;
    return escapeHTML(text).replace(urlRe, function (raw) {
      const href = /^https?:\/\//.test(raw) ? raw : 'https://' + raw;
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:#7ab8ff;text-decoration:underline;">' + raw + '</a>';
    });
  }
  function appendMsg(role, text) {
    const div = document.createElement('div');
    div.className = 'spd-msg ' + (role === 'user' ? 'user' : 'jess');
    if (role === 'jess') {
      div.innerHTML = linkify(text);
    } else {
      div.textContent = text;
    }
    $body.appendChild(div);
    $body.scrollTop = $body.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'spd-typing';
    div.id = 'spd-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    $body.appendChild(div);
    $body.scrollTop = $body.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('spd-typing');
    if (t) t.remove();
  }

  async function sendMessage() {
    if (chatBusy) return;
    const text = $input.value.trim();
    if (!text) return;
    $input.value = '';
    autoResize();
    $send.disabled = true;
    chatBusy = true;

    appendMsg('user', text);
    messages.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages })
      });
      hideTyping();
      if (!res.ok) throw new Error('Chat endpoint returned ' + res.status);
      const data = await res.json();

      const assistantText = data.assistant_message || 'Sorry, I lost that one — try again?';
      appendMsg('jess', assistantText);

      // Server returns the canonical messages list (incl. tool messages). Use it as our
      // new ground truth so the next turn carries tool_call_id context properly.
      if (Array.isArray(data.messages)) {
        messages.length = 0;
        for (let i = 0; i < data.messages.length; i++) messages.push(data.messages[i]);
      } else {
        messages.push({ role: 'assistant', content: assistantText });
      }
    } catch (e) {
      hideTyping();
      appendMsg('jess', "Hmm, my system hiccuped. Try again or tap Call to ring the shop.");
    } finally {
      $send.disabled = false;
      chatBusy = false;
      $input.focus();
    }
  }

  function autoResize() {
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, 80) + 'px';
  }

  $input.addEventListener('input', autoResize);
  $input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  $send.addEventListener('click', sendMessage);

  // ---------- voice (Retell) ----------
  let sdkPromise;
  function loadSDK() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = (async function () {
      const mod = await import(/* @vite-ignore */ RETELL_SDK_URL);
      const RetellWebClient = mod.RetellWebClient || (mod.default && mod.default.RetellWebClient);
      if (!RetellWebClient) throw new Error('Retell SDK loaded but RetellWebClient export missing.');
      return RetellWebClient;
    })();
    return sdkPromise;
  }

  let client = null;
  let callActive = false;
  let startedAt = 0;
  let tickHandle = 0;

  function setCallState(text, subtext, isErr) {
    $callState.textContent = text;
    if (subtext != null) $callSub.textContent = subtext;
    $err.style.display = isErr ? 'block' : 'none';
    if (isErr) $err.textContent = text;
  }

  function tick() {
    const ms = Date.now() - startedAt;
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    $timer.textContent = mm + ':' + ss;
  }

  function showCallView() {
    $body.style.display = 'none';
    $foot.style.display = 'none';
    $callView.style.display = 'flex';
    $sub.textContent = 'On a call with Jess';
    $callBtn.classList.add('danger');
    $callBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Hang up`;
  }

  function showChatView() {
    $body.style.display = 'flex';
    $foot.style.display = 'flex';
    $callView.style.display = 'none';
    $sub.textContent = 'Chat with Jess';
    $callBtn.classList.remove('danger');
    $callBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call`;
    btn.classList.remove('active');
  }

  console.log('[Speedy] widget.js build 2026-05-12-v7 (Reusely trade-in + clickable links)');

  function markActive() {
    if (callActive) return;
    callActive = true;
    btn.classList.add('active');
    startedAt = Date.now();
    if (!tickHandle) tickHandle = setInterval(tick, 250);
    setCallState('Connected', 'Talk to Jess — she can hear you');
    console.log('[Speedy] UI Connected');
  }

  // Persistent AudioContext to keep Safari audio unlocked across the session
  let _audioCtx = null;

  async function startCall() {
    console.log('[Speedy] startCall() invoked');
    showCallView();
    setCallState('Connecting...', 'Setting up audio');

    // ===== CRITICAL Safari fix: unlock audio in user gesture BEFORE any awaits =====
    // Safari blocks WebRTC audio playback unless an AudioContext has been resumed
    // inside a user gesture. We do this synchronously before any await.
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new Ctx();
        if (_audioCtx.state === 'suspended') {
          // resume() returns a promise but we kick it off here while gesture is active
          _audioCtx.resume().then(
            () => console.log('[Speedy] AudioContext resumed, state=', _audioCtx.state),
            (e) => console.log('[Speedy] AudioContext resume failed', e)
          );
        }
        console.log('[Speedy] AudioContext primed, state=', _audioCtx.state);
      }
    } catch (e) {
      console.log('[Speedy] AudioContext setup err', e);
    }

    // Play a silent sound to fully unlock audio (Safari trick)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      audio.volume = 0.01;
      audio.play().catch(() => {});
    } catch (e) {}

    // === mic ===
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      console.log('[Speedy] mic OK');
    } catch (e) {
      console.log('[Speedy] mic FAIL', e);
      endCall(e.name === 'NotAllowedError' ? 'Mic blocked' : 'Mic error: ' + e.message, 'Allow mic in browser settings', true);
      return;
    }

    // === SDK ===
    let RetellWebClient;
    try {
      const mod = await import(/* @vite-ignore */ RETELL_SDK_URL);
      RetellWebClient = mod.RetellWebClient || (mod.default && mod.default.RetellWebClient);
      if (!RetellWebClient) throw new Error('SDK export missing');
      console.log('[Speedy] SDK loaded');
    } catch (e) {
      console.log('[Speedy] SDK FAIL', e);
      endCall('SDK load failed', null, true);
      return;
    }

    // === token ===
    let accessToken;
    try {
      const res = await fetch(TOKEN_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      accessToken = data.access_token;
      if (!accessToken) throw new Error('No token');
      console.log('[Speedy] token OK');
    } catch (e) {
      console.log('[Speedy] token FAIL', e);
      endCall('Token failed', null, true);
      return;
    }

    // === client + listeners (forEach pattern matching minimal test) ===
    client = new RetellWebClient();
    const events = ['call_started', 'call_ready', 'call_ended', 'agent_start_talking', 'agent_stop_talking',
                    'audio', 'update', 'metadata', 'node_transition', 'error'];
    events.forEach(evt => {
      client.on(evt, (...args) => {
        console.log('[Speedy] SDK:', evt);
        if (evt === 'call_ended') { endCall('Call ended', 'Tap Call to talk again'); return; }
        if (evt === 'error') {
          const emsg = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].message) || 'unknown';
          endCall('Error: ' + emsg, null, true); return;
        }
        if (evt === 'agent_start_talking') $meter.style.width = '100%';
        if (evt === 'agent_stop_talking') $meter.style.width = '0%';
        markActive();
      });
    });

    // === poll backstop ===
    let pollCount = 0;
    const poll = setInterval(() => {
      pollCount++;
      if (pollCount > 60 || callActive) { clearInterval(poll); return; }
      if (client && client.connected === true) {
        console.log('[Speedy] poll: connected=true');
        clearInterval(poll);
        markActive();
      }
    }, 500);

    // === startCall ===
    setCallState('Connecting...', 'Joining call');
    console.log('[Speedy] >>> startCall');
    try {
      const t1 = Date.now();
      await client.startCall({ accessToken });
      console.log('[Speedy] <<< startCall', Date.now() - t1, 'ms connected=', client.connected);
      if (client.connected === true) markActive();

      // === Safari: explicit audio playback (REQUIRED) ===
      if (typeof client.startAudioPlayback === 'function') {
        try {
          await client.startAudioPlayback();
          console.log('[Speedy] startAudioPlayback OK');
        } catch (e) {
          console.log('[Speedy] startAudioPlayback err', e);
        }
      }
    } catch (e) {
      console.log('[Speedy] startCall threw', e);
      clearInterval(poll);
      endCall('Connection failed', null, true);
    }
  }

  function endCall(msg, sub, isErr) {
    if (client) { try { client.stopCall(); } catch (e) {} client = null; }
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = 0;
    callActive = false;
    $meter.style.width = '0%';
    setCallState(msg || 'Call ended', sub || '', !!isErr);
    setTimeout(showChatView, 1500);
  }

  $callBtn.addEventListener('click', function () {
    if (callActive) {
      endCall('Hung up', 'Back to chat');
    } else {
      startCall();
    }
  });

  // ---------- main button (open/close panel) ----------
  btn.addEventListener('click', function () {
    if (panel.classList.contains('show')) {
      // If currently in a call, hang up before closing.
      if (callActive) endCall('Hung up', 'Back to chat');
      panel.classList.remove('show');
    } else {
      panel.classList.add('show');
      setTimeout(function () { $input.focus(); }, 100);
    }
  });
})();
