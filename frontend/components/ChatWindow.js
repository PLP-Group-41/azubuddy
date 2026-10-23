// frontend/components/ChatWindow.js
const app = document.getElementById('app');
let messages = [];
let isLoading = false;

function render() {
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div id="concept-list"></div>
      </aside>
      <main class="chat">
        <header class="chat-header">
          <div class="app-title">AZUBUDDY</div>
          <div class="app-subtitle">Unofficial AZ-900 study buddy</div>
          <div class="unofficial">Not affiliated with Microsoft</div>
        </header>
        <div class="messages" id="messages">
          ${messages.map(m => `
            <div class="message ${m.role}">
              <div class="bubble">${m.text}</div>
              ${m.followUps ? `
                <div class="follow-ups">
                  ${m.followUps.map(q => `<button class="chip" data-q="${q.replace(/"/g, '&quot;')}">${q}</button>`).join('')}
                </div>` : ''}
            </div>
          `).join('')}
          ${isLoading ? '<div class="message assistant"><div class="bubble loading">Thinking...</div></div>' : ''}
        </div>
        <form class="input-form" id="input-form">
          <input type="text" id="question-input" placeholder="Ask about any Azure concept..." autocomplete="off">
          <button type="submit">Ask</button>
        </form>
      </main>
    </div>
  `;

  // Load Dev C's static concept list into the sidebar
  fetch('/concepts-list.html')
    .then(r => r.text())
    .then(html => {
      const sidebar = document.getElementById('concept-list');
      sidebar.innerHTML = html;
      // Re-execute any scripts in the loaded HTML
      const scripts = sidebar.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });
    })
    .catch(err => console.log('Concept list not yet available:', err));

  // Wire follow-up chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      document.getElementById('question-input').value = q;
      document.getElementById('input-form').dispatchEvent(new Event('submit'));
    });
  });

  // Wire form
  document.getElementById('input-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('question-input');
    const q = input.value.trim();
    const conceptId = input.dataset.conceptId || null;
    if (q && !isLoading) {
      input.value = '';
      delete input.dataset.conceptId;
      await askQuestion(q, conceptId);
    }
  });

  document.getElementById('messages').scrollTop = 999999;
}

async function askQuestion(question, conceptId) {
  isLoading = true;
  messages.push({ role: 'user', text: question });
  render();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, concept_id: conceptId })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.message);
    messages.push({
      role: 'assistant',
      text: `<strong>${data.explanation}</strong><br><br>${data.african_example}<br><br><em>${data.why_it_matters}</em>`,
      followUps: data.follow_ups
    });
  } catch (err) {
    messages.push({ role: 'assistant', text: `Error: ${err.message}` });
  } finally {
    isLoading = false;
    render();
  }
}

render();
