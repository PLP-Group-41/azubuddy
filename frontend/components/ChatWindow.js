// frontend/components/ChatWindow.js
const app = document.getElementById('app');

let chats = JSON.parse(localStorage.getItem('azubuddy_chats')) || [];
let currentChatId = localStorage.getItem('azubuddy_current_chat') || null;
let isStreaming = false;

// --- State Management ---
function getCurrentChat() {
  return chats.find(c => c.id === currentChatId);
}

function initState() {
  if (!currentChatId || !getCurrentChat()) {
    if (chats.length === 0) {
      currentChatId = `chat_${Date.now()}`;
      chats.unshift({ id: currentChatId, title: 'New Chat', messages: [] });
    } else {
      currentChatId = chats[0].id;
    }
    saveState();
  }
  render();
}

function saveState() {
  localStorage.setItem('azubuddy_chats', JSON.stringify(chats));
  localStorage.setItem('azubuddy_current_chat', currentChatId);
}

function createNewChat() {
  if (isStreaming) return;
  const current = getCurrentChat();
  if (current && current.messages.length === 0) return; 
  
  currentChatId = `chat_${Date.now()}`;
  chats.unshift({ id: currentChatId, title: 'New Chat', messages: [] });
  saveState();
  render();
}

function switchChat(id) {
  if (isStreaming) return;
  currentChatId = id;
  saveState();
  render();
}

// --- Incremental JSON Parsing ---
function extractStringField(buf, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*"`);
  const m = re.exec(buf);
  if (!m) return { found: false, value: '', complete: false };
  let i = m.index + m[0].length;
  let value = '';
  while (i < buf.length) {
    const ch = buf[i];
    if (ch === '\\') {
      if (i + 1 >= buf.length) return { found: true, value, complete: false };
      const next = buf[i + 1];
      if (next === 'u') {
        if (i + 5 >= buf.length) return { found: true, value, complete: false };
        value += String.fromCharCode(parseInt(buf.slice(i + 2, i + 6), 16));
        i += 6;
      } else {
        const map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/' };
        value += map[next] ?? next;
        i += 2;
      }
    } else if (ch === '"') {
      return { found: true, value, complete: true };
    } else {
      value += ch;
      i++;
    }
  }
  return { found: true, value, complete: false };
}

function extractStringArray(buf, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*\\[`);
  const m = re.exec(buf);
  if (!m) return { found: false, values: [], complete: false };
  let i = m.index + m[0].length;
  const values = [];
  while (i < buf.length) {
    while (i < buf.length && /[\s,]/.test(buf[i])) i++;
    if (i >= buf.length) return { found: true, values, complete: false };
    if (buf[i] === ']') return { found: true, values, complete: true };
    if (buf[i] !== '"') return { found: true, values, complete: false };
    i++; 
    let value = '';
    let closed = false;
    while (i < buf.length) {
      const ch = buf[i];
      if (ch === '\\') {
        if (i + 1 >= buf.length) return { found: true, values, complete: false };
        const next = buf[i + 1];
        if (next === 'u') {
          if (i + 5 >= buf.length) return { found: true, values, complete: false };
          value += String.fromCharCode(parseInt(buf.slice(i + 2, i + 6), 16));
          i += 6;
        } else {
          const map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/' };
          value += map[next] ?? next;
          i += 2;
        }
      } else if (ch === '"') {
        closed = true;
        i++;
        break;
      } else {
        value += ch;
        i++;
      }
    }
    if (!closed) return { found: true, values, complete: false };
    values.push(value);
  }
  return { found: true, values, complete: false };
}

function updateFields(msg) {
  const exp = extractStringField(msg.raw, 'explanation');
  if (exp.found) msg.explanation = exp.value;
  const ex = extractStringField(msg.raw, 'african_example');
  if (ex.found) msg.african_example = ex.value;
  const why = extractStringField(msg.raw, 'why_it_matters');
  if (why.found) msg.why_it_matters = why.value;
  const fu = extractStringArray(msg.raw, 'follow_ups');
  if (fu.found) msg.followUps = fu.values;
}

// --- Rendering Helpers ---
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '<br>');
}
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bubbleHtml(msg) {
  if (msg.error) return `<span style="color:#b00020">Error: ${escapeHtml(msg.error)}</span>`;
  const parts = [];
  if (msg.explanation) parts.push(`<strong>${escapeHtml(msg.explanation)}</strong>`);
  if (msg.african_example) parts.push(escapeHtml(msg.african_example));
  if (msg.why_it_matters) parts.push(`<em>${escapeHtml(msg.why_it_matters)}</em>`);
  
  let html = parts.join('<br><br>');
  if (msg.streaming) {
    if (!html) html = '<span class="thinking">Thinking…</span>';
    else html += ' <span class="cursor">▍</span>';
  }
  return html;
}

function maybeScrollToBottom() {
  const el = document.getElementById('messages');
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  if (nearBottom) el.scrollTop = el.scrollHeight;
}

function updateStreamingBubble(msg) {
  const bubble = document.querySelector(`[data-msg-id="${msg.id}"] .bubble`);
  if (!bubble) return;
  bubble.innerHTML = bubbleHtml(msg);
  maybeScrollToBottom();
}

// --- Main Render ---
function render() {
  const chat = getCurrentChat();
  const messages = chat ? chat.messages : [];
  
  // Filter to only show chats that have actual messages
  const activeChats = chats.filter(c => c.messages.length > 0);
  const showHistory = activeChats.length > 0;

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="app-brand">AZUBUDDY</div>
        <div class="app-subtitle-sidebar">Unofficial AZ-900 Study Buddy</div>
        
        <button class="new-chat-btn" id="new-chat-btn">
          <span>+</span> New Chat
        </button>
        
        ${showHistory ? `
          <div class="sidebar-section">
            <div class="sidebar-header-row">
              <h3>Recent Chats</h3>
              <button id="clear-history-btn" class="text-btn" ${isStreaming ? 'disabled' : ''}>Clear all</button>
            </div>
            <ul id="chat-history-list">
              ${activeChats.map(c => `
                <li>
                  <a href="#" class="${c.id === currentChatId ? 'active' : ''}" data-chat-id="${c.id}" title="${escapeAttr(c.title)}">
                    ${escapeHtml(c.title.length > 28 ? c.title.substring(0, 28) + '...' : c.title)}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="sidebar-bottom">
          <details class="quick-links-details">
            <summary>Quick Links</summary>
            <div id="concept-list-container"></div>
          </details>
          
          <div class="sidebar-footer">
            Not affiliated with Microsoft.
          </div>
        </div>
      </aside>
      
      <main class="chat">
        <div class="messages" id="messages">
          ${messages.length === 0 ? `
            <div class="empty-state">
              <h1>Welcome to AZUBUDDY.</h1>
              <p>Select a concept below or ask a question to start preparing for your AZ-900 exam.</p>
              
              <div class="concept-grid">
                <div class="concept-card" data-id="region-pairs" data-q="What is a region pair?">
                  <h4>Region Pairs</h4><p>Disaster recovery & compliance</p>
                </div>
                <div class="concept-card" data-id="availability-zones" data-q="What are availability zones?">
                  <h4>Availability Zones</h4><p>High availability & fault domains</p>
                </div>
                <div class="concept-card" data-id="storage-redundancy" data-q="What is storage redundancy?">
                  <h4>Storage Redundancy</h4><p>LRS, ZRS, GRS, and GZRS</p>
                </div>
                <div class="concept-card" data-id="conditional-access" data-q="What is Conditional Access?">
                  <h4>Conditional Access</h4><p>Zero Trust & Entra ID signals</p>
                </div>
                <div class="concept-card" data-id="capex-vs-opex" data-q="What is CapEx vs OpEx?">
                  <h4>CapEx vs OpEx</h4><p>Cloud economics & pricing</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${messages.map(m => {
            if (m.role === 'user') {
              return `<div class="message user"><div class="bubble">${escapeHtml(m.text)}</div></div>`;
            }
            return `<div class="message assistant" data-msg-id="${m.id}">
              <div class="bubble">${bubbleHtml(m)}</div>
              ${!m.streaming && m.followUps.length > 0 ? `
                <div class="follow-ups-container">
                  <div class="follow-up-label">Suggested next steps</div>
                  <div class="follow-ups">
                    ${m.followUps.map(q => `<button class="chip" data-q="${escapeAttr(q)}">${escapeHtml(q)}</button>`).join('')}
                  </div>
                </div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
        
        <form class="input-form" id="input-form">
          <input type="text" id="question-input" placeholder="Ask about any Azure concept..." autocomplete="off">
          <button type="submit" ${isStreaming ? 'disabled' : ''}>${isStreaming ? '...' : 'Ask'}</button>
        </form>
      </main>
    </div>
  `;

  // Load concepts into the details tag
  fetch('/concepts-list.html')
    .then(r => r.text())
    .then(html => {
      const sidebar = document.getElementById('concept-list-container');
      if (sidebar) {
        sidebar.innerHTML = html;
        sidebar.querySelectorAll('script').forEach(oldScript => {
          const newScript = document.createElement('script');
          newScript.textContent = oldScript.textContent;
          oldScript.replaceWith(newScript);
        });
      }
    })
    .catch(err => console.log('Concept list error:', err));

  // Wire sidebar events
  document.getElementById('new-chat-btn').addEventListener('click', createNewChat);
  
  document.querySelectorAll('#chat-history-list a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      switchChat(a.dataset.chatId);
    });
  });

  // Wire Clear History button
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (isStreaming) return;
      if (confirm('Are you sure you want to clear all your chat history? This cannot be undone.')) {
        localStorage.removeItem('azubuddy_chats');
        localStorage.removeItem('azubuddy_current_chat');
        chats = [];
        currentChatId = null;
        initState(); 
      }
    });
  }

  // Wire concept cards in empty state
  document.querySelectorAll('.concept-card').forEach(card => {
    card.addEventListener('click', () => {
      const input = document.getElementById('question-input');
      input.value = card.dataset.q;
      input.dataset.conceptId = card.dataset.id;
      document.getElementById('input-form').dispatchEvent(new Event('submit'));
    });
  });

  // Wire follow-up chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('question-input');
      input.value = chip.dataset.q;
      document.getElementById('input-form').dispatchEvent(new Event('submit'));
    });
  });

  // Wire form
  document.getElementById('input-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('question-input');
    const q = input.value.trim();
    const conceptId = input.dataset.conceptId || null;
    if (q && !isStreaming) {
      input.value = '';
      delete input.dataset.conceptId;
      await askQuestion(q, conceptId);
    }
  });

  const msgs = document.getElementById('messages');
  if (msgs) msgs.scrollTop = 999999;
}

// --- API Flow ---
async function askQuestion(question, conceptId) {
  if (isStreaming) return;
  isStreaming = true;

  const chat = getCurrentChat();
  const userMsg = { id: `msg_${Date.now()}`, role: 'user', text: question };
  chat.messages.push(userMsg);

  if (chat.title === 'New Chat') chat.title = question;

  const assistantMsg = {
    id: `msg_${Date.now() + 1}`, role: 'assistant', raw: '',
    explanation: '', african_example: '', why_it_matters: '',
    followUps: [], streaming: true, error: null
  };
  chat.messages.push(assistantMsg);

  saveState(); 
  render();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, concept_id: conceptId })
    });

    if (!res.ok) {
      let m = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j.message) m = j.message; } catch {}
      throw new Error(m);
    }
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let evt;
        try { evt = JSON.parse(line); } catch { continue; }
        applyEvent(evt, assistantMsg);
      }
    }

    buffer += decoder.decode();
    const tail = buffer.trim();
    if (tail) {
      try { applyEvent(JSON.parse(tail), assistantMsg); } catch {}
    }
  } catch (err) {
    assistantMsg.error = err.message;
  } finally {
    assistantMsg.streaming = false;
    isStreaming = false;
    saveState(); 
    render(); 
  }
}

function applyEvent(evt, msg) {
  if (evt.type === 'delta') {
    msg.raw += evt.text;
    updateFields(msg);
    updateStreamingBubble(msg);
  } else if (evt.type === 'error') {
    msg.error = evt.message;
    msg.streaming = false;
    updateStreamingBubble(msg);
  } else if (evt.type === 'done') {
    msg.streaming = false;
  }
}

// Initialize App
initState();