/* ============================================================================
 *  BrOS AI Chatbox — Demo Bot v1.0
 *  ----------------------------------------------------------------------------
 *  Bu dosya `src/apps/ai/ai.html` tarafından yüklenir ve chatbox'ın beklediği
 *  sözleşmeyi doldurur:
 *
 *      window.aiBot = {
 *        name: 'BrOS Asistan',
 *        version: '1.0.0',
 *        async respond(text, history) { return '...'; }
 *      };
 *
 *  Sözleşme detayları:
 *    - text    : son kullanıcı mesajı (trim'lenmiş, string)
 *    - history : Array<{ role: 'user'|'bot', text: string }>
 *                Şu ANKİ kullanıcı mesajı dahil DEĞİLDİR (shell tarafından
 *                zaten çıkarılmıştır). Doğrudan bir LLM konuşma API'sine
 *                beslenebilir.
 *    - return  : string — markdown-lite (escape + basit format).
 *
 *  ÖZELLİKLER:
 *    selamlama, hal hatır, kimlik, saat, tarih, yapılacak ekle/listele,
 *    ad hatırlama, zar, yazı tura, fıkra, söz, güvenli matematik.
 *
 *  STATE (localStorage):
 *    ai-bot:user-name   → string | null
 *    ai-bot:todos       → Array<{ text, ts, done }>
 * ============================================================================ */

(function () {
  'use strict';

  /* ---------- kalıcı durum yardımcıları ---------- */

  const KEYS = {
    NAME:  'ai-bot:user-name',
    TODOS: 'ai-bot:todos',
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* quota veya private-mode — sessizce geç. */
    }
  }

  /* ---------- tarih biçimlendirme (Türkçe) ---------- */

  const TR_DAYS   = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba',
                     'Perşembe', 'Cuma', 'Cumartesi'];
  const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                     'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  /* ---------- GÜVENLİ MATEMATİK DEĞERLENDİRİCİ ----------
   *
   * Üç katmanlı savunma:
   *
   *   1. KARAKTER BEYAZ-LİSTESİ: sadece rakam, operatör, parantez, nokta/virgül
   *      veya başta bir Math fonksiyonu adı.
   *   2. TEHLİKELİ KİMLİK KARA-LİSTESİ: alert, prompt, confirm, eval,
   *      Function, window, document, fetch, setTimeout, setInterval, vb.
   *      herhangi bir yerde geçiyorsa reddet.
   *   3. DAR KAPSAM: new Function ile sadece MATH_PRELUDE'da tanımlı
   *      Math.* takma adları görünür. window, document, fetch, vb. KAPSAM
   *      DIŞI olduğu için yazılsa bile ReferenceError.
   *
   * Üçü de geçse bile Math dışındaki tüm global'lere erişilemez.
   * --------------------------------------------------------------- */

  const MATH_PRELUDE = [
    'const sqrt = Math.sqrt,',
    '      pow  = Math.pow,',
    '      log  = Math.log,',
    '      ln   = Math.log,',
    '      exp  = Math.exp,',
    '      abs  = Math.abs,',
    '      min  = Math.min,',
    '      max  = Math.max,',
    '      pi   = Math.PI,',
    '      e    = Math.E;',
  ].join('\n');

  // (2) Kara-liste — bunlardan biri geçiyorsa hesaplamayı reddet.
  const FORBIDDEN = /(alert|prompt|confirm|console|window|document|fetch|eval|Function|setTimeout|setInterval|require|import|globalThis|self|prototype|constructor|__proto__|__|location|navigator|XMLHttpRequest|webkit)/i;

  // (1) Beyaz-liste
  const SAFE_CHARS_ONLY = /^[\d\s+\-*/^().,x]+$/;
  const SAFE_FUNC_LEAD  = /^(sqrt|pow|log|ln|exp|abs|min|max|pi|e)\b/i;

  function safeMath(expression) {
    if (typeof expression !== 'string') return null;
    const expr = expression.trim();
    if (!expr) return null;

    const looksPure = SAFE_CHARS_ONLY.test(expr) || SAFE_FUNC_LEAD.test(expr);
    if (!looksPure) return null;
    if (FORBIDDEN.test(expr)) return null;

    const normalized = expr
      .replace(/\s*x\s*/gi, '*')
      .replace(/\^/g, '**');

    try {
      // (3) Dar kapsamda derle.
      // eslint-disable-next-line no-new-func
      const fn = new Function(MATH_PRELUDE + '\nreturn (' + normalized + ');');
      const result = fn();
      return Number.isFinite(result) ? result : null;
    } catch (error) {
      return null;
    }
  }

  /* ---------- handler kayıt defteri ----------
   *
   * İlk eşleşen kazanır. Spesifik → genel sıraya göre ekle.
   * { match: (text) => bool, run: (text, history) => string }
   * --------------------------------------------------------- */

  const handlers = [];

  function addHandler(match, run) {
    handlers.push({ match, run });
  }

  // Selamlama — "adım" handler'ından ÖNCE gelmeli, yoksa "adım selam"
  // yakalanır.
  addHandler(
    (t) => /^(selam|merhaba|hi|hello|hey|selamlar|selamun aleyk[uü]m|sa(lar)?)\b/i.test(t),
    () => {
      const n = rememberedName();
      return 'Merhaba' + (n ? ', **' + n + '**' : '') +
        '! 👋 Nasıl yardımcı olabilirim?\n\n**yardım** yazarsan neler yapabildiğimi görürsün.';
    }
  );

  // Türkçe metin içeren string'lerde kesme işareti (') sorun çıkarabilir,
  // bu yüzden bu handler'lar hep çift tırnak kullanır.
  addHandler(
    (t) => /\bad(ı|in)[mn]?\s+ne\b|\bkim\s*sin\b|\bsen\s+kim\b/i.test(t),
    () =>
      "Ben **BrOS Asistan'ıyım**. BrOS içine gömülü küçük, çevrimdışı, " +
      'kural-tabanlı bir bot.\n\n' +
      'İnternete bağlanmıyorum — sadece anahtar kelimelere, basit hesaplara ' +
      've kalıcı notlara cevap veriyorum.\n\n' +
      'Daha akıllı bir bot istersen `window.aiBot.respond` fonksiyonunu ' +
      'kendi kodunla değiştirebilirsin.'
  );

  addHandler(
    (t) => /\bnas(ı|i)l(s|)?(ın|sin)\b|\bn(aber|ap[ıi]yorsun)\b/i.test(t),
    () => pick([
      'İyiyim, teşekkür ederim! 🙌',
      'Süper, kod yazmak için güzel bir gün. ✨',
      'Hizmete hazırım. Sen nasılsın?',
      'Bugün kendimi yıldız gibi hissediyorum 🌟',
    ])
  );

  addHandler(
    (t) => /^(teşekk(ü|ü+e|ü+ler)|t[eş]şekk[uü]rler|sağol|eyvallah|tşk|çok sağol)/i.test(t),
    () => pick([
      'Rica ederim! 😊',
      'Ne demek, her zaman.',
      'Bir şey değil — başka sorun olursa çekinme.',
    ])
  );

  addHandler(
    (t) => /^hoş(ça|ca)kal|görüşürüz|^\s*bye\b|^\s*bb\b|bye[ -]bye|iyi geceler|iyi akşamlar/i.test(t),
    () => pick(['Görüşürüz! 👋', 'Kendine iyi bak.', 'Yarın da buradayım.'])
  );

  addHandler(
    (t) => /^(saat|saat\s*ka[cç]|time)\b/i.test(t),
    () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return '⏰ Şu an saat **' + hh + ':' + mm + '**.';
    }
  );

  addHandler(
    (t) => /^(bug[uü]n\s*g[uü]nlerden\s*ne|bug[uü]n|tarih|g[uü]nlerden\s*ne)\b/i.test(t),
    () => {
      const d = new Date();
      return '📅 Bugün **' + d.getDate() + ' ' + TR_MONTHS[d.getMonth()] +
        ' ' + d.getFullYear() + ', ' + TR_DAYS[d.getDay()] + '**.';
    }
  );

  addHandler(
    (t) => /^(yard[ıi]m|help|\?|komutlar|commands|neler yapabilirsin)/i.test(t),
    () =>
      '**Komutlar:**\n\n' +
      '`selam` / `merhaba` — selamlama\n' +
      '`nasılsın` — hal hatır\n' +
      '`kim sin` / `adın ne` — kim olduğum\n' +
      '`saat` / `tarih` — zaman\n' +
      '`zar at` / `yazı tura` — şans oyunları\n' +
      '`fıkra` / `espri` — gül\n' +
      '`söz` / `motivasyon` — ilham\n' +
      '`todo: metin` — yapılacak ekle\n' +
      '`yapılacaklar` — listele\n' +
      '`adım X` — adını hatırla\n' +
      '`kimim` — adını söyle\n' +
      '`unut` — adını unut\n' +
      '`matematik` — örn. `2 + 3`, `4 * (5 - 1)`, `sqrt(16)`, `2^10`, `pi`'
  );

  // "adım X" — gerçek bir isim (sadece harf, 1-40 karakter).
  addHandler(
    (t) => {
      const m = t.match(/^ad(ı|i)m\s+([^\n]+)/i);
      if (!m) return false;
      const candidate = m[2].trim().replace(/[.!?]+$/, '').trim();
      return /^[a-zA-ZçğıöşüÇĞİÖŞÜ"'\- ]{1,40}$/.test(candidate);
    },
    (t) => {
      const m = t.match(/^ad(ı|i)m\s+([^\n]+)/i);
      const newName = (m ? m[2] : '').trim().replace(/[.!?]+$/, '').trim();
      if (!newName) return 'Adını anlayamadım. Örnek: `adım Ahmet`';
      saveJSON(KEYS.NAME, newName);
      return 'Tanıştığımıza memnun oldum, **' + newName + '**! 🤝 ' +
             'Bir dahaki sefere hatırlayacağım.';
    }
  );

  addHandler(
    (t) => /^\s*unut\b/i.test(t) && !/yap|liste|todo/i.test(t),
    () => {
      saveJSON(KEYS.NAME, null);
      return 'Tamam, adını sildim. 🤐';
    }
  );

  addHandler(
    (t) => /^(zar(ı)?\s*at|zar(ı)?\s*d[oö]nd[üu]r|dice)/i.test(t),
    () => {
      const n = 1 + Math.floor(Math.random() * 6);
      const die = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return '🎲 Zar: **' + n + '** ' + die[n];
    }
  );

  addHandler(
    (t) => /(yazı\s*tura|coin\s*flip|para\s*at)/i.test(t),
    () => '🪙 **' + (Math.random() < 0.5 ? 'Yazı' : 'Tura') + '** geldi.'
  );

  addHandler(
    (t) => /^(f[ıi]kra|fikra|espri|şaka|şaka yap|bir şaka)/i.test(t),
    () =>
      pick([
        '— Bilgisayar neden üşür? Çünkü pencereleri sürekli açık bırakıyorsun. 🪟',
        'Öğretmen: "Kelime öbekleri neden öbeklenir?"\nÖğrenci: "Çünkü tek başlarına sıkılıyor."',
        '— Yarın ne yapacaksın?\n— Hata ayıklayacağım.\n— Dün ne yaptın?\n— Hata ayıkladım. Hata yarın doğmuş.',
        '404 hayat bulunamadı, ama 200 OK devam ediyor.',
        // Tek tırnak içeren string için çift tırnak kullanıyoruz:
        "— Türk bantlı İsveç'in telefonu çalsa ne der?\n— \"Hallå, javë script.\"",
      ])
  );

  addHandler(
    (t) => /^(s[öo]z|motivasyon|quote|ilham ver)/i.test(t),
    () =>
      pick([
        // Çift tırnak içeren string'ler için tek tırnak kullanıyoruz:
        '"Bir gün herkes BrOS\u2019u duyacak."',
        '"Kod, sandığın kadar kötü değildir — derle. Tekrar derle."',
        '"Yarın başlarım" — bugün başlarsan yarın başlamazsın.',
        '"Hayat, prompt() gibidir: bir şey sormazsan cevap gelmez."',
        '"console.log(\'umut\'); // fallback"',
      ])
  );

  addHandler(
    (t) => /^todo\s*[:\-]\s*(.+)/i.test(t),
    (t) => {
      const m = t.match(/^todo\s*[:\-]\s*(.+)/i);
      const text = (m ? m[1] : '').trim();
      if (!text) return 'Todo için bir metin yaz: **todo: yarın su iç**.';
      const list = loadJSON(KEYS.TODOS, []);
      list.push({ text, ts: Date.now(), done: false });
      saveJSON(KEYS.TODOS, list);
      return '📌 Eklendi: **' + text + '**';
    }
  );

  addHandler(
    (t) => /^(yapılacaklar|todo\s*list|todolar|todo['’]lar)/i.test(t),
    () => {
      const list = loadJSON(KEYS.TODOS, []);
      if (!list.length) return 'Henüz yapılacak yok. **todo: <metin>** ile ekleyebilirsin.';
      const formatted = list
        .map((todo, i) => (i + 1) + '. ' + todo.text)
        .join('\n');
      return '📋 **Yapılacaklar** (' + list.length + '):\n\n' + formatted;
    }
  );

  addHandler(
    (t) => /^(kimim|ad(ı|i)m\s*ne|ben\s*kim)/i.test(t),
    () => {
      const n = rememberedName();
      return n
        ? 'Senin adın **' + n + '**. 🤝'
        : 'Henüz adını söylemedin.\n\n**adım X** ile kaydedebilirsin.';
    }
  );

  /* ---------- yardımcılar ---------- */

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rememberedName() {
    return loadJSON(KEYS.NAME, null);
  }

  function tryMath(text) {
    const r = safeMath(text);
    if (r === null) return null;
    return '🔢 `' + text.trim() + '` = **' + r + '**';
  }

  /* ---------- public sözleşme ---------- */

  window.aiBot = {
    name:    'BrOS Asistan',
    version: '1.0.0',
    capabilities: [
      'selamlama', 'hal-hatır', 'kimlik', 'saat/tarih',
      'yapılacaklar', 'şans oyunları', 'fıkra/söz',
      'matematik', 'kalıcı isim',
    ],
    async respond(text, history) {
      const t = (text || '').trim();
      if (!t) {
        return 'Boş bir mesaj gönderdin. **yardım** yazıp neler yapabildiğimi görebilirsin.';
      }

      // 1) İlk eşleşen handler kazanır.
      for (const h of handlers) {
        if (h.match(t)) return h.run(t, history);
      }

      // 2) Matematik denemesi.
      const math = tryMath(t);
      if (math !== null) return math;

      // 3) Yumuşak fallback. Çift tırnak içinde kesme işareti serbest.
      //    chatbox'ın renderMarkdown'ı HTML escape yaptığı için bu string
      //    güvenle renderlanır — < > & bile literal görünür.
      const n = rememberedName();
      const lines = [
        'Hmm, **' + t + '** benim sözlüğümde yok.',
        'Bilinmeyen komut için **yardım** yazabilirsin.',
        "Tek başına çalışıyorum — daha zeki bir bot istersen `window.aiBot.respond`'ı kendi kodunla değiştir.",
      ];
      if (n) lines.push('Seni duydum, **' + n + '**.');
      return lines.join('\n\n');
    },
  };

  // Bot hazır olduğunda geliştirici konsoluna kısa bir ipucu.
  if (typeof console !== 'undefined' && console.info) {
    console.info('[BrOS AI Bot] hazır — sözleşme: window.aiBot.respond(text, history) => string');
  }
})();