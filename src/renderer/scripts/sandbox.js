// =============================================================================
// FocusFlight — Terminal Sandbox Controller
// =============================================================================
// 3-Panel layout: Client A | Client B | Server Inspector
//
// Client A:  Type messages, sends POST to localhost:3000
// Client B:  Polls GET /api/messages to receive messages
// Inspector: Shows structured HTTP request/response details in JSON format
// =============================================================================

const Sandbox = (() => {
  const SERVER_URL = 'http://localhost:3000';

  let overlay, closeBtn, toggleBtn;
  let clientAOutput, clientAInput;
  let serverLog;
  let clientBOutput;

  let isOpen = false;
  let pollInterval = null;
  let knownCount = 0;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function ts() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, '0'))
      .join(':');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])
    );
  }

  // Append a simple log line to a <pre> terminal with proper spacing
  function appendLog(container, prefix, prefixClass, body, bodyClass = '') {
    const line = document.createElement('span');
    line.className = 'log-line animate-in';
    line.innerHTML =
      `<span class="log-time">[${ts()}]</span> ` +
      `<span class="log-prefix ${prefixClass}">${prefix}</span> ` +
      `<span class="log-body ${bodyClass}">${escapeHtml(body)}</span>`;
    container.appendChild(line);
    container.appendChild(document.createTextNode('\n'));
    container.scrollTop = container.scrollHeight;
  }

  // ---------------------------------------------------------------------------
  // JSON Syntax Highlighter
  // ---------------------------------------------------------------------------

  function highlightJson(obj) {
    const raw = JSON.stringify(obj, null, 2);
    return raw
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="json-bool">$1</span>');
  }

  // ---------------------------------------------------------------------------
  // Server Inspector — Structured Card Builder
  // ---------------------------------------------------------------------------

  function addInspectorCard({ client, clientClass, description, method, url, reqHeaders, reqBody, parsedData, status, resHeaders, resBody, error }) {
    const card = document.createElement('div');
    card.className = 'inspector-card';

    const methodClass = method === 'POST' ? 'post' : 'get';
    const statusClass = error ? 'error' : '';
    const statusText = error ? 'ERROR' : `${status} OK`;

    // -- Header with Client Badge (Client A or Client B)
    let headerHtml = `
      <div class="inspector-card-header">
        <div class="inspector-header-left">
          <span class="inspector-client-badge ${clientClass}">${escapeHtml(client)}</span>
          <span class="inspector-arrow">→</span>
          <span class="inspector-method ${methodClass}">${method}</span>
          <span class="inspector-url">${escapeHtml(url)}</span>
        </div>
        <div class="inspector-header-right">
          <span class="inspector-status ${statusClass}">${statusText}</span>
          <span class="inspector-time">${ts()}</span>
        </div>
      </div>
    `;

    // -- Description Banner (explains why POST or GET)
    let descHtml = '';
    if (description) {
      descHtml = `<div class="inspector-desc">${escapeHtml(description)}</div>`;
    }

    // -- Request Section
    let requestHtml = `
      <div class="inspector-section">
        <div class="inspector-section-label">HTTP Request Headers & Body</div>
    `;
    if (reqHeaders) {
      for (const [key, val] of Object.entries(reqHeaders)) {
        requestHtml += `
          <div class="inspector-row">
            <span class="inspector-key">${escapeHtml(key)}</span>
            <span class="inspector-val string">${escapeHtml(val)}</span>
          </div>
        `;
      }
    }
    if (reqBody) {
      requestHtml += `
        <div class="inspector-row">
          <span class="inspector-key">Body (Raw)</span>
          <span class="inspector-val">${escapeHtml(reqBody)}</span>
        </div>
      `;
    }
    requestHtml += `</div>`;

    // -- Parsed Data Section (for POST)
    let parsedHtml = '';
    if (parsedData) {
      parsedHtml = `
        <div class="inspector-section">
          <div class="inspector-section-label">Server Parsed Data (URLSearchParams)</div>
          <div class="inspector-json">${highlightJson(parsedData)}</div>
        </div>
      `;
    }

    // -- Response Section
    let responseHtml = '';
    if (resBody && !error) {
      responseHtml = `
        <div class="inspector-section">
          <div class="inspector-section-label">HTTP Response Headers</div>
      `;
      if (resHeaders) {
        for (const [key, val] of Object.entries(resHeaders)) {
          responseHtml += `
            <div class="inspector-row">
              <span class="inspector-key">${escapeHtml(key)}</span>
              <span class="inspector-val string">${escapeHtml(val)}</span>
            </div>
          `;
        }
      }
      responseHtml += `
          <div class="inspector-section-label" style="margin-top:8px;">HTTP Response Body (JSON)</div>
          <div class="inspector-json">${highlightJson(resBody)}</div>
        </div>
      `;
    }

    // -- Error Section
    let errorHtml = '';
    if (error) {
      errorHtml = `
        <div class="inspector-section">
          <div class="inspector-section-label">Error</div>
          <div class="inspector-row">
            <span class="inspector-val" style="color:#f87171;">${escapeHtml(error)}</span>
          </div>
        </div>
      `;
    }

    card.innerHTML = headerHtml + descHtml + requestHtml + parsedHtml + responseHtml + errorHtml;
    serverLog.appendChild(card);
    serverLog.scrollTop = serverLog.scrollHeight;
  }

  // ---------------------------------------------------------------------------
  // Welcome Banners
  // ---------------------------------------------------------------------------

  function printBanner(container, lines) {
    const banner = document.createElement('div');
    banner.className = 'terminal-banner';
    banner.textContent = lines.join('\n');
    container.appendChild(banner);
  }

  function printAllBanners() {
    clientAOutput.innerHTML = '';
    serverLog.innerHTML = '';
    clientBOutput.innerHTML = '';

    printBanner(clientAOutput, [
      'CLIENT A (SENDER)',
      '-----------------',
      'Type a message and press Enter.',
      'Sends POST /api/message to Server.',
    ]);

    // Inspector gets a clear explanation banner
    const inspBanner = document.createElement('div');
    inspBanner.className = 'inspector-banner';
    inspBanner.textContent = 'Node.js Server Inspector — Live HTTP stream\n• Client A sends POST to create & store messages\n• Client B sends GET to fetch & receive messages';
    serverLog.appendChild(inspBanner);

    printBanner(clientBOutput, [
      'CLIENT B (RECEIVER)',
      '-------------------',
      'Polls GET /api/messages on Server',
      'and prints incoming messages.',
    ]);

    appendLog(clientBOutput, 'SYS', 'system', 'Listening for messages from server');
  }

  // ---------------------------------------------------------------------------
  // Client A: Send Message
  // ---------------------------------------------------------------------------

  async function sendMessage(text) {
    if (!text.trim()) return;

    // Log message sent cleanly in Client A
    appendLog(clientAOutput, 'SENT', 'sent', text, 'highlight');

    const rawBody = `message=${encodeURIComponent(text)}`;
    const reqHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'localhost:3000',
      'Connection': 'keep-alive',
    };

    try {
      const res = await fetch(`${SERVER_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: rawBody,
      });

      const json = await res.json();

      // Inspector card with full details and Client A badge
      addInspectorCard({
        client: 'Client A',
        clientClass: 'client-a',
        description: 'Client A sent a message to the server via POST',
        method: 'POST',
        url: '/api/message',
        reqHeaders: reqHeaders,
        reqBody: rawBody,
        parsedData: { message: text },
        status: res.status,
        resHeaders: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        resBody: json,
      });

    } catch (err) {
      addInspectorCard({
        client: 'Client A',
        clientClass: 'client-a',
        description: 'Client A request failed',
        method: 'POST',
        url: '/api/message',
        reqHeaders: reqHeaders,
        reqBody: rawBody,
        error: err.message,
      });

      appendLog(clientAOutput, 'ERR', 'error', `Failed to send: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Client B: Poll for new messages
  // ---------------------------------------------------------------------------

  async function pollMessages() {
    try {
      const res = await fetch(`${SERVER_URL}/api/messages`);
      const messages = await res.json();

      if (messages.length > knownCount) {
        const newOnes = messages.slice(knownCount);
        for (const msg of newOnes) {
          // Inspector card with Client B badge for the GET request
          addInspectorCard({
            client: 'Client B',
            clientClass: 'client-b',
            description: 'Client B fetched new messages from server via GET',
            method: 'GET',
            url: '/api/messages',
            reqHeaders: {
              'Host': 'localhost:3000',
              'Accept': 'application/json',
            },
            status: 200,
            resHeaders: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            resBody: {
              totalStored: messages.length,
              deliveredMessage: msg.message,
              timestamp: msg.timestamp,
            },
          });

          // Print clean received line in Client B
          appendLog(clientBOutput, 'RECV', 'recv', msg.message, 'highlight');
        }
        knownCount = messages.length;
      }
    } catch {
      // Server not ready yet — silently retry
    }
  }

  // ---------------------------------------------------------------------------
  // Clear All Terminals & Server State
  // ---------------------------------------------------------------------------

  async function clearAll() {
    knownCount = 0;
    if (clientAInput) clientAInput.value = '';

    // Clear server memory via API
    try {
      await fetch(`${SERVER_URL}/api/clear`, { method: 'POST' });
    } catch {}

    // Reset panel UI
    printAllBanners();
    if (clientAInput) clientAInput.focus();
  }

  // ---------------------------------------------------------------------------
  // Open / Close
  // ---------------------------------------------------------------------------

  async function open() {
    if (isOpen) return;
    isOpen = true;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Always start fresh and clean every time opened
    await clearAll();

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(pollMessages, 1500);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('active');

    setTimeout(() => {
      overlay.style.display = 'none';
      // Wipe outputs on close so no old content is cached
      if (clientAOutput) clientAOutput.innerHTML = '';
      if (serverLog) serverLog.innerHTML = '';
      if (clientBOutput) clientBOutput.innerHTML = '';
    }, 300);

    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    overlay       = document.getElementById('sandbox-overlay');
    closeBtn      = document.getElementById('sandbox-close-btn');
    clearBtn      = document.getElementById('sandbox-clear-btn');
    toggleBtn     = document.getElementById('btn-sandbox-toggle');
    clientAOutput = document.getElementById('client-a-output');
    clientAInput  = document.getElementById('client-a-input');
    serverLog     = document.getElementById('server-log');
    clientBOutput = document.getElementById('client-b-output');

    if (!overlay) return;

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isOpen ? close() : open();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearAll();
      });
    }

    if (clientAInput) {
      clientAInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const text = clientAInput.value.trim();
          if (text) {
            sendMessage(text);
            clientAInput.value = '';
          }
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  return { init, open, close, clearAll };
})();
