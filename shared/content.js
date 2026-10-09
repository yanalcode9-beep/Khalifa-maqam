/* =========================================================================
   MAQAM | مَقام — course data (bilingual)
   Source: the course book "مدخل إلى علم الموسيقا" — An-Najah National
   University, Faculty of Fine Arts, Dept. of Musical Sciences.
   ========================================================================= */
(function () {
  const MQ = (window.MQ = window.MQ || {});
  MQ.lang = MQ.lang || "ar";
  MQ.t = (o) => (o == null ? "" : typeof o === "string" || typeof o === "number" ? String(o) : o[MQ.lang] ?? o.ar ?? "");

  /* ---------- pitch names ---------- */
  MQ.solfege = { ar: ["دو", "ري", "مي", "فا", "صول", "لا", "سي"], en: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] };
  MQ.letters = ["C", "D", "E", "F", "G", "A", "B"];
  MQ.acc = { sharp: { ar: "دييز", en: "sharp" }, flat: { ar: "بيمول", en: "flat" }, natural: { ar: "بيكار", en: "natural" } };

  /* ---------- the six elements of music (ch.1) ---------- */
  MQ.elements = [
    { id: "rhythm", ar: "الإيقاع", en: "Rhythm", term: "Rhythm",
      d: { ar: "تقسيم منتظم للأزمنة يختلف في الطول والقصر، ويحدد سرعة اللحن وبطأه ومواقع النبر فيه.", en: "A regular division of time into long and short values; it sets the speed of the melody and where the accents fall." } },
    { id: "melody", ar: "اللحن", en: "Melody", term: "Melody",
      d: { ar: "نغمات مختلفة الارتفاع تتوالى في سلسلة مترابطة لها بداية ونهاية، بين قمة وقعر.", en: "Notes of different pitch following one another in a connected line with a beginning, an end, a peak and a trough." } },
    { id: "poly", ar: "تعدد الأصوات", en: "Polyphony", term: "Polyphony",
      d: { ar: "اجتماع نغمتين أو أكثر في اللحظة نفسها، ويشمل علمي الهارموني (توافق الأصوات) والكونترابوينت (تقابل الألحان).", en: "Two or more notes sounding at the same moment; it covers harmony and counterpoint." } },
    { id: "form", ar: "الشكل البنائي", en: "Form", term: "Form",
      d: { ar: "الهيكل العام للقطعة وأجزاؤها الأساسية وتفاصيلها، والعلاقة بينها.", en: "The overall architecture of a piece, its main sections and how they relate." } },
    { id: "instr", ar: "التوزيع الموسيقي", en: "Instrumentation", term: "Instrumentation",
      d: { ar: "معرفة طوابع الآلات واستخدامها ومزج أصواتها للحصول على طوابع صوتية جديدة.", en: "Knowing each instrument's colour and blending them into new colours of sound." } },
    { id: "perf", ar: "الأداء", en: "Interpretation", term: "Interpretation",
      d: { ar: "عزف أو غناء ما يريده المؤلف بصورة صحيحة؛ يحتاج مهارة ومعرفة بأساليب الأداء والمدارس المختلفة.", en: "Playing or singing what the composer intended, correctly; it takes skill and knowledge of performance styles." } },
  ];

  /* ---------- note values (7), rests have the same values ---------- */
  MQ.durations = [
    { id: "ronde", g: "\u{1D15D}", r: "\u{1D13B}", ar: "روند", arMean: "المستديرة", en: "Whole note", beats: 4, frac: "1" },
    { id: "blanche", g: "\u{1D15E}", r: "\u{1D13C}", ar: "بلانش", arMean: "البيضاء", en: "Half note", beats: 2, frac: "1/2" },
    { id: "noire", g: "\u{1D15F}", r: "\u{1D13D}", ar: "نوار", arMean: "السوداء", en: "Quarter note", beats: 1, frac: "1/4" },
    { id: "croche", g: "\u{1D160}", r: "\u{1D13E}", ar: "كروش", arMean: "ذات السن", en: "Eighth note", beats: 0.5, frac: "1/8" },
    { id: "dcroche", g: "\u{1D161}", r: "\u{1D13F}", ar: "دبل كروش", arMean: "ذات السنّين", en: "Sixteenth note", beats: 0.25, frac: "1/16" },
    { id: "tcroche", g: "\u{1D162}", r: "\u{1D140}", ar: "تريبل كروش", arMean: "ذات الثلاثة أسنان", en: "32nd note", beats: 0.125, frac: "1/32" },
    { id: "qcroche", g: "\u{1D163}", r: "\u{1D141}", ar: "كوادروبل كروش", arMean: "ذات الأربعة أسنان", en: "64th note", beats: 0.0625, frac: "1/64" },
  ];

  /* ---------- clefs (7 in total) ---------- */
  MQ.clefs = [
    { id: "treble", glyph: "\u{1D11E}", ar: "مفتاح صول", en: "G (treble) clef", range: { ar: "الطبقة الحادة", en: "high register" }, line: 2, count: 1 },
    { id: "bass", glyph: "\u{1D122}", ar: "مفتاح فا الباص", en: "F clef — bass", range: { ar: "الطبقة الغليظة — على الخط الرابع", en: "low register — on line 4" }, line: 4, count: 1 },
    { id: "baritone", glyph: "\u{1D122}", ar: "مفتاح فا الباريتون", en: "F clef — baritone", range: { ar: "الطبقة الغليظة — على الخط الثالث", en: "low register — on line 3" }, line: 3, count: 1 },
    { id: "soprano", glyph: "\u{1D121}", ar: "مفتاح دو السوبرانو", en: "C clef — soprano", range: { ar: "الوسطى — الخط الأول", en: "middle — line 1" }, line: 1 },
    { id: "mezzo", glyph: "\u{1D121}", ar: "مفتاح دو الميتزوسوبرانو", en: "C clef — mezzo-soprano", range: { ar: "الوسطى — الخط الثاني", en: "middle — line 2" }, line: 2 },
    { id: "alto", glyph: "\u{1D121}", ar: "مفتاح دو الألطو", en: "C clef — alto", range: { ar: "الوسطى — الخط الثالث", en: "middle — line 3" }, line: 3 },
    { id: "tenor", glyph: "\u{1D121}", ar: "مفتاح دو التينور", en: "C clef — tenor", range: { ar: "الوسطى — الخط الرابع", en: "middle — line 4" }, line: 4 },
  ];

  /* ---------- intervals (semitones; feelings as taught in the course) ---------- */
  MQ.intervals = [
    { id: "m2", semi: 1, ar: "ثانية صغيرة (2ص)", en: "Minor 2nd", tones: { ar: "نصف بعد", en: "a half tone" }, kind: "diss", feel: { ar: "احتكاك وتوتر", en: "friction and tension" } },
    { id: "M2", semi: 2, ar: "ثانية كبيرة (2ك)", en: "Major 2nd", tones: { ar: "بعد كامل", en: "one whole tone" }, kind: "diss", feel: { ar: "خطوة لحنية طبيعية", en: "a natural melodic step" } },
    { id: "m3", semi: 3, ar: "ثالثة صغيرة (3ص)", en: "Minor 3rd", tones: { ar: "بعد ونصف", en: "one and a half tones" }, kind: "imperfect", feel: { ar: "الحزن والضعف", en: "sadness and weakness" } },
    { id: "M3", semi: 4, ar: "ثالثة كبيرة (3ك)", en: "Major 3rd", tones: { ar: "بعدان كاملان", en: "two whole tones" }, kind: "imperfect", feel: { ar: "الفرح والقوة", en: "joy and strength" } },
    { id: "P4", semi: 5, ar: "رابعة تامة (4ت)", en: "Perfect 4th", tones: { ar: "بعدان ونصف", en: "two and a half tones" }, kind: "perfect", feel: { ar: "النهاية والركوز", en: "ending and rest" } },
    { id: "A4", semi: 6, ar: "رابعة زائدة (4ز)", en: "Augmented 4th", tones: { ar: "ثلاثة أبعاد", en: "three whole tones" }, kind: "diss", feel: { ar: "قلق وعدم استقرار", en: "restlessness" } },
    { id: "P5", semi: 7, ar: "خامسة تامة (5ت)", en: "Perfect 5th", tones: { ar: "ثلاثة أبعاد ونصف", en: "three and a half tones" }, kind: "perfect", feel: { ar: "سؤال واستفهام صعودًا، ونهاية وركوز هبوطًا", en: "a question when rising, an ending when falling" } },
    { id: "m6", semi: 8, ar: "سادسة صغيرة (6ص)", en: "Minor 6th", tones: { ar: "أربعة أبعاد", en: "four whole tones" }, kind: "imperfect", feel: { ar: "حنين دافئ", en: "warm longing" } },
    { id: "M6", semi: 9, ar: "سادسة كبيرة (6ك)", en: "Major 6th", tones: { ar: "أربعة أبعاد ونصف", en: "four and a half tones" }, kind: "imperfect", feel: { ar: "انفتاح وإشراق", en: "openness and brightness" } },
    { id: "m7", semi: 10, ar: "سابعة صغيرة (7ص)", en: "Minor 7th", tones: { ar: "خمسة أبعاد", en: "five whole tones" }, kind: "diss", feel: { ar: "تنافر يطلب الحل", en: "a dissonance that wants resolving" } },
    { id: "M7", semi: 11, ar: "سابعة كبيرة (7ك)", en: "Major 7th", tones: { ar: "خمسة أبعاد ونصف", en: "five and a half tones" }, kind: "diss", feel: { ar: "تنافر حاد", en: "sharp dissonance" } },
    { id: "P8", semi: 12, ar: "ثامنة تامة (8ت)", en: "Perfect octave", tones: { ar: "ستة أبعاد", en: "six whole tones" }, kind: "perfect", feel: { ar: "جواب القرار", en: "the answer of the base note" } },
  ];
  MQ.consonance = {
    perfect: { ar: "تامة التوافق", en: "perfect consonance" },
    imperfect: { ar: "غير تامة التوافق", en: "imperfect consonance" },
    diss: { ar: "متنافرة", en: "dissonant" },
  };

  /* ---------- triads ---------- */
  MQ.chords = [
    { id: "maj", semis: [0, 4, 7], ar: "تآلف ثلاثي كبير", en: "Major triad", build: { ar: "3ك + 3ص، خامسة تامة", en: "M3 + m3, perfect 5th" }, feel: { ar: "متوافق — فرح وقوة", en: "consonant — joy and strength" } },
    { id: "min", semis: [0, 3, 7], ar: "تآلف ثلاثي صغير", en: "Minor triad", build: { ar: "3ص + 3ك، خامسة تامة", en: "m3 + M3, perfect 5th" }, feel: { ar: "حزن وضعف", en: "sadness and weakness" } },
    { id: "dim", semis: [0, 3, 6], ar: "تآلف ثلاثي ناقص", en: "Diminished triad", build: { ar: "3ص + 3ص، خامسة ناقصة", en: "m3 + m3, diminished 5th" }, feel: { ar: "متنافر — حزن وغموض", en: "dissonant — sadness and mystery" } },
    { id: "aug", semis: [0, 4, 8], ar: "تآلف ثلاثي زائد", en: "Augmented triad", build: { ar: "3ك + 3ك، خامسة زائدة", en: "M3 + M3, augmented 5th" }, feel: { ar: "متنافر — قوة مع تعجب", en: "dissonant — strength with astonishment" } },
  ];

  /* ---------- time signatures ---------- */
  MQ.meters = [
    { id: "2/4", n: 2, d: 4, groups: [1, 1], kind: { ar: "بسيط ثنائي", en: "simple duple" } },
    { id: "3/4", n: 3, d: 4, groups: [1, 1, 1], kind: { ar: "بسيط ثلاثي", en: "simple triple" } },
    { id: "4/4", n: 4, d: 4, groups: [1, 1, 1, 1], kind: { ar: "بسيط رباعي", en: "simple quadruple" } },
    { id: "6/8", n: 6, d: 8, groups: [3, 3], kind: { ar: "مركب ثنائي", en: "compound duple" } },
    { id: "9/8", n: 9, d: 8, groups: [3, 3, 3], kind: { ar: "مركب ثلاثي", en: "compound triple" } },
    { id: "12/8", n: 12, d: 8, groups: [3, 3, 3, 3], kind: { ar: "مركب رباعي", en: "compound quadruple" } },
    { id: "5/8", n: 5, d: 8, groups: [3, 2], kind: { ar: "غير مألوف (مرتبط بالإيقاعات العربية)", en: "irregular (linked to Arabic rhythms)" } },
    { id: "7/8", n: 7, d: 8, groups: [3, 2, 2], kind: { ar: "غير مألوف", en: "irregular" } },
    { id: "10/8", n: 10, d: 8, groups: [3, 2, 2, 3], kind: { ar: "غير مألوف — ميزان السماعي الثقيل", en: "irregular — the metre of Sama'i Thaqil" } },
  ];
  MQ.tempi = [
    { max: 60, term: "Largo", ar: "واسع وبطيء جدًا", en: "broad, very slow" },
    { max: 76, term: "Adagio", ar: "بطيء", en: "slow" },
    { max: 108, term: "Andante", ar: "متمهّل كالمشي", en: "at a walking pace" },
    { max: 120, term: "Moderato", ar: "معتدل", en: "moderate" },
    { max: 168, term: "Allegro", ar: "سريع مرح", en: "fast and lively" },
    { max: 999, term: "Presto", ar: "سريع جدًا", en: "very fast" },
  ];

  /* ---------- key signatures ---------- */
  MQ.sharpOrder = ["F", "C", "G", "D", "A", "E", "B"]; // فا دو صول ري لا مي سي
  MQ.flatOrder = ["B", "E", "A", "D", "G", "C", "F"]; // سي مي لا ري صول دو فا
  MQ.majorBySharps = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  MQ.majorByFlats = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
  MQ.minorBySharps = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#"];
  MQ.minorByFlats = ["A", "D", "G", "C", "F", "Bb", "Eb", "Ab"];

  /* ---------- Arabic maqamat (cents from the tonic; 50 = quarter tone) ----------
     Degree names follow the Arabic pitch names used in the course. */
  MQ.degreeNames = {
    G3: { ar: "يكاه", en: "Yakah" }, A3: { ar: "عشيران", en: "ʿUshayran" }, "Bhf3": { ar: "عراق", en: "ʿIraq" },
    C4: { ar: "راست", en: "Rast" }, D4: { ar: "دوكاه", en: "Dukah" }, Eb4: { ar: "كرد", en: "Kurd" }, "Ehf4": { ar: "سيكاه", en: "Sikah" },
    F4: { ar: "جهاركاه", en: "Jaharkah" }, "F#4": { ar: "حجاز", en: "Hijaz" }, G4: { ar: "نوى", en: "Nawa" }, Ab4: { ar: "حصار", en: "Hisar" },
    A4: { ar: "حسيني", en: "Husayni" }, Bb4: { ar: "عجم", en: "ʿAjam" }, "Bhf4": { ar: "أوج", en: "Awj" }, B4: { ar: "ماهور", en: "Mahur" },
    C5: { ar: "كردان", en: "Kardan" }, D5: { ar: "محيّر", en: "Muhayyar" },
  };
  MQ.maqamat = [
    {
      id: "rast", ar: "راست", en: "Rast", tonic: "C4", fixed: false,
      notes: [["C4", 0], ["D4", 200], ["Ehf4", 350], ["F4", 500], ["G4", 700], ["A4", 900], ["Bhf4", 1050], ["C5", 1200]],
      ajnas: [{ from: 0, to: 3, ar: "راست على الراست", en: "Rast on Rast (C)" }, { from: 4, to: 7, ar: "راست على النوى", en: "Rast on Nawa (G)" }],
      join: "disjunct", gap: { ar: "بعد فاصل (فا–صول)", en: "a separating tone (F–G)" },
      origin: { ar: "كلمة فارسية تعني «المستقيم»؛ المقام الأساسي للموسيقى العربية. يقابل سلم دو الكبير مع خفض الدرجتين الثالثة والسابعة ربع صوت.", en: "Persian for “straight”; the foundation maqam of Arabic music. Like C major with the 3rd and 7th lowered by a quarter tone." },
      family: { ar: "السوزناك، الماهور، السوزدلار، الكردان، السيكاه", en: "Suznak, Mahur, Suzdalar, Kardan, Sikah" },
      songs: { ar: ["ولد الهدى فالكائنات ضياء", "رباعيات الخيام", "هلّت ليالي القمر"], en: ["Wulida al-Huda", "Rubaʿiyyat al-Khayyam", "Hallit Layali al-Qamar"] },
      mood: { ar: "وضوح الشخصية والوقار — نسمعه في الترانيم ولحن الأذان", en: "clear, dignified character — heard in hymns and the call to prayer" },
    },
    {
      id: "bayati", ar: "بياتي", en: "Bayati", tonic: "D4", fixed: false,
      notes: [["D4", 0], ["Ehf4", 150], ["F4", 300], ["G4", 500], ["A4", 700], ["Bb4", 800], ["C5", 1000], ["D5", 1200]],
      ajnas: [{ from: 0, to: 3, ar: "بياتي على الدوكاه", en: "Bayati on Dukah (D)" }, { from: 3, to: 6, ar: "نهاوند على النوى", en: "Nahawand on Nawa (G)" }],
      join: "conjunct", gap: { ar: "بعد مكمّل (دو–ري)", en: "a completing tone (C–D)" },
      origin: { ar: "مقام عربي أصيل يبدو بوضوح في الألحان الشعبية وفي استهلال المقرئين، وفي ألحان الكنيسة القبطية.", en: "A truly Arabic maqam: clear in folk tunes, in Quran recitation openings and in Coptic church melodies." },
      family: { ar: "الحسيني، المحيّر، البياتين", en: "Husayni, Muhayyar, Bayatayn" },
      songs: { ar: ["يا صلاة الزين", "بالذي أسكر", "كل ده كان ليه"], en: ["Ya Salat al-Zein", "Billadhi Askar", "Kull Da Kan Leih"] },
      mood: { ar: "دفء وقرب من الناس", en: "warm and close to the people" },
    },
    {
      id: "kurd", ar: "كرد", en: "Kurd", tonic: "D4", fixed: true,
      notes: [["D4", 0], ["Eb4", 100], ["F4", 300], ["G4", 500], ["A4", 700], ["Bb4", 800], ["C5", 1000], ["D5", 1200]],
      ajnas: [{ from: 0, to: 3, ar: "كرد على الدوكاه", en: "Kurd on Dukah (D)" }, { from: 4, to: 7, ar: "كرد على الحسيني", en: "Kurd on Husayni (A)" }],
      join: "disjunct", gap: { ar: "بعد فاصل (صول–لا)", en: "a separating tone (G–A)" },
      origin: { ar: "اسمه ينسبه إلى كردستان، ويكثر في الموسيقى الإسبانية. خالٍ من أرباع النغمات فيُعزف على الآلات الثابتة؛ ومن فصيلته الحجازكار كرد.", en: "Named after Kurdistan and common in Spanish music. It has no quarter tones, so fixed-pitch instruments can play it; Hijazkar Kurd belongs to its family." },
      family: { ar: "الحجازكار كرد", en: "Hijazkar Kurd" },
      songs: { ar: ["عوّدت عيني على رؤياك", "دليلي احتار", "يا ظالمني", "ياللي كان يشجيك أنيني"], en: ["ʿAwwadt ʿEini", "Dalili Ihtar", "Ya Zalemni", "Yalli Kan Yishgik Anini"] },
      mood: { ar: "رقيق عذب شيّق", en: "tender, sweet and engaging" },
    },
    {
      id: "nahawand", ar: "نهاوند", en: "Nahawand", tonic: "C4", fixed: true,
      notes: [["C4", 0], ["D4", 200], ["Eb4", 300], ["F4", 500], ["G4", 700], ["Ab4", 800], ["B4", 1100], ["C5", 1200]],
      ajnas: [{ from: 0, to: 3, ar: "نهاوند على الراست", en: "Nahawand on Rast (C)" }, { from: 4, to: 7, ar: "حجاز على النوى", en: "Hijaz on Nawa (G)" }],
      join: "disjunct", gap: { ar: "بعد فاصل (فا–صول)", en: "a separating tone (F–G)" },
      origin: { ar: "اسم مدينة فارسية. يقابل سلم دو الصغير الهارموني، فهو مشترك بين الموسيقى العربية والغربية ويُعزف على الآلات الثابتة.", en: "Named after a Persian city. It matches C harmonic minor, so it is shared by Arabic and Western music and fixed instruments can play it." },
      family: { ar: "الفرحفزا، العشاق المصري", en: "Farahfaza, ʿUshshaq Masri" },
      songs: { ar: ["رقّ الحبيب", "جددت حبك ليه", "أهل الهوى", "أيظن"], en: ["Raqq al-Habib", "Gaddidt Hubbak Leih", "Ahl al-Hawa", "A-Yazunnu"] },
      mood: { ar: "رقيق عذب يناسب الألحان العاطفية الحزينة", en: "tender; suits emotional, sad melodies" },
    },
    {
      id: "hijaz", ar: "حجاز", en: "Hijaz", tonic: "D4", fixed: true,
      notes: [["D4", 0], ["Eb4", 100], ["F#4", 400], ["G4", 500], ["A4", 700], ["Bb4", 800], ["C5", 1000], ["D5", 1200]],
      ajnas: [{ from: 0, to: 3, ar: "حجاز على الدوكاه", en: "Hijaz on Dukah (D)" }, { from: 4, to: 7, ar: "كرد على الحسيني", en: "Kurd on Husayni (A)" }],
      join: "disjunct", gap: { ar: "بعد فاصل (صول–لا)", en: "a separating tone (G–A)" },
      origin: { ar: "من أشهر المقامات شرقًا وغربًا: في أغاني الرعاة وفي روائع المؤلفات الغربية. يُعزف على الآلات الثابتة ما لم تعترضه درجة الأوج بدل العجم.", en: "Among the best-known maqams East and West — in shepherds' songs and in Western masterpieces. Playable on fixed instruments unless Awj replaces ʿAjam." },
      family: { ar: "مشتق من الدرجة الثالثة لمقام العجم عشيران", en: "derived from the 3rd degree of ʿAjam ʿUshayran" },
      songs: { ar: ["الحلوة دي قامت تعجن", "أسمر يا أسمراني", "أنا في انتظارك"], en: ["El-Helwa Di", "Asmar ya Asmarani", "Ana fi Intizarak"] },
      mood: { ar: "الشجن والرحابة الصحراوية", en: "yearning and desert spaciousness" },
    },
  ];
  MQ.joins = {
    disjunct: { ar: "جمع منفصل: بين الجنسين بعد فاصل", en: "Disjunct: a separating tone between the two ajnas" },
    conjunct: { ar: "جمع متصل: آخر نغمة في الجنس الأول هي أول نغمة في الثاني، ويُختم ببعد مكمّل", en: "Conjunct: the last note of the first jins is the first of the second, closed by a completing tone" },
    overlap: { ar: "جمع متداخل: يبدأ الجنس الثاني من النغمة الثالثة للأول، ويُختم ببعدين مكمّلين", en: "Overlapping: the second jins starts on the 3rd note of the first, closed by two completing tones" },
  };

  /* ---------- Arabic rhythms (iqaʿat) — D = dum, T = tak, . = rest; unit = eighth ---------- */
  MQ.iqaat = [
    { id: "thaqil", ar: "سماعي ثقيل", en: "Samaʿi Thaqil", meter: "10/8", p: "D..T.DDT..", use: { ar: "الخانات الثلاث الأولى والتسليم في السماعي، ويؤدى عليه الموشح", en: "the first three khanas and taslim of a samaʿi; muwashshahat too" } },
    { id: "aqsaq", ar: "سماعي أقصاق", en: "Samaʿi Aqsaq", meter: "9/8", p: "D.T.DDT.T", use: { ar: "من ضروب السماعي والموشحات", en: "a samaʿi and muwashshah cycle" } },
    { id: "darij", ar: "سماعي دارج", en: "Samaʿi Darij", meter: "3/4", p: "D.T.T.", use: { ar: "الخانة الرابعة في السماعي غالبًا", en: "usually the fourth khana of a samaʿi" } },
    { id: "wahda", ar: "الوحدة الكبيرة", en: "Wahda Kabira", meter: "4/4", p: "D...T.T.", use: { ar: "يُوزن عليها الدور غالبًا، ومعها المصمودي", en: "the usual cycle of the dawr, along with masmudi" } },
    { id: "sarband", ar: "سماعي سربند", en: "Samaʿi Sarband", meter: "3/8", p: "DTT", use: { ar: "بديل للخانة الرابعة في السماعي", en: "an alternative for the fourth khana" } },
  ];

  /* ---------- orchestra (numbers as listed in the course) ---------- */
  MQ.families = {
    strings: { ar: "الوتريات", en: "Strings", feel: { ar: "إحساس مرهف بالحنين والعاطفة والاشتياق — أحسن من يعبر عن العاطفيات", en: "tender longing and emotion — the best voice for feeling" } },
    wood: { ar: "النفخ الخشبية", en: "Woodwinds", feel: { ar: "الهدوء والسكينة والأحلام الهادئة — كثيرة الاستعمال في الريفيات ووصف الطبيعة", en: "calm, serenity and gentle dreams — the countryside and nature" } },
    brass: { ar: "النفخ النحاسية", en: "Brass", feel: { ar: "الحماسة والشجاعة والبطولة والنصر والخطر — المعارك والعروض العسكرية", en: "zeal, courage, heroism, victory and danger — battles and parades" } },
    perc: { ar: "الإيقاعيات", en: "Percussion", feel: { ar: "المفاجأة والترقب وغرابة شيء سيحدث", en: "surprise and the feeling that something is about to happen" } },
  };
  MQ.instruments = [
    { id: "violin1", fam: "strings", voice: "violin", ar: "الفيولينة الأولى", en: "First violins", n: 16, f: 659,
      d: { ar: "تُحمل على كتف العازف تحت ذقنه وتُعزف بالقوس، وتعطي إحساسًا مرهفًا بصوت السوبرانو النسائي الحاد.", en: "Held on the shoulder under the chin and bowed; it gives the delicate feel of a high soprano voice." } },
    { id: "violin2", fam: "strings", voice: "violin", ar: "الفيولينة الثانية", en: "Second violins", n: 14, f: 523,
      d: { ar: "نفس الآلة بدور مرافق يدعم اللحن ويملأ الهارموني.", en: "The same instrument in a supporting role that fills the harmony." } },
    { id: "viola", fam: "strings", voice: "viola", ar: "الفيولا", en: "Violas", n: 10, f: 392,
      d: { ar: "أكبر قليلًا من الكمان، وسطية الصوت، تصنع التوازن (Balance) بين الآلات الحادة والغليظة.", en: "Slightly larger than the violin with a middle voice; it balances high and low instruments." } },
    { id: "cello", fam: "strings", voice: "cello", ar: "التشيلو (الفيولونسيل)", en: "Cellos", n: 10, f: 196,
      d: { ar: "توضع بين رجلي العازف الجالس، غليظة الصوت، وتسمى في أوروبا «بالأمومة».", en: "Played seated between the knees; a deep voice that Europeans call “motherhood”." } },
    { id: "bass", fam: "strings", voice: "contrabass", ar: "الكونترباص", en: "Double basses", n: 8, f: 82,
      d: { ar: "أكبر أفراد عائلة الكمان، يُعزف واقفًا، صوته جهير يشبه صوت الفيلة أو الشيخ الهرم، وله أثر هارموني مهم.", en: "The largest of the violin family, played standing; its huge voice is likened to elephants or an old man." } },
    { id: "harp", fam: "strings", voice: "harp", ar: "الهارب", en: "Harp", n: 2, f: 440,
      d: { ar: "أقدم الآلات الوترية، متطورة عن الصنج الفرعوني. تُعزف بالأصابع وصوتها متقطع (Staccato) يشبه المطر.", en: "The oldest stringed instrument, from the Pharaonic harp; plucked with fingers, its detached sound is like rain." } },
    { id: "piano", fam: "strings", voice: "piano", ar: "البيانو", en: "Piano", n: 1, f: 523,
      d: { ar: "اسمه يعني «الناعم». آلة لوحة مفاتيح متطورة عن الهاربسكورد، أوتارها تُطرق بمطارق خاصة.", en: "Its name means “soft”. A keyboard descended from the harpsichord; hammers strike its strings." } },
    { id: "piccolo", fam: "wood", voice: "flute", ar: "البيكولو", en: "Piccolo", n: 1, f: 1175,
      d: { ar: "ناي صغير جانبي أحدّ من الفلوت.", en: "A small side-blown flute, higher than the flute." } },
    { id: "flute", fam: "wood", voice: "flute", ar: "الفلوت", en: "Flutes", n: 2, f: 784,
      d: { ar: "آلة نفخ خشبية جانبية تُمسك مائلة على شفاه العازف.", en: "A side-blown woodwind held slanted against the lips." } },
    { id: "oboe", fam: "wood", voice: "oboe", ar: "الأوبوا", en: "Oboes", n: 2, f: 587,
      d: { ar: "خشبية ذات ريشة، صوتها أخنف يشبه صوت البط.", en: "A reed woodwind with a nasal voice likened to a duck." } },
    { id: "ehorn", fam: "wood", voice: "ehorn", ar: "الكور أنجليه", en: "English horn", n: 1, f: 440,
      d: { ar: "خشبية ذات ريشة، صوتها يميل إلى الحزن.", en: "A reed woodwind whose voice leans towards sadness." } },
    { id: "clarinet", fam: "wood", voice: "clarinet", ar: "الكلارينيت", en: "Clarinets", n: 2, f: 440,
      d: { ar: "خشبية ذات ريشة، صوتها صافٍ نقي كالشعاع.", en: "A reed woodwind with a pure voice, like a ray of light." } },
    { id: "bclar", fam: "wood", voice: "clarinet", ar: "الباص كلارينيت", en: "Bass clarinet", n: 1, f: 147,
      d: { ar: "الأخ الأكبر للكلارينيت بصوت عميق.", en: "The clarinet's big brother, with a deep voice." } },
    { id: "bassoon", fam: "wood", voice: "bassoon", ar: "الفاجوت (الباصون)", en: "Bassoons", n: 2, f: 131,
      d: { ar: "خشبية ذات ريشة صوتها غليظ.", en: "A reed woodwind with a low voice." } },
    { id: "cbassoon", fam: "wood", voice: "bassoon", ar: "الكونترا فاجوت", en: "Contrabassoon", n: 1, f: 65,
      d: { ar: "أغلظ آلات النفخ الخشبية.", en: "The lowest woodwind." } },
    { id: "horn", fam: "brass", voice: "horn", ar: "الكورنو الفرنسي", en: "French horns", n: 4, f: 349,
      d: { ar: "أقوى الآلات النحاسية صوتًا وأغلظها، لها التواءات شبيهة بالأمعاء لتخرج صوتًا مضغوطًا.", en: "The strongest and lowest-sounding brass as taught in the course; its coils, like intestines, give a compressed tone." } },
    { id: "trumpet", fam: "brass", voice: "trumpet", ar: "الترومبيت", en: "Trumpets", n: 2, f: 523,
      d: { ar: "البوق؛ صوته متوسط الطبقة، وله أزرار (Valves) لتغيير النظام الصوتي.", en: "The bugle's cousin; a middle voice with valves to change the pitch series." } },
    { id: "trombone", fam: "brass", voice: "trombone", ar: "الترومبون", en: "Trombones", n: 2, f: 233,
      d: { ar: "نحاسية شبيهة بالترومبيت لكن لها زلاقة بدل الأزرار.", en: "Brass like the trumpet, but with a slide instead of valves." } },
    { id: "btrombone", fam: "brass", voice: "trombone", ar: "الباص ترومبون", en: "Bass trombone", n: 1, f: 117,
      d: { ar: "ترومبون بطبقة أغلظ.", en: "A lower trombone." } },
    { id: "tuba", fam: "brass", voice: "tuba", ar: "التوبا", en: "Tuba", n: 1, f: 73,
      d: { ar: "نحاسية صوتها جهير جدًا وكثيرة الالتواءات، تُحمل على صدر العازف، وتستخدم في الموسيقى العسكرية.", en: "Very deep, heavily coiled brass carried on the chest; common in military music." } },
    { id: "timpani", fam: "perc", voice: "timpani", ar: "التيمباني", en: "Timpani", n: 2, f: 98,
      d: { ar: "الطبول النحاسية (Kettle drum) أهم طبول الأوركسترا.", en: "The kettle drums — the orchestra's principal drums." } },
    { id: "bdrum", fam: "perc", voice: "bassdrum", ar: "الطبلة الكبيرة", en: "Bass drum", n: 1, f: 55,
      d: { ar: "تُعلّق على كتف العازف أمام بطنه وتُضرب بعصا رأسها إسفنج مضغوط.", en: "Hung in front of the player and struck with a felt-headed beater." } },
    { id: "snare", fam: "perc", voice: "snare", ar: "الطبلة الحربية", en: "Military drum", n: 1, f: 200,
      d: { ar: "طبلة الإيقاعات العسكرية الحادة.", en: "The crisp drum of marches." } },
    { id: "cymbals", fam: "perc", voice: "cymbal", ar: "الصنجات", en: "Cymbals", n: 1, f: 0,
      d: { ar: "نحاسية دائرية يُطرق أحدها بالآخر.", en: "Round brass plates struck together." } },
    { id: "triangle", fam: "perc", voice: "triangle", ar: "المثلث", en: "Triangle", n: 1, f: 0,
      d: { ar: "مثلث معدني يُحمل باليد ويُضرب بقضيب معدني.", en: "A metal triangle held in the hand and struck with a metal rod." } },
    { id: "gong", fam: "perc", voice: "gong", ar: "الجونج", en: "Gong", n: 1, f: 0,
      d: { ar: "قرص معدني كبير بصوت ممتد مهيب.", en: "A large metal disc with a long, solemn ring." } },
    { id: "xylo", fam: "perc", voice: "xylophone", ar: "الإكسيلفون", en: "Xylophone", n: 1, f: 1047,
      d: { ar: "الآلة الإيقاعية الوحيدة التي تخرج أصواتًا نغمية وإيقاعية معًا، وتُستخدم كثيرًا في فرق الأطفال.", en: "The only percussion instrument that plays both pitches and rhythm; common in children's bands." } },
  ];

  /* ---------- eras ---------- */
  MQ.eras = [
    {
      id: "baroque", ar: "عصر الباروك", en: "Baroque", from: 1550, to: 1700,
      word: { ar: "الكلمة تعني التعقيد والتكلّف والإفراط في الزخرفة، واستُعيرت من فن العمارة والملابس.", en: "The word means complexity and excessive ornament, borrowed from architecture and dress." },
      traits: { ar: ["الطابع الخطابي والنسيج البوليفوني الديني", "عدد الآلات قليل", "الوتريات طاغية، والخشبيات قليلة، والنحاسيات نادرة جدًا", "آلة الهاربسكورد هي الأهم"], en: ["Rhetorical character and sacred polyphonic texture", "Few instruments", "Strings dominate; woodwinds are few, brass very rare", "The harpsichord is the key instrument"] },
      forms: { ar: ["الأوبرا", "الأوراتوريو", "الموتيت", "القداس", "الباسيون", "الكانتاتا", "الآريا", "المادريجال", "الافتتاحية", "السويت (المتتابعة)", "الكانون", "الابتكارات", "التنويعات", "الفيوج", "السوناتا", "سوناتا التريو", "الكونشرتو جروسو"], en: ["Opera", "Oratorio", "Motet", "Mass", "Passion", "Cantata", "Aria", "Madrigal", "Overture", "Suite", "Canon", "Inventions", "Variations", "Fugue", "Sonata", "Trio sonata", "Concerto grosso"] },
      people: [
        { ar: "مونتفردي", en: "Monteverdi" }, { ar: "لولي", en: "Lully" }, { ar: "رامو", en: "Rameau" },
        { ar: "فيفالدي — الفصول الأربعة", en: "Vivaldi — The Four Seasons" }, { ar: "هاندل — كونشرتو جروسو", en: "Handel — Concerti grossi" }, { ar: "باخ — كونشرتات براندنبورغ", en: "Bach — Brandenburg Concertos" },
      ],
    },
    {
      id: "classical", ar: "العصر الكلاسيكي", en: "Classical", from: 1700, to: 1800,
      word: { ar: "من اللاتينية «كلاسيكوس»: الطبقة الراقية الممتازة — موسيقى النخبة والبلاط.", en: "From Latin classicus: the finest class — music of the elite and the courts." },
      traits: { ar: ["لغة التوازن والإتقان وتكامل الشكل", "طابع هادئ رزين لا يحيد عن الأعراف البنائية", "وضوح سير الألحان ووضوح القفلات", "غلبة الطابع الدرامي: التعبير عن الصراع", "القوة والبساطة معًا"], en: ["A language of balance, polish and complete form", "Calm, dignified and faithful to structural conventions", "Clear melodies and clear cadences", "A dramatic character: expressing conflict", "Strength and simplicity together"] },
      forms: { ar: ["سوناتا البيانو", "صيغة السوناتا", "السيمفونية", "الكونشرتو", "السرينادا والديفرتيمنتو", "موسيقى الحجرة", "الموسيقى الدينية", "الأوبرا كوميك، الزنجشبيل، الأوبرا بوفا"], en: ["Piano sonata", "Sonata form", "Symphony", "Concerto", "Serenade & divertimento", "Chamber music", "Sacred music", "Opéra comique, Singspiel, opera buffa"] },
      people: [
        { ar: "هايدن (1732–1809) — أبو السيمفونية", en: "Haydn (1732–1809) — father of the symphony" },
        { ar: "موتسارت (1756–1791) — الطفل المعجزة", en: "Mozart (1756–1791) — the child prodigy" },
        { ar: "بيتهوفن (1770–1827) — الموسيقار المخضرم", en: "Beethoven (1770–1827) — spanning two eras" },
        { ar: "جلوك — الأوبرا", en: "Gluck — opera" },
      ],
    },
    {
      id: "romantic", ar: "العصر الرومانتيكي", en: "Romantic", from: 1800, to: 1900,
      word: { ar: "من أقاصيص «الرومانس» المليئة بالخيال ومغامرات الفروسية؛ ظهرت في إنجلترا ثم فرنسا ثم ألمانيا، وتأثر بها الشعر أولًا ثم التصوير ثم الموسيقى.", en: "From the “romances” full of fantasy and chivalry; it rose in England, then France, then Germany — poetry first, then painting, then music." },
      traits: { ar: ["الثورة في الفن والعنف في الإحساس", "الاندفاع والحب والمغامرة", "التغني بالطبيعة والحب", "الاستغراق في الخيال والأحلام", "أوركسترا ضخمة وتوزيع ملوّن"], en: ["Revolution in art, intensity of feeling", "Passion, love and adventure", "Singing of nature and love", "Deep dives into fantasy and dreams", "A huge, colourful orchestra"] },
      forms: { ar: ["السيمفونية التصويرية", "الافتتاحية التصويرية", "الليد (الأغنية الرفيعة)", "القطع الصغيرة للبيانو", "القصيد السيمفوني", "المتتالية التصويرية", "الدراما الموسيقية", "الكونشرتو الحديث"], en: ["Programme symphony", "Concert overture", "Lied (art song)", "Short piano pieces", "Symphonic poem", "Programme suite", "Music drama", "The modern concerto"] },
      people: [
        { ar: "شوبرت — صاحب الليد", en: "Schubert — master of the Lied" }, { ar: "برليوز", en: "Berlioz" }, { ar: "ليست — القصيد السيمفوني", en: "Liszt — the symphonic poem" },
        { ar: "فاجنر — الدراما الموسيقية واللحن الدال", en: "Wagner — music drama & the leitmotif" }, { ar: "تشايكوفسكي — بحيرة البجع", en: "Tchaikovsky — Swan Lake" },
        { ar: "ريمسكي كورساكوف — شهرزاد", en: "Rimsky-Korsakov — Scheherazade" }, { ar: "ديبوسي — التأثيرية", en: "Debussy — Impressionism" },
      ],
    },
  ];

  /* ---------- symphony & sonata form ---------- */
  MQ.symphony = [
    { tempo: 150, ar: "الحركة الأولى", en: "Movement I", form: { ar: "سريعة — صيغة السوناتا", en: "Fast — sonata form" }, term: "Allegro" },
    { tempo: 66, ar: "الحركة الثانية", en: "Movement II", form: { ar: "بطيئة غنائية — ثلاثية أو لحن وتنويعاته", en: "Slow, lyrical — ternary or theme & variations" }, term: "Andante" },
    { tempo: 120, ar: "الحركة الثالثة", en: "Movement III", form: { ar: "مينويت وتريو أو سكيرتزو — ميزان ثلاثي راقص", en: "Minuet & trio or scherzo — a triple-time dance" }, term: "Menuetto" },
    { tempo: 170, ar: "الحركة الرابعة", en: "Movement IV", form: { ar: "سريعة — روندو أو سوناتا أو تنويعات", en: "Fast — rondo, sonata or variations" }, term: "Finale" },
  ];
  MQ.sonataForm = [
    { id: "intro", ar: "المقدمة", en: "Introduction", d: { ar: "اختيارية، تشد الانتباه — مثل كوردات بداية السيمفونية الثالثة لبيتهوفن.", en: "Optional; grabs attention — like the opening chords of Beethoven's Third." } },
    { id: "t1", ar: "الموضوع الأول", en: "First subject", d: { ar: "في سلم الأساس (Tonic). قوي إيقاعي «مذكّر الطابع»، فكرة واحدة غالبًا.", en: "In the tonic. Strong and rhythmic, often one idea." } },
    { id: "bridge", ar: "القنطرة", en: "Transition", d: { ar: "تقود إلى الموضوع الثاني ومقامه الجديد.", en: "Leads to the second subject and its new key." } },
    { id: "t2", ar: "الموضوع الثاني", en: "Second subject", d: { ar: "في سلم الدرجة الخامسة أو القريب الكبير (Key contrast). رقيق لحني «مؤنث الطابع».", en: "In the dominant or relative major (key contrast). Gentle and lyrical." } },
    { id: "dev", ar: "التفاعل", en: "Development", d: { ar: "انتقالات مقامية جريئة وعديدة — هنا تظهر براعة المؤلف.", en: "Bold, frequent modulations — the composer's skill shows here." } },
    { id: "recap", ar: "إعادة العرض", en: "Recapitulation", d: { ar: "يعود الموضوعان كلاهما في سلم الأساس ليعود التوازن والاستقرار.", en: "Both subjects return in the tonic, restoring balance." } },
    { id: "coda", ar: "الكودا", en: "Coda", d: { ar: "تقوّي الختام؛ صارت أساسية منذ بيتهوفن.", en: "Strengthens the ending; standard since Beethoven." } },
  ];

  /* ---------- operas listed in the course ---------- */
  MQ.operas = [
    { ar: "عايدة", en: "Aida", by: { ar: "فيردي", en: "Verdi" }, where: { ar: "ممفيس وطيبة — عهد الفراعنة", en: "Memphis & Thebes — Pharaonic era" } },
    { ar: "كارمن", en: "Carmen", by: { ar: "بيزيه", en: "Bizet" }, where: { ar: "إسبانيا — 1830", en: "Spain — 1830" } },
    { ar: "فيديليو", en: "Fidelio", by: { ar: "بيتهوفن", en: "Beethoven" }, where: { ar: "إسبانيا — القرن 18", en: "Spain — 18th c." } },
    { ar: "سالومي", en: "Salome", by: { ar: "ريتشارد شتراوس", en: "R. Strauss" }, where: { ar: "فلسطين — 30 ق.م", en: "Palestine — 30 BC" } },
    { ar: "أورفيو ويوريديس", en: "Orfeo ed Euridice", by: { ar: "جلوك", en: "Gluck" }, where: { ar: "اليونان والعالم السفلي", en: "Greece & the underworld" } },
    { ar: "لاترافياتا", en: "La traviata", by: { ar: "فيردي", en: "Verdi" }, where: { ar: "باريس — 1850", en: "Paris — 1850" } },
    { ar: "التروبادور", en: "Il trovatore", by: { ar: "فيردي", en: "Verdi" }, where: { ar: "إسبانيا", en: "Spain" } },
    { ar: "حلاق إشبيلية", en: "The Barber of Seville", by: { ar: "روسيني", en: "Rossini" }, where: { ar: "إشبيلية", en: "Seville" } },
    { ar: "البوهيمية", en: "La bohème", by: { ar: "بوتشيني", en: "Puccini" }, where: { ar: "باريس — 1830", en: "Paris — 1830" } },
    { ar: "روميو وجولييت", en: "Roméo et Juliette", by: { ar: "جونو", en: "Gounod" }, where: { ar: "فيرونا — القرن 14", en: "Verona — 14th c." } },
  ];


  /* ---------- "Guess the melody" — public-domain tunes only (pre-1929 / folk) ----------
     Format: NOTE/beats (default 1 beat); r = rest. Sharps "F#4", flats "Bb4",
     quarter-tone half-flats "Ehf4" / "Bhf4" (Sikah / Awj) — so Arabic & Palestinian
     folk tunes in Rast or Bayati can be added exactly. Example entry:
     { id: "dalouna", ar: "على دلعونا", en: "ʿAla Dalʿuna", by: { ar: "تراث فلسطيني شعبي", en: "Palestinian folk" }, bpm: 100, n: "D4 Ehf4 F4 G4/2 ..." },
     Only add a tune after its notes are checked by a musician. */
  MQ.melodies = [
    { id: "bday", ar: "سنة حلوة يا جميل", en: "Happy Birthday", by: { ar: "الأختان ميلدريد وباتي هيل، 1893 — تُغنّى بالعربية «سنة حلوة يا جميل»", en: "Mildred & Patty Hill, 1893 — sung in Arabic as “Sana Helwa ya Gamil”" }, bpm: 100, n: "G4/.75 G4/.25 A4 G4 C5 B4/2 G4/.75 G4/.25 A4 G4 D5 C5/2 G4/.75 G4/.25 G5 E5 C5 B4 A4/2 F5/.75 F5/.25 E5 C5 D5 C5/2" },
    { id: "twinkle", ar: "أغنية الحروف ABC / تلألأ يا نجمًا صغيرًا", en: "The ABC Song / Twinkle, Twinkle", by: { ar: "لحن فرنسي شعبي، 1761 — عليه تُغنّى أغنية الحروف الإنجليزية وأغنية النجمة", en: "French folk tune, 1761 — the tune of both the ABC song and Twinkle, Twinkle" }, bpm: 112, n: "C4 C4 G4 G4 A4 A4 G4/2 F4 F4 E4 E4 D4 D4 C4/2" },
    { id: "joy", ar: "نشيد الفرح", en: "Ode to Joy", by: { ar: "بيتهوفن — السيمفونية التاسعة «الكورالية»، 1824", en: "Beethoven — Symphony No. 9 “Choral”, 1824" }, bpm: 120, n: "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4/1.5 D4/.5 D4/2" },
    { id: "elise", ar: "إلى إليزا", en: "Für Elise", by: { ar: "بيتهوفن، 1810", en: "Beethoven, 1810" }, bpm: 138, n: "E5/.5 D#5/.5 E5/.5 D#5/.5 E5/.5 B4/.5 D5/.5 C5/.5 A4/1.5 r/.5 C4/.5 E4/.5 A4/.5 B4/1.5 r/.5 E4/.5 G#4/.5 B4/.5 C5/1.5" },
    { id: "fifth", ar: "سيمفونية القدر (الخامسة)", en: "Symphony No. 5 “Fate”", by: { ar: "بيتهوفن، 1808", en: "Beethoven, 1808" }, bpm: 108, n: "r/.5 G4/.5 G4/.5 G4/.5 Eb4/3 r/.5 F4/.5 F4/.5 F4/.5 D4/3" },
    { id: "moz40", ar: "السيمفونية رقم 40 في صول الصغير", en: "Symphony No. 40 in G minor", by: { ar: "موتسارت، 1788", en: "Mozart, 1788" }, bpm: 132, n: "Eb5/.5 D5/.5 D5 Eb5/.5 D5/.5 D5 Eb5/.5 D5/.5 D5 Bb5 r/.5 Bb5/.5 A5/.5 G5/.5 G5 F5/.5 Eb5/.5 Eb5 D5/.5 C5/.5 C5" },
    { id: "nacht", ar: "موسيقى ليلية صغيرة", en: "Eine kleine Nachtmusik", by: { ar: "موتسارت، 1787", en: "Mozart, 1787" }, bpm: 120, n: "G4 r/.5 D4/.5 G4 r/.5 D4/.5 G4/.5 D4/.5 G4/.5 B4/.5 D5/2 C5 r/.5 A4/.5 C5 r/.5 A4/.5 C5/.5 A4/.5 F#4/.5 A4/.5 D4/2" },
    { id: "swan", ar: "بحيرة البجع", en: "Swan Lake", by: { ar: "تشايكوفسكي، 1876", en: "Tchaikovsky, 1876" }, bpm: 92, n: "E5/3 A4/.5 B4/.5 C5/.5 D5/.5 E5/1.5 C5/.5 E5/1.5 C5/.5 E5/1.5 A4/.5 C5/.5 A4/.5 F4/.5 C5/.5 A4/3" },
    { id: "spring", ar: "الربيع — الفصول الأربعة", en: "Spring — The Four Seasons", by: { ar: "فيفالدي، 1725", en: "Vivaldi, 1725" }, bpm: 112, n: "E4 G#4 G#4 G#4 F#4/.5 E4/.5 B4/2 B4/.5 A4/.5 G#4 G#4 G#4 F#4/.5 E4/.5 B4/2" },
    { id: "lullaby", ar: "تهويدة برامز", en: "Brahms' Lullaby", by: { ar: "برامز، 1868", en: "Brahms, 1868" }, bpm: 96, n: "E4/.5 E4/.5 G4/2 E4/.5 E4/.5 G4/2 E4/.5 G4/.5 C5 B4/1.5 A4/.5 A4 G4" },
    { id: "jingle", ar: "أجراس العيد (Jingle Bells)", en: "Jingle Bells", by: { ar: "جيمس بيربونت، 1857", en: "James Pierpont, 1857" }, bpm: 140, n: "E4 E4 E4/2 E4 E4 E4/2 E4 G4 C4/1.5 D4/.5 E4/4" },
    { id: "jacques", ar: "الأخ جاك (Frère Jacques)", en: "Frère Jacques", by: { ar: "لحن فرنسي شعبي", en: "French folk tune" }, bpm: 120, n: "C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4/2 E4 F4 G4/2" },
    { id: "mary", ar: "ماري عندها خروف صغير", en: "Mary Had a Little Lamb", by: { ar: "أغنية أطفال، 1830", en: "Children's song, 1830" }, bpm: 120, n: "E4 D4 C4 D4 E4 E4 E4/2 D4 D4 D4/2 E4 G4 G4/2" },
    { id: "turkish", ar: "المارش التركي", en: "Turkish March (Rondo alla turca)", by: { ar: "موتسارت، 1783", en: "Mozart, 1783" }, bpm: 120, n: "B4/.25 A4/.25 G#4/.25 A4/.25 C5 D5/.25 C5/.25 B4/.25 C5/.25 E5 F5/.25 E5/.25 D#5/.25 E5/.25 B5/.25 A5/.25 G#5/.25 A5/.25 B5/.25 A5/.25 G#5/.25 A5/.25 C6/2" },
    { id: "bridal", ar: "مارش العروس «ها هي العروس»", en: "Bridal Chorus “Here Comes the Bride”", by: { ar: "فاغنر — أوبرا لوهنغرين، 1850", en: "Wagner — Lohengrin, 1850" }, bpm: 76, n: "C4 F4/.75 F4/.25 F4/2 C4 G4/.75 E4/.25 F4/2" },
    { id: "silent", ar: "الليلة الهادئة (Silent Night)", en: "Silent Night", by: { ar: "فرانز غروبر، 1818", en: "Franz Gruber, 1818" }, bpm: 96, n: "G4/1.5 A4/.5 G4 E4/3 G4/1.5 A4/.5 G4 E4/3 D5/2 D5 B4/3 C5/2 C5 G4/3" },
    { id: "grace", ar: "Amazing Grace", en: "Amazing Grace", by: { ar: "لحن «نيو بريتن» الأمريكي، 1835", en: "American tune “New Britain”, 1835" }, bpm: 96, n: "D4 G4/2 B4/.5 G4/.5 B4/2 A4 G4/2 E4 D4/2 D4 G4/2 B4/.5 G4/.5 B4/2 A4 D5/3" },
    { id: "macdonald", ar: "العم ماكدونالد عنده مزرعة", en: "Old MacDonald Had a Farm", by: { ar: "أغنية أطفال شعبية، 1917", en: "Traditional children's song, 1917" }, bpm: 126, n: "G4 G4 G4 D4 E4 E4 D4/2 B4 B4 A4 A4 G4/2" },
    { id: "london", ar: "جسر لندن يتهاوى", en: "London Bridge Is Falling Down", by: { ar: "أغنية أطفال إنجليزية تقليدية", en: "Traditional English nursery rhyme" }, bpm: 116, n: "G4/1.5 A4/.5 G4 F4 E4 F4 G4/2 D4 E4 F4/2 E4 F4 G4/2" },
    { id: "row", ar: "جدّف جدّف بقاربك", en: "Row, Row, Row Your Boat", by: { ar: "أغنية أطفال، 1852", en: "Nursery rhyme, 1852" }, bpm: 104, n: "C4/1.5 C4/1.5 C4 D4/.5 E4/1.5 E4 D4/.5 E4 F4/.5 G4/3" },
    { id: "yankee", ar: "يانكي دودل", en: "Yankee Doodle", by: { ar: "لحن أمريكي تقليدي، القرن 18", en: "Traditional American tune, 18th c." }, bpm: 120, n: "C4/.5 C4/.5 D4/.5 E4/.5 C4/.5 E4/.5 D4 C4/.5 C4/.5 D4/.5 E4/.5 C4 B3" },
  ];
  /* ---------- Arabic forms ---------- */
  MQ.arabicVocal = [
    { id: "folk", ar: "الأغنية الشعبية", en: "Folk song", d: { ar: "ألحان بسيطة يتناقلها الناس، غالبًا في ميزان ثنائي بسيط: «على دلعونا»، «عالهوى».", en: "Simple tunes passed between people, usually in simple duple time: “ʿAla Dalʿuna”, “ʿAl-Hawa”." }, parts: null },
    { id: "nashid", ar: "النشيد", en: "Nashid (anthem)", d: { ar: "شعر ملحّن يُنشد فرديًا وجماعيًا، غالبًا على 2/4 وبسرعة، وتقل فيه اللوازم كي لا يضيع معنى الكلام.", en: "Sung poetry, solo or in groups, usually brisk 2/4, with few interludes so the words stay clear." }, parts: null },
    { id: "muwash", ar: "الموشح", en: "Muwashshah", d: { ar: "منظومة يتغير فيها الوزن وتتنوع القوافي، تُؤدى على ضروب مثل السماعي الثقيل.", en: "A poem with shifting metre and varied rhymes, sung on cycles such as Samaʿi Thaqil." },
      parts: [{ ar: "الدور (البدنيات)", en: "Dawr (body)" }, { ar: "الخانة — من الدرجات الحادة لإبراز المغني", en: "Khana — high register for the soloist" }, { ar: "القفلة — لحن البدنية بكلمات أخرى", en: "Qafla — body melody, new words" }] },
    { id: "dawr", ar: "الدور", en: "Dawr", d: { ar: "غناء بالزجل ازدهر في مصر في عشرينيات القرن الماضي؛ اسمه يعني العودة إلى اللحن الأساسي.", en: "Colloquial song that flourished in 1920s Egypt; its name means returning to the main melody." },
      parts: [{ ar: "المذهب — تؤديه المجموعة", en: "Madhhab — sung by the chorus" }, { ar: "الأغصان — ينفرد بها المغني", en: "Aghsan — the soloist's branches" }, { ar: "الهنك — تبادل حرّ مع المجموعة", en: "Hank — free exchange with the chorus" }] },
    { id: "qasida", ar: "القصيدة", en: "Qasida", d: { ar: "شعر عمودي مقفّى، من أرقى أنواع الغناء، ملحّنة أو مرتجلة؛ طوّرها محمد القصبجي.", en: "Classical rhymed verse, among the finest forms, composed or improvised; developed by al-Qasabgi." }, parts: null },
    { id: "monolog", ar: "المونولوج", en: "Monologue", d: { ar: "غناء انفرادي يحكي قصة، ولد في الثلاثينيات على يد أحمد رامي والقصبجي: «رقّ الحبيب».", en: "A solo song that tells a story, born in the 1930s with Ahmad Rami and al-Qasabgi: “Raqq al-Habib”." }, parts: null },
    { id: "dialog", ar: "الديالوج", en: "Dialogue", d: { ar: "غناء ثنائي لمطرب ومطربة ضمن عمل درامي: «يا دي النعيم».", en: "A duet within a drama: “Ya Di al-Naʿim”." }, parts: null },
    { id: "taqtuqa", ar: "الطقطوقة", en: "Taqtuqa", d: { ar: "زجل خفيف: لازمة ← مذهب ← لازمة ← غصن ← مذهب…؛ لحّن منها زكريا أحمد «هو صحيح الهوى غلاب».", en: "Light song: interlude → madhhab → interlude → verse → madhhab…" }, parts: null },
    { id: "mawwal", ar: "الموال", en: "Mawwal", d: { ar: "فن شعبي على وزن البسيط، يتميز بالجناس.", en: "A folk form on the basit metre, full of wordplay (jinas)." },
      parts: [{ ar: "البغدادي — 4 أبيات بقافية واحدة", en: "Baghdadi — 4 lines, one rhyme" }, { ar: "الأعرج — 5 أبيات، الرابع مخالف", en: "Aʿraj — 5 lines, the 4th differs" }, { ar: "النعماني (السبعاوي) — 7 أبيات", en: "Nuʿmani — 7 lines" }] },
  ];
  MQ.arabicInstr = [
    { id: "samai", ar: "السماعي", en: "Samaʿi", d: { ar: "للاستماع؛ ثلاث خانات وتسليم على 10/8 والرابعة على الدارج أو السربند. الخانة الثالثة تحلّق في النغمات العليا.", en: "Music for listening: three khanas and a taslim in 10/8, the fourth in darij or sarband; the third khana soars high." }, ex: { ar: "سماعي بياتي العريان، سماعي حجازكار كرد لطاتيوس", en: "Samaʿi Bayati al-ʿUryan, Samaʿi Hijazkar Kurd (Tatyos)" } },
    { id: "taqasim", ar: "التقاسيم", en: "Taqasim", d: { ar: "ارتجال منفرد على غير ميزان يستعرض فيه العازف براعته — أجمله على الكمان والعود والناي والقانون.", en: "Unmetred solo improvisation showing the player's mastery — finest on violin, oud, nay and qanun." }, ex: null },
    { id: "longa", ar: "اللونجا", en: "Longa", d: { ar: "سريعة رشيقة على 2/4 (وأحيانًا 6/8)، أربع خانات وتسليم تبرز مهارة العازف.", en: "Fast and nimble in 2/4 (sometimes 6/8), four khanas and a taslim that show off technique." }, ex: null },
    { id: "bashraf", ar: "البشرف", en: "Bashraf", d: { ar: "كلمة فارسية تعني المقدمة؛ من أطول المؤلفات الآلية: أربع خانات يفصل بينها التسليم.", en: "Persian for “introduction”; among the longest instrumental forms: four khanas separated by a taslim." }, ex: null },
    { id: "dulab", ar: "الدولاب", en: "Dulab", d: { ar: "مقدمة قصيرة تستهل بها الأدوار والقصائد من مقام الأغنية، من 8 إلى 16 مازورة.", en: "A short prelude in the song's maqam, 8 to 16 bars, before a dawr or qasida." }, ex: null },
  ];
})();
